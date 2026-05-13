import { AnimatePresence, motion } from "framer-motion";
import bgBlueUrl from "~/assets/hardware/PNG+SVG/BG_Blue.jpg";
import gridTileUrl from "~/assets/hardware/PNG+SVG/BG_Blue_Grid_Tile_2.png";
import { ScreenA } from "./ScreenA";
import { ScreenC } from "./ScreenC";
import { TopChrome } from "./TopChrome";
import { useSelection } from "./SelectionContext";
import { useActiveSubsystem } from "./useActiveSubsystem";

/**
 * Top-level canvas for the hardware demo.
 *
 * Owns the section wrapper, the blueprint-grid background and the
 * `TopChrome` overlay; switches the body between:
 *   - Screen A (rack carousel) — default, when no component/subsystem is
 *     selected.
 *   - Screen C (component detail) — when a unit is selected in the rack
 *     OR a subsystem is selected from the left sidebar.
 *
 * Click priority for "back to Screen A":
 *   - Use breadcrumb (`Project` / project name) or left sidebar to leave
 *     Screen C — empty canvas clicks do not exit (by design).
 *   - From Screen A, clicking the canvas body clears the rack (handled
 *     inside ScreenA.tsx).
 *
 * Background composition (per Dr. Artemy 2026-05-13 design comment):
 *   - Base layer: `BG_Blue.jpg` from the verstka mock — a brighter blue
 *     gradient with a soft radial highlight near center-bottom. Stays
 *     fixed (no zoom) so the gradient's focal point doesn't drift when
 *     the user dives into a rack.
 *   - Grid layer: `BG_Blue_Grid_Tile_2.png` tiled at 72 px on top of the
 *     base. This is the only layer that scales on dive — keeps the
 *     "step closer" cue without distorting the gradient.
 */
export function HardwareCanvas() {
  const {
    selectedRackId,
    selectedUnitId,
    selectedSubsystemId,
  } = useSelection();

  /* `useActiveSubsystem` is the single source of truth for "which
   * subsystem is open in Screen C right now?". Returning non-null means
   * we should render Screen C; null means stay on Screen A. */
  const activeSubsystem = useActiveSubsystem();

  /* Background grid zooms in slightly whenever the user has "dived" into
   * a rack OR into a subsystem — same "step closer" feel for both. */
  const isZoomed =
    selectedRackId !== null ||
    selectedUnitId !== null ||
    selectedSubsystemId !== null;

  return (
    <section
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#3b6bb1]"
      style={{
        /* Brighter-blue base from the design mockup. `bg-[#3b6bb1]`
         * in className stays as a same-tone fallback that paints the
         * instant before the JPG decodes (the JPG is preloaded via
         * `links()` so this fallback is rarely visible). */
        backgroundImage: `url(${bgBlueUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Tiled grid texture over the blue canvas.
       *
       * Visual goals:
       *   - More grid cells per screen than the native 122px tile would
       *     give — we render it at ~72px so the grid reads denser and
       *     the cell lines feel a touch thicker.
       *   - Slightly bolder than before (opacity 0.65 vs 0.50) so the
       *     blueprint character is more present without overpowering the
       *     rack contents.
       *   - The zoom-in on "dive" should be a barely-perceptible nudge,
       *     not a swoop — keeps the canvas calm. Only the grid layer
       *     scales; the BG_Blue gradient and racks live in their own
       *     subtrees. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-repeat opacity-65"
        style={{
          backgroundImage: `url(${gridTileUrl})`,
          backgroundPosition: "0 0",
          backgroundSize: "72px 72px",
        }}
        animate={{ scale: isZoomed ? 1.8 : 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 28 }}
      />

      <TopChrome />

      {/* Body — Screen C overrides Screen A whenever a subsystem is active.
          AnimatePresence handles the cross-fade between the two screens. */}
      <AnimatePresence mode="wait">
        {activeSubsystem ? (
          <ScreenC
            key={`screen-c-${activeSubsystem.id}`}
            subsystem={activeSubsystem}
          />
        ) : (
          <ScreenA key="screen-a" />
        )}
      </AnimatePresence>
    </section>
  );
}
