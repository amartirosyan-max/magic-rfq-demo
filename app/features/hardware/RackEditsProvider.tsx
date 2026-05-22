import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  RackEditsContext,
  type RackEditsContextValue,
} from "./RackEditsContext";

/**
 * Provider half of the rack position editor.
 *
 * Keyed by `project.id` in `HardwareLayout.tsx` so switching projects
 * always starts with a clean slate.
 */
export function RackEditsProvider({ children }: { children: ReactNode }) {
  /**
   * Nested map: rackId → { unitId → positionU }.
   * Only units with overrides are stored — the map is sparse.
   */
  const [overrides, setOverrides] = useState<
    Record<string, Record<string, number>>
  >({});

  const getPositionU = useCallback(
    (rackId: string, unitId: string, original: number): number =>
      overrides[rackId]?.[unitId] ?? original,
    [overrides],
  );

  const moveUnit = useCallback(
    (rackId: string, unitId: string, positionU: number) => {
      setOverrides((prev) => ({
        ...prev,
        [rackId]: { ...(prev[rackId] ?? {}), [unitId]: positionU },
      }));
    },
    [],
  );

  const resetRack = useCallback((rackId: string) => {
    setOverrides((prev) => {
      if (!prev[rackId]) return prev;
      const { [rackId]: _omit, ...rest } = prev;
      return rest;
    });
  }, []);

  const hasPendingEdits = useCallback(
    (rackId: string): boolean => {
      const rackMap = overrides[rackId];
      return rackMap !== undefined && Object.keys(rackMap).length > 0;
    },
    [overrides],
  );

  const value = useMemo<RackEditsContextValue>(
    () => ({ getPositionU, moveUnit, resetRack, hasPendingEdits }),
    [getPositionU, moveUnit, resetRack, hasPendingEdits],
  );

  return (
    <RackEditsContext.Provider value={value}>
      {children}
    </RackEditsContext.Provider>
  );
}
