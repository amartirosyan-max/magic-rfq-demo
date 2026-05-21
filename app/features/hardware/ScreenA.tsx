import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useHardwareProject } from "./HardwareProjectContext";
import { Rack } from "./Rack";
import { useSelection } from "./SelectionContext";
import { RACK_MARGIN_X_PX, RACK_WIDTH_PX } from "./config";

/**
 * Scroll-pad on each side of the rack row.
 *
 *   pad = 50% (canvas) − rack-half − rack-margin
 *
 * Derived from the rack-constructor tokens (`RACK_WIDTH_PX`,
 * `RACK_MARGIN_X_PX`) so this stays in sync when the rack is retuned
 * via `config.ts`. The 50% resolves against the row's containing block
 * (the canvas), so at `scrollLeft = 0` the first rack's centre lands
 * exactly on the canvas centre, and at `scrollLeft = max` the last
 * rack's centre does too — *and no further*. `max(0px, …)` clamps
 * away from negative values on very narrow canvases.
 */
const SCROLL_PAD = `max(0px, calc(50% - ${
  RACK_WIDTH_PX / 2 + RACK_MARGIN_X_PX
}px))`;

/**
 * Screen A — multi-rack overview.
 *
 * Two layout modes, selected automatically based on whether the racks
 * fit the canvas:
 *
 *   - **Fits** (e.g. Avaya — 2 real racks + 2 decorative empty flanks
 *     for a 4-column composition).  No scroll-pad, `mx-auto` centres
 *     the row, and the framer-motion `translate-x` animation slides
 *     the selected rack to canvas centre — same behaviour the demo
 *     had before the multi-project refactor.
 *
 *   - **Overflows** (e.g. ADGSA-AI — 5 racks).  The row gets a
 *     `SCROLL_PAD` of `50% − half-rack-slot` on each side, so the
 *     user can horizontally pan from "first rack at canvas centre"
 *     to "last rack at canvas centre" — and not a pixel further.
 *     Selecting a rack smooth-scrolls it to centre via
 *     `scrollIntoView`; the transform animation is disabled in this
 *     mode so the two centring mechanisms don't fight.
 *
 * Centring rules:
 *   - On mount / project change → row midpoint sits under the pill.
 *   - While racks are still settling (e.g. images decoding change
 *     the row's scrollWidth), keep re-snapping IFF the user hasn't
 *     manually scrolled or picked a rack yet.
 *   - `Preview Proposal` and nav-row clicks call `resetView()` →
 *     `resetViewToken` bumps → smooth re-snap to the midpoint, even
 *     if the user had previously panned.
 *   - Plain background-click deselect leaves the scroll position
 *     alone so the user can keep panning.
 */
