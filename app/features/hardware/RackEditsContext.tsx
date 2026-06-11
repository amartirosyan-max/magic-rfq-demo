import { createContext, useContext } from "react";
import type { Rack, RackUnit } from "./types";

/**
 * Rack node editor — context shape.
 *
 * Stores session-only **placement** overrides for rack units. Each override
 * records BOTH the rack a unit now lives in AND its U position, so a unit can
 * be carried to a different rack (cross-rack drag), not just re-positioned in
 * its own rack. The source-of-truth `hardwareProject` data is never mutated;
 * overrides sit on top as a pure client overlay (same pattern as
 * `SubsystemEditsContext`).
 *
 * Provider lives in `RackEditsProvider.tsx` (Fast-Refresh boundary split).
 */

/** Effective home of a rack unit: which rack + which U position. */
export interface UnitPlacement {
  rackId: string;
  /** Bottom U position (1 = bottom). */
  positionU: number;
}

/** A unit together with its effective position inside a given rack. */
export interface PlacedUnit {
  unit: RackUnit;
  positionU: number;
}

export interface RackEditsContextValue {
  /** Effective placement (override if present, otherwise original). */
  placementOf(unitId: string): UnitPlacement;
  /**
   * Every unit whose effective placement lands in `rackId`, paired with its
   * effective position. Replaces reading `rack.units` directly so relocated
   * units render in their new rack and depart their old one.
   */
  unitsForRack(rackId: string): PlacedUnit[];
  /** Commit a placement — cross-rack capable. No-op if it equals the original. */
  moveUnit(unitId: string, rackId: string, positionU: number): void;
  /** Restore one rack to its original layout (units that left come back, units
   *  that arrived leave). */
  resetRack(rackId: string): void;
  /** Clear every override in the project. */
  resetAll(): void;
  /** True when any override touches this rack (a unit left it or arrived in it). */
  hasPendingEdits(rackId: string): boolean;

  /**
   * Effective, ordered rack list: the project's source racks plus any racks the
   * user added, in the user's chosen order. Consumers render THIS instead of
   * `project.racks` so added racks and reordering show up.
   */
  racks: Rack[];
  /** Add a new empty rack at the right (end) of the row. */
  addRack(): void;
  /** Move a rack to a new index in the row (reorder). */
  moveRack(rackId: string, toIndex: number): void;
}

export const RackEditsContext = createContext<RackEditsContextValue | null>(
  null,
);

export function useRackEdits(): RackEditsContextValue {
  const ctx = useContext(RackEditsContext);
  if (!ctx) {
    throw new Error("useRackEdits must be used inside <RackEditsProvider>");
  }
  return ctx;
}
