import { AnimatePresence, motion } from "framer-motion";
import bgBlueUrl from "~/assets/hardware/PNG+SVG/BG_Blue.jpg";
import gridTileUrl from "~/assets/hardware/PNG+SVG/Grid.svg?no-inline";
import { ScreenA } from "./ScreenA";
import { ScreenC } from "./ScreenC";
import { TopChrome } from "./TopChrome";
import {
  GRID_SCALE_DEEP_DIVE,
  GRID_SCALE_OVERVIEW,
  GRID_SCALE_RACK_FOCUS,
  hardwareSpring,
} from "./motion";
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
 *   - Grid layer: `Grid.svg` tiled at 120 px on top of the base.
 *     The layer uses a single SVG pattern (no stacked fallback overlays)
 *     so lines stay crisp and avoid moire/ghosting artifacts.
 *     This is the only layer that scales on dive — keeps the "step
 *     closer" cue without distorting the gradient.
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

  /* Grid scale tracks rack "dive depth" — 1.15× on rack focus (same as
   * the selected rack), 1.8× on Screen C; one spring for lockstep motion. */
  const isDeepDive =
    selectedUnitId !== null || selectedSubsystemId !== null;
  const isRackFocused = selectedRackId !== null;
  const gridScale = isDeepDive
    ? GRID_SCALE_DEEP_DIVE
    : isRackFocused
      ? GRID_SCALE_RACK_FOCUS
      : GRID_SCALE_OVERVIEW;

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
       *   - Use one SVG tile only (no extra gradient overlay) so the
       *     grid reads clean, straight and stable at every zoom.
       *   - Rack focus uses the same 1.15× scale and spring as the
       *     selected rack; Screen C uses a stronger 1.8× zoom. Only the
       *     grid layer scales; the BG_Blue gradient stays fixed. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-center bg-repeat opacity-60"
        style={{
          backgroundImage: `url(${gridTileUrl})`,
          backgroundPosition: "center",
          backgroundSize: "120px 120px",
        }}
        animate={{ scale: gridScale }}
        transition={hardwareSpring}
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
