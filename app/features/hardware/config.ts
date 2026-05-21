/**
 * Rack-constructor geometry tokens.
 *
 * Single source of truth for every size used by the rack constructor.
 * Edit `UNIT_HEIGHT_PX` (and proportionally the others) to retune the
 * whole rack — no other code changes needed. CSS variables in
 * `app/app.css` mirror these so brand themes (`data-customer`) can
 * override them without touching TS.
 *
 * See `app/docs/features/hardware-configurator/RACK-CONSTRUCTOR-PLAN.md`
 * §4 for the rationale and §6 for the data-shape link.
 */

/* -------------------------------------------------------------------- */
/*  Frame                                                               */
/* -------------------------------------------------------------------- */

/**
 * Visible width of the rack (top frame + side rails + bottom frame).
 * Chosen so the total rack aspect (W : totalHeight) ≈ 0.375, which
 * matches the carousel slot height (`h-[55vh]`) and the `mx-auto`
 * centring math in `ScreenA.tsx`.
 */
export const RACK_WIDTH_PX = 144;

/**
 * Height of the top frame SVG band rendered above unit row 1.
 * Equals `RACK_WIDTH_PX × (24.5 / 254)` — preserves the native SVG
 * aspect ratio of `Rack_Top.svg`.
 */
export const RACK_TOP_HEIGHT_PX = 17;

/**
 * Height of the bottom frame SVG band (plate + feet).
 * Equals `RACK_WIDTH_PX × (48.438 / 254)` — preserves the native SVG
 * aspect ratio of `Rack_bottom.svg`.
 */
export const RACK_BOTTOM_HEIGHT_PX = 30;

/**
 * Horizontal margin applied to each side of a rack inside the carousel
 * row. Matches `mx-5` on the rack wrappers in `ScreenA.tsx` — keep in
 * sync if you change one or the other. The carousel scroll-pad formula
 * reads this constant directly.
 */
export const RACK_MARGIN_X_PX = 20;

/* -------------------------------------------------------------------- */
/*  Unit row                                                            */
/* -------------------------------------------------------------------- */

/**
 * On-screen height of 1 rack unit (1U).
 * At 42U + top + bottom this yields a 518 px rack, ≈ 55 vh on a
 * 940 px viewport (the carousel slot is `h-[55vh]`).
 */
export const UNIT_HEIGHT_PX = 11;

/**
 * Width of each side rail (left and right) inside a unit row.
 * Per user spec the unit row is "square" — rail width matches unit
 * height — so this stays equal to `UNIT_HEIGHT_PX`.
 */
export const SIDE_RAIL_WIDTH_PX = 11;

/* -------------------------------------------------------------------- */
/*  Derived helpers — never edit; read from the constants above.        */
/* -------------------------------------------------------------------- */

/** Total rendered height of a rack with the given U count. */
export const rackTotalHeightPx = (heightU: number): number =>
  RACK_TOP_HEIGHT_PX + heightU * UNIT_HEIGHT_PX + RACK_BOTTOM_HEIGHT_PX;
