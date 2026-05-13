import { createContext, useContext } from "react";
import type { HardwareComponent, Subsystem } from "./types";

/**
 * Component-level edits store — *non-component* exports only.
 *
 * The static BoQ in `fake-data.ts` is immutable; user edits made in the
 * right-sidebar Catalog (qty +/-, description / SKU swap, delete, restore)
 * live in this context as an overlay and are projected onto each
 * `Subsystem.components` list at read time via `effectiveComponents()`.
 * Edits survive subsystem navigation for the duration of a session — they
 * intentionally do not persist beyond a refresh (this is a demo).
 *
 * File split (2026-05-13): this file holds only the context object, the
 * hook and the type — no React component. The `<ComponentEditsProvider>`
 * lives in `ComponentEditsProvider.tsx`. The split keeps Vite's React
 * Fast Refresh boundaries clean (mixed component + non-component exports
 * force a full-page reload on every save, which manifested as transient
 * "useComponentEdits must be used inside <ComponentEditsProvider>" errors
 * during HMR).
 */
export interface ComponentEditsContextValue {
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

export const ComponentEditsContext =
  createContext<ComponentEditsContextValue | null>(null);

export function useComponentEdits(): ComponentEditsContextValue {
  const ctx = useContext(ComponentEditsContext);
  if (!ctx) {
    throw new Error(
      "useComponentEdits must be used inside <ComponentEditsProvider>",
    );
  }
  return ctx;
}
