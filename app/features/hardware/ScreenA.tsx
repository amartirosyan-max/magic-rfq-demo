import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { useHardwareProject } from "./HardwareProjectContext";
import { Rack } from "./Rack";
import { useSelection } from "./SelectionContext";

/**
 * Scroll-pad on each side of the rack row, expressed in CSS so it tracks
 * the viewport without JS.
 *
 *   pad = 50% (canvas) − rack-half − rack-margin
 *       = 50% − (55vh × 342/912)/2 − 20 px
 *       = 50% − 10.3125 vh − 20 px
 *
 * The 50% resolves against the row's containing block (the canvas), so
 * at scrollLeft = 0 the first rack's centre lands exactly on the canvas
 * centre, and at scrollLeft = max the last rack's centre does too —
 * *and no further*.  Anything bigger (e.g. the previous `px-[50%]`)
 * lets the user scroll past the centre point, which is what the user
 * called "scrolls too much".  `max(0px, …)` clamps the pad away from
 * negative values on very narrow canvases.
 */
const SCROLL_PAD = "max(0px, calc(50% - 10.3125vh - 20px))";

/**
 * Screen A — multi-rack overview.
 *
 * Two layout modes, selected automatically based on whether the racks
 * fit the canvas:
 *
 *   - **Fits** (e.g. Avaya — 2 real racks once the decorative empty
 *     flanks are filtered out).  No scroll-pad, `mx-auto` centres the
 *     row, and the framer-motion `translate-x` animation slides the
 *     selected rack to canvas centre — the same behaviour the demo had
 *     before the multi-project refactor.
 *
 *   - **Overflows** (e.g. ADGSA-AI — 5 racks).  The row gets a
 *     `SCROLL_PAD` of `50% − half-rack-slot` on each side, so the user
 *     can horizontally pan from "first rack at canvas centre" to "last
 *     rack at canvas centre" — and not a pixel further.  Selecting a
 *     rack smooth-scrolls it to centre via `scrollIntoView`; the
 *     transform animation is disabled in this mode to avoid two
 *     centring mechanisms fighting each other.
 *
 * Clicking the canvas background still clears the selection but leaves
 * the user's manual scroll position alone, so they can keep panning.
 */
export function ScreenA() {
  const project = useHardwareProject();
  const { selectedRackId, selectRack, resetViewToken } = useSelection();
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const rackRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [overflow, setOverflow] = useState(false);
  const didInitialCentre = useRef(false);

  /* Empty decorative racks were a workaround for the old `justify-
   * center` layout; with scroll-based centring they're vestigial.
   * Filtering them here only — `project.racks` stays unchanged so
   * `CarouselControl` and the deletion guards in `HardwareLayout`
   * keep working without modification. */
  const racks = useMemo(
    () => project.racks.filter((r) => !r.isEmpty),
    [project.racks],
  );

  /* Measure whether the racks (excluding our own conditional padding)
   * are wider than the canvas.  Re-runs on viewport resize via a
   * ResizeObserver on the canvas wrapper. */
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
    return () => ro.disconnect();
  }, [racks]);

  /* Initial centring (once, after overflow has been determined).  We
   * land at the middle of the scroll range so the visual centre of the
   * project sits under the carousel pill, matching the previous
   * `justify-center` default. */
  useLayoutEffect(() => {
    if (didInitialCentre.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    el.scrollLeft = max / 2;
    didInitialCentre.current = true;
  }, [overflow]);

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
    target?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [overflow, selectedRackId]);

  /* `Preview Proposal` → `resetView()` bumps `resetViewToken`.  In FITS
   * mode the row is already perfectly centred by `mx-auto` + the
   * cleared `selectedRackId` (translate-x = 0); we only need to act in
   * OVERFLOW mode, where the user could have scrolled the previous
   * selection to centre and we want to snap back to "row midpoint =
   * canvas centre" — i.e. the same vantage point as initial mount.
   * Skip the first invocation (token === 0) so we don't fight the
   * initial-centring effect above. */
  useEffect(() => {
    if (resetViewToken === 0) return;
    if (!overflow) return;
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    el.scrollTo({ left: max / 2, behavior: "smooth" });
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
      className="relative flex flex-1 items-center overflow-x-auto overflow-y-hidden pb-12 pt-28 scrollbar-none"
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
