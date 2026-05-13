import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { HardwareComponent, Subsystem } from "./types";

/**
 * Component-level edits store.
 *
 * The static BoQ in `fake-data.ts` is immutable; user edits made in the
 * right-sidebar Catalog (qty +/-, description / SKU swap, delete, restore)
 * live here as an overlay and are projected onto each `Subsystem.components`
 * list at read time via `effectiveComponents()`. Edits survive subsystem
 * navigation for the duration of a session — they intentionally do not
 * persist beyond a refresh (this is a demo).
 *
 * Per Dr. Artemy's review (2026-05-13): all edit UI lives in the Catalog
 * panel; Screen C component rows are read-only labels driven by this store.
 */
interface ComponentEditsContextValue {
  /** Apply qty / description / delete overlays to a subsystem's components. */
  effectiveComponents: (subsystem: Subsystem) => HardwareComponent[];
  /** Direct qty setter. Clamps at 1; use `deleteComponent` for 0. */
  setQty: (componentId: string, value: number) => void;
  /** Overwrite the spec / description text for a component row. */
  setDescription: (componentId: string, value: string) => void;
  /** Hide a component row entirely. Reversible via `restoreComponent`. */
  deleteComponent: (componentId: string) => void;
  /** Reverse a previous delete (qty / description overlays are preserved). */
  restoreComponent: (componentId: string) => void;
  /** True if this component id has been deleted in the current session. */
  isDeleted: (componentId: string) => boolean;
}

const ComponentEditsContext =
  createContext<ComponentEditsContextValue | null>(null);

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

export function useComponentEdits(): ComponentEditsContextValue {
  const ctx = useContext(ComponentEditsContext);
  if (!ctx) {
    throw new Error(
      "useComponentEdits must be used inside <ComponentEditsProvider>",
    );
  }
  return ctx;
}
