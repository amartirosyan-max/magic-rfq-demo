/**
 * Shared motion tokens for the hardware canvas.
 *
 * Rack scale, grid scale, and carousel glide all read from here so
 * "step closer" animations feel like one choreographed move instead
 * of independent tweens fighting each other.
 */

/** Spring used by rack focus (selected / flanking) and the grid zoom. */
export const hardwareSpring = {
  type: "spring" as const,
  stiffness: 220,
  damping: 24,
};

/** Selected rack on Screen A (`Rack.tsx`). */
export const RACK_SCALE_SELECTED = 1.15;

/** Non-selected racks when another rack is focused. */
export const RACK_SCALE_FLANK = 0.75;

/** Blueprint grid at rest (overview, no dive). */
export const GRID_SCALE_OVERVIEW = 1;

/** Grid when a rack is focused on Screen A — matches `RACK_SCALE_SELECTED`. */
export const GRID_SCALE_RACK_FOCUS = RACK_SCALE_SELECTED;

/** Grid when the user dives into Screen C (subsystem / unit). */
export const GRID_SCALE_DEEP_DIVE = 1.8;
