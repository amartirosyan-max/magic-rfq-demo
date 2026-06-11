import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useHardwareProject } from "./HardwareProjectContext";
import {
  RackEditsContext,
  type PlacedUnit,
  type RackEditsContextValue,
  type UnitPlacement,
} from "./RackEditsContext";
import type { Rack, RackUnit } from "./types";

/**
 * Provider half of the rack node editor.
 *
 * Keyed by `project.id` in `HardwareLayout.tsx`, so switching projects always
 * starts with a clean slate (no overrides, edit mode off).
 */
export function RackEditsProvider({ children }: { children: ReactNode }) {
  const project = useHardwareProject();

  /**
   * Flat map: unitId → placement override. Sparse — only units the user has
   * moved are stored. An override is dropped the moment it returns to the
   * unit's original placement (see `moveUnit`).
   */
  const [overrides, setOverrides] = useState<Record<string, UnitPlacement>>({});

  /**
   * Effective rack list — seeded from the project's source racks, then mutated
   * locally (added / reordered racks). Source `project.racks` stays untouched.
   * Keyed by `project.id` at the provider, so this re-seeds on project change.
   */
  const [racks, setRacks] = useState<Rack[]>(() => project.racks);
  const addedSeqRef = useRef(0);

  const addRack = useCallback(() => {
    setRacks((prev) => {
      addedSeqRef.current += 1;
      const newRack: Rack = {
        id: `rack-added-${addedSeqRef.current}`,
        name: `Rack ${prev.length + 1}`,
        shortLabel: "",
        kind: "rack-42u",
        heightU: 42,
        units: [],
        isEmpty: false,
        columnLabel: { line1: "New Rack", line2: "" },
      };
      /* New racks are appended at the right (end of the row, before the "+"). */
      return [...prev, newRack];
    });
  }, []);

  const moveRack = useCallback((rackId: string, toIndex: number) => {
    setRacks((prev) => {
      const from = prev.findIndex((r) => r.id === rackId);
      if (from < 0) return prev;
      const clamped = Math.max(0, Math.min(prev.length - 1, toIndex));
      if (from === clamped) return prev;
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(clamped, 0, moved);
      return next;
    });
  }, []);

  /** unitId → its original rack + position + the `RackUnit` itself. */
  const originals = useMemo(() => {
    const map = new Map<
      string,
      { rackId: string; positionU: number; unit: RackUnit }
    >();
    for (const rack of project.racks) {
      for (const unit of rack.units) {
        map.set(unit.id, { rackId: rack.id, positionU: unit.positionU, unit });
      }
    }
    return map;
  }, [project]);

  const placementOf = useCallback(
    (unitId: string): UnitPlacement => {
      const override = overrides[unitId];
      if (override) return override;
      const original = originals.get(unitId);
      return original
        ? { rackId: original.rackId, positionU: original.positionU }
        : { rackId: "", positionU: 1 };
    },
    [overrides, originals],
  );

  const unitsForRack = useCallback(
    (rackId: string): PlacedUnit[] => {
      const result: PlacedUnit[] = [];
      for (const { unit, rackId: origRackId, positionU: origPos } of originals.values()) {
        const override = overrides[unit.id];
        const placement = override ?? { rackId: origRackId, positionU: origPos };
        if (placement.rackId === rackId) {
          result.push({ unit, positionU: placement.positionU });
        }
      }
      return result;
    },
    [overrides, originals],
  );

  const moveUnit = useCallback(
    (unitId: string, rackId: string, positionU: number) => {
      setOverrides((prev) => {
        const original = originals.get(unitId);
        /* Back at the original placement → drop the override entirely. */
        if (
          original &&
          original.rackId === rackId &&
          original.positionU === positionU
        ) {
          if (!prev[unitId]) return prev;
          const { [unitId]: _omit, ...rest } = prev;
          return rest;
        }
        const existing = prev[unitId];
        if (existing && existing.rackId === rackId && existing.positionU === positionU) {
          return prev;
        }
        return { ...prev, [unitId]: { rackId, positionU } };
      });
    },
    [originals],
  );

  const resetRack = useCallback(
    (rackId: string) => {
      setOverrides((prev) => {
        let changed = false;
        const next: Record<string, UnitPlacement> = {};
        for (const [unitId, placement] of Object.entries(prev)) {
          const original = originals.get(unitId);
          const touchesRack =
            placement.rackId === rackId || original?.rackId === rackId;
          if (touchesRack) {
            changed = true;
            continue;
          }
          next[unitId] = placement;
        }
        return changed ? next : prev;
      });
    },
    [originals],
  );

  const resetAll = useCallback(() => setOverrides({}), []);

  const hasPendingEdits = useCallback(
    (rackId: string): boolean => {
      for (const [unitId, placement] of Object.entries(overrides)) {
        const original = originals.get(unitId);
        if (placement.rackId === rackId || original?.rackId === rackId) {
          return true;
        }
      }
      return false;
    },
    [overrides, originals],
  );

  const value = useMemo<RackEditsContextValue>(
    () => ({
      placementOf,
      unitsForRack,
      moveUnit,
      resetRack,
      resetAll,
      hasPendingEdits,
      racks,
      addRack,
      moveRack,
    }),
    [
      placementOf,
      unitsForRack,
      moveUnit,
      resetRack,
      resetAll,
      hasPendingEdits,
      racks,
      addRack,
      moveRack,
    ],
  );

  return (
    <RackEditsContext.Provider value={value}>
      {children}
    </RackEditsContext.Provider>
  );
}
