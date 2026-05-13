import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Subsystem } from "./types";

/**
 * Subsystem-level edits store.
 *
 * Mirrors `ComponentEditsContext` but for the left-sidebar subsystem rows
 * (Hyper-v cluster / VMware cluster / SAN Storage / …). Per Dr. Artemy's
 * 2026-05-13 review the edit UI lives in the right-sidebar Catalog —
 * this context is the single overlay that every consumer reads:
 *
 *   - left sidebar nav (`adapter.ts`)
 *   - Screen C `PageTitle`
 *   - Catalog L0 project list cards
 *   - Catalog breadcrumb segments
 *
 * Edits never mutate `hardwareProject`; they sit on top as a session-only
 * overlay so the static fake-data stays the source of truth.
 */
interface SubsystemEditsContextValue {
  /** Renames + qty edits applied to a single subsystem. Returns the same
   *  reference when there's no override (so React memoisation stays sharp). */
  applyEdits: (subsystem: Subsystem) => Subsystem;
  /** Convenience iterator: every non-deleted subsystem with overlays applied. */
  effectiveSubsystems: (subsystems: Subsystem[]) => Subsystem[];
  /** Direct overrides. */
  setName: (subsystemId: string, value: string) => void;
  setQty: (subsystemId: string, value: number) => void;
  deleteSubsystem: (subsystemId: string) => void;
  restoreSubsystem: (subsystemId: string) => void;
  isDeleted: (subsystemId: string) => boolean;
  /** Lookup of currently deleted ids — useful for the "Restore" affordance
   *  in the L0 catalog when listing tombstoned subsystems. */
  deletedIds: string[];
}

const SubsystemEditsContext =
  createContext<SubsystemEditsContextValue | null>(null);

export function SubsystemEditsProvider({ children }: { children: ReactNode }) {
  /* Three independent overlays keyed by `Subsystem.id`. Plain objects so
   * React's referential-equality checks fire as expected on each setState. */
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>(
    {},
  );
  const [qtyOverrides, setQtyOverrides] = useState<Record<string, number>>({});
  const [deletedMap, setDeletedMap] = useState<Record<string, true>>({});

  const isDeleted = useCallback(
    (id: string) => deletedMap[id] === true,
    [deletedMap],
  );

  const applyEdits = useCallback(
    (subsystem: Subsystem): Subsystem => {
      const nameOverride = nameOverrides[subsystem.id];
      const qtyOverride = qtyOverrides[subsystem.id];
      if (nameOverride === undefined && qtyOverride === undefined) {
        return subsystem;
      }
      return {
        ...subsystem,
        name:
          typeof nameOverride === "string" && nameOverride.length > 0
            ? nameOverride
            : subsystem.name,
        qty: typeof qtyOverride === "number" ? qtyOverride : subsystem.qty,
      };
    },
    [nameOverrides, qtyOverrides],
  );

  const effectiveSubsystems = useCallback(
    (subsystems: Subsystem[]): Subsystem[] => {
      return subsystems
        .filter((s) => !deletedMap[s.id])
        .map((s) => applyEdits(s));
    },
    [deletedMap, applyEdits],
  );

  const setName = useCallback((id: string, value: string) => {
    setNameOverrides((prev) => ({ ...prev, [id]: value }));
  }, []);

  const setQty = useCallback((id: string, value: number) => {
    /* Clamp at 1 — going to 0 belongs to "Delete" so the affordance stays
     * separate from the stepper. */
    const clamped = Math.max(1, Math.round(value));
    setQtyOverrides((prev) => ({ ...prev, [id]: clamped }));
  }, []);

  const deleteSubsystem = useCallback((id: string) => {
    setDeletedMap((prev) => ({ ...prev, [id]: true }));
  }, []);

  const restoreSubsystem = useCallback((id: string) => {
    setDeletedMap((prev) => {
      if (!prev[id]) return prev;
      const { [id]: _omit, ...rest } = prev;
      return rest;
    });
  }, []);

  const deletedIds = useMemo(() => Object.keys(deletedMap), [deletedMap]);

  const value = useMemo<SubsystemEditsContextValue>(
    () => ({
      applyEdits,
      effectiveSubsystems,
      setName,
      setQty,
      deleteSubsystem,
      restoreSubsystem,
      isDeleted,
      deletedIds,
    }),
    [
      applyEdits,
      effectiveSubsystems,
      setName,
      setQty,
      deleteSubsystem,
      restoreSubsystem,
      isDeleted,
      deletedIds,
    ],
  );

  return (
    <SubsystemEditsContext.Provider value={value}>
      {children}
    </SubsystemEditsContext.Provider>
  );
}

export function useSubsystemEdits(): SubsystemEditsContextValue {
  const ctx = useContext(SubsystemEditsContext);
  if (!ctx) {
    throw new Error(
      "useSubsystemEdits must be used inside <SubsystemEditsProvider>",
    );
  }
  return ctx;
}
