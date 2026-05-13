import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  ComponentEditsContext,
  type ComponentEditsContextValue,
} from "./ComponentEditsContext";
import type { HardwareComponent, Subsystem } from "./types";

/**
 * Provider half of the component-edits store.
 *
 * Lives in its own `.tsx` so the file has *only* a React component
 * export — Vite's React plugin then treats it as a Fast Refresh boundary
 * and HMR updates apply in-place (no full reload, no transient
 * "context not provided" errors). See the doc-comment on
 * `ComponentEditsContext.ts` for the full rationale.
 */
export function ComponentEditsProvider({ children }: { children: ReactNode }) {
  /* Three independent overlays keyed by `HardwareComponent.id` — kept as
   * plain objects (not Maps) so React's referential-equality checks fire
   * normally on each setState. */
  const [qtyOverrides, setQtyOverrides] = useState<Record<string, number>>({});
  const [descriptionOverrides, setDescriptionOverrides] = useState<
    Record<string, string>
  >({});
  const [deletedIds, setDeletedIds] = useState<Record<string, true>>({});

  const isDeleted = useCallback(
    (id: string) => deletedIds[id] === true,
    [deletedIds],
  );

  /* Project overlays onto the static `subsystem.components` array. Deleted
   * rows are filtered out entirely; qty / description overrides win when
   * present. */
  const effectiveComponents = useCallback(
    (subsystem: Subsystem): HardwareComponent[] => {
      return subsystem.components
        .filter((c) => !deletedIds[c.id])
        .map((c) => {
          const qtyOverride = qtyOverrides[c.id];
          const descOverride = descriptionOverrides[c.id];
          if (qtyOverride === undefined && descOverride === undefined) {
            return c;
          }
          return {
            ...c,
            qty: typeof qtyOverride === "number" ? qtyOverride : c.qty,
            description:
              typeof descOverride === "string" && descOverride.length > 0
                ? descOverride
                : c.description,
          };
        });
    },
    [deletedIds, qtyOverrides, descriptionOverrides],
  );

  const setQty = useCallback((id: string, value: number) => {
    /* Clamp at 1 — going to 0 is "delete", and the catalog UI exposes a
     * dedicated trash button for that. */
    const clamped = Math.max(1, Math.round(value));
    setQtyOverrides((prev) => ({ ...prev, [id]: clamped }));
  }, []);

  const setDescription = useCallback((id: string, value: string) => {
    setDescriptionOverrides((prev) => ({ ...prev, [id]: value }));
  }, []);

  const deleteComponent = useCallback((id: string) => {
    setDeletedIds((prev) => ({ ...prev, [id]: true }));
  }, []);

  const restoreComponent = useCallback((id: string) => {
    setDeletedIds((prev) => {
      if (!prev[id]) return prev;
      const { [id]: _omit, ...rest } = prev;
      return rest;
    });
  }, []);

  const value = useMemo<ComponentEditsContextValue>(
    () => ({
      effectiveComponents,
      setQty,
      setDescription,
      deleteComponent,
      restoreComponent,
      isDeleted,
    }),
    [
      effectiveComponents,
      setQty,
      setDescription,
      deleteComponent,
      restoreComponent,
      isDeleted,
    ],
  );

  return (
    <ComponentEditsContext.Provider value={value}>
      {children}
    </ComponentEditsContext.Provider>
  );
}