export function ScreenA() {
  const project = useHardwareProject();
  const { selectedRackId, selectRack, resetViewToken } = useSelection();
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const rackRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [overflow, setOverflow] = useState(false);

  /* `true` once the user actively interacts with the canvas — either by
   * scrolling manually or by selecting a rack.  After that we stop
   * auto-snapping to the midpoint on width changes so we don't fight
   * the user's intent. `resetView()` flips it back to `false`. */
  const userTookOverRef = useRef(false);
  /* The last scrollLeft value we set programmatically; used to ignore
   * the scroll event our own .scrollTo() triggers. */
  const programmaticTargetRef = useRef<number | null>(null);

  /* Render the racks as-is — empty decorative flanks (Avaya) included.
   * They were a deliberate composition tool in the original Avaya
   * demo (frame-only racks on either side of the two real ones), and
   * the new overflow path handles them transparently since they take
   * the same slot width as real racks. */
  const racks = project.racks;

  /* Snap the scroller so the row's midpoint sits under the canvas
   * centre.  No-op when the row is narrower than the canvas (FITS
   * mode handles centring via `mx-auto`).  `smooth` is true for
   * user-visible recentres (resetView), false for synchronous
   * pre-paint positioning on mount.  Returns the target it applied
   * (or `null` if it bailed). */
  const snapToCentre = (smooth: boolean): number | null => {
    const el = scrollRef.current;
    if (!el) return null;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return null;
    const target = max / 2;
    programmaticTargetRef.current = target;
    if (smooth) {
      el.scrollTo({ left: target, behavior: "smooth" });
    } else {
      el.scrollLeft = target;
    }
    return target;
  };

  /* Measure overflow.  We watch BOTH the canvas wrapper (viewport
   * resize) and the row itself (rack width changes, e.g. images
   * decoding) so the FITS ↔ OVERFLOW switch tracks reality. */
  useLayoutEffect(() => {
    const outer = scrollRef.current;
    const row = rowRef.current;
    if (!outer || !row) return;

    const measure = () => {
      const style = window.getComputedStyle(row);
      const padX =
        parseFloat(style.paddingLeft || "0") +
        parseFloat(style.paddingRight || "0");
      const racksWidth = row.scrollWidth - padX;
      setOverflow((curr) => {
        const next = racksWidth > outer.clientWidth + 0.5;
        return curr === next ? curr : next;
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(row);
    return () => ro.disconnect();
  }, [racks]);

  /* Initial centring — fires synchronously before paint so the user
   * never sees a flash of "scrolled-to-left" racks.  Re-runs while
   * scrollWidth keeps changing (images decoding, fonts loading) for
   * as long as the user hasn't taken over. */
  useLayoutEffect(() => {
    if (userTookOverRef.current) return;
    snapToCentre(false);
  }, [overflow, racks, project.id]);

  /* Detect user-driven scroll.  Compare against our own last
   * programmatic target so .scrollTo() doesn't get misattributed.
   * Once the user pans, stop auto-snapping until `resetView()` is
   * called. */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const expected = programmaticTargetRef.current;
      if (expected !== null && Math.abs(el.scrollLeft - expected) < 2) {
        programmaticTargetRef.current = null;
        return;
      }
      userTookOverRef.current = true;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  /* Selecting a rack counts as taking over — we'll route to it via
   * scrollIntoView (OVERFLOW) or translate-x (FITS) and skip the
   * auto-snap pass on subsequent width changes. */
  useEffect(() => {
    if (selectedRackId) userTookOverRef.current = true;
  }, [selectedRackId]);

  /* Translate-x amount for the FITS mode.  In OVERFLOW mode we leave
   * the row untransformed (x = 0) and rely on scrollIntoView for
   * centring — otherwise the two mechanisms would fight. */
  const rowOffsetPercent = useMemo(() => {
    if (overflow || !selectedRackId) return 0;
    const idx = racks.findIndex((r) => r.id === selectedRackId);
    if (idx < 0) return 0;
    const n = racks.length;
    if (n === 0) return 0;
    const centreIdx = (n - 1) / 2;
    return ((centreIdx - idx) * 100) / n;
  }, [overflow, selectedRackId, racks]);

  useEffect(() => {
    if (!overflow || !selectedRackId) return;
    const target = rackRefs.current[selectedRackId];
    if (!target) return;
    /* scrollIntoView issues its own scroll programmatically; record
     * the eventual scrollLeft so our scroll listener doesn't mistake
     * it for a user pan.  Compute the destination the same way
     * `inline: "center"` does so we can match it ±2 px. */
    const el = scrollRef.current;
    if (el) {
      const elRect = el.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      const delta =
        tRect.left - elRect.left + tRect.width / 2 - elRect.width / 2;
      programmaticTargetRef.current = el.scrollLeft + delta;
    }
    target.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [overflow, selectedRackId]);

  /* `Preview Proposal` / project-row clicks → `resetView()` bumps
   * `resetViewToken`.  Treat it as a hard "start over": clear the
   * user-took-over flag and re-snap the OVERFLOW scroller back to
   * the midpoint.  FITS mode is already perfectly centred by
   * `mx-auto` + the cleared `selectedRackId`. */
  useEffect(() => {
    if (resetViewToken === 0) return;
    userTookOverRef.current = false;
    if (!overflow) return;
    snapToCentre(true);
  }, [resetViewToken, overflow]);

  const hasSelection = selectedRackId !== null;

  return (
    <motion.div
      ref={scrollRef}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      onClick={() => {
        if (hasSelection) selectRack(null);
      }}
      className="relative flex flex-1 items-center overflow-x-auto overflow-y-hidden pb-12 pt-32 scrollbar-none"
    >
      {/* Equal-width rack slots via `mx-5` on each rack — slot =
          rackWidth + 40 px.  In FITS mode the carousel pill above is
          centred by `flex justify-center` on its own container, so the
          `((centreIdx − idx) × 100) / n` translate formula lands the
          focused rack exactly under the pill.  In OVERFLOW mode the
          pill stays put and the scroll container does the centring. */}
      <motion.div
        ref={rowRef}
        className="flex h-[55vh] w-max shrink-0 items-end mx-auto"
        animate={{ x: `${rowOffsetPercent}%` }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        style={{
          paddingLeft: overflow ? SCROLL_PAD : undefined,
          paddingRight: overflow ? SCROLL_PAD : undefined,
        }}
      >
        {racks.map((rack) => (
          <div
            key={rack.id}
            ref={(el) => {
              rackRefs.current[rack.id] = el;
            }}
            className="flex h-full items-end mx-5"
          >
            <Rack rack={rack} columnLabel={rack.columnLabel} />
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
