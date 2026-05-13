import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  SubsystemEditsContext,
  type ChassisSwap,
  type SubsystemEditsContextValue,
} from "./SubsystemEditsContext";
import type { Subsystem } from "./types";

/**
 * Provider half of the subsystem-edits store.
 *
 * Lives in its own `.tsx` so the file has *only* a React component
 * export — Vite's React plugin then treats it as a Fast Refresh boundary
 * and HMR updates apply in-place (no full reload, no transient
 * "context not provided" errors).
 */
export function SubsystemEditsProvider({ children }: { children: ReactNode }) {
  /* Four independent overlays keyed by `Subsystem.id`. Plain objects so
   * React's referential-equality checks fire as expected on each setState. */
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>(
    {},
  );
  const [qtyOverrides, setQtyOverrides] = useState<Record<string, number>>({});
  const [deletedMap, setDeletedMap] = useState<Record<string, true>>({});
  const [chassisSwaps, setChassisSwaps] = useState<Record<string, ChassisSwap>>(
    {},
  );

  const isDeleted = useCallback(
    (id: string) => deletedMap[id] === true,
    [deletedMap],
  );

  const applyEdits = useCallback(
    (subsystem: Subsystem): Subsystem => {
      const nameOverride = nameOverrides[subsystem.id];
      const qtyOverride = qtyOverrides[subsystem.id];
      const chassisSwap = chassisSwaps[subsystem.id];
      if (
        nameOverride === undefined &&
        qtyOverride === undefined &&
        chassisSwap === undefined
      ) {
        return subsystem;
      }
      const nextName =
        typeof nameOverride === "string" && nameOverride.length > 0
          ? nameOverride
          : subsystem.name;
      return {
        ...subsystem,
        name: nextName,
        /* Keep `titleSuffix` in sync with the rename so the Screen C title
         * trailing label and the catalog breadcrumb reflect the new name
         * (no consumer has to special-case the overlay). */
        titleSuffix:
          typeof nameOverride === "string" && nameOverride.length > 0
            ? nextName
            : subsystem.titleSuffix,
        qty: typeof qtyOverride === "number" ? qtyOverride : subsystem.qty,
        chassis: chassisSwap
          ? {
              ...subsystem.chassis,
              name: chassisSwap.name,
              description:
                chassisSwap.description ?? subsystem.chassis.description,
            }
          : subsystem.chassis,
      };
    },
    [nameOverrides, qtyOverrides, chassisSwaps],
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

  const swapChassis = useCallback((id: string, swap: ChassisSwap) => {
    setChassisSwaps((prev) => ({ ...prev, [id]: swap }));
  }, []);

  const resetChassis = useCallback((id: string) => {
    setChassisSwaps((prev) => {
      if (!prev[id]) return prev;
      const { [id]: _omit, ...rest } = prev;
      return rest;
    });
  }, []);

  const getActiveChassisCatalogId = useCallback(
    (id: string) => chassisSwaps[id]?.catalogEntryId ?? null,
    [chassisSwaps],
  );

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
      swapChassis,
      resetChassis,
      getActiveChassisCatalogId,
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
      swapChassis,
      resetChassis,
      getActiveChassisCatalogId,
      deletedIds,
    ],
  );

  return (
    <SubsystemEditsContext.Provider value={value}>
      {children}
    </SubsystemEditsContext.Provider>
  );
}
