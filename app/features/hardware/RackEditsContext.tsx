import { createContext, useContext } from "react";

/**
 * Rack node position editor — context shape.
 *
 * Stores session-only position overrides for rack units. The source-of-truth
 * `hardwareProject` data is never mutated; overrides sit on top as a pure
 * client overlay (same pattern as `SubsystemEditsContext`).
 *
 * Provider lives in `RackEditsProvider.tsx` (Fast-Refresh boundary split).
 */

export interface RackEditsContextValue {
  /**
   * Effective positionU for a unit.
   * Returns the override when one exists, otherwise the original value.
   */
  getPositionU(rackId: string, unitId: string, original: number): number;
  /** Store a new position for a unit inside a rack. */
  moveUnit(rackId: string, unitId: string, positionU: number): void;
  /** Remove all position overrides for one rack. */
  resetRack(rackId: string): void;
  /** True when at least one unit in the rack has a position override. */
  hasPendingEdits(rackId: string): boolean;
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
