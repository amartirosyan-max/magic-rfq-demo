import { createContext, useContext } from "react";
import type { Subsystem } from "./types";

/**
 * Subsystem-level edits store — *non-component* exports only.
 *
 * Mirrors `ComponentEditsContext` but for the left-sidebar subsystem rows
 * (Hyper-v cluster / VMware cluster / SAN Storage / …). Per Dr. Artemy's
 * 2026-05-13 review the edit UI lives in the right-sidebar Catalog —
 * this context is the single overlay that every consumer reads:
 *
 *   - left sidebar nav (`adapter.ts`)
 *   - Screen C `PageTitle` + chassis hero
 *   - Catalog L0 project list cards
 *   - Catalog breadcrumb segments
 *
 * Edits never mutate `hardwareProject`; they sit on top as a session-only
 * overlay so the static fake-data stays the source of truth.
 *
 * File split (2026-05-13): see the doc-comment on `ComponentEditsContext.ts`
 * for the Fast-Refresh rationale. The `<SubsystemEditsProvider>` lives in
 * `SubsystemEditsProvider.tsx`.
 */

/** Light overlay describing a swapped chassis SKU. Only the user-visible
 * fields are tracked; the underlying `chassis.id` / image / U-size stay
 * untouched so racks keep their geometry. */
export interface ChassisSwap {
  /** Catalog entry id of the alternative SKU the user picked. */
  catalogEntryId: string;
  /** New chassis display name to surface in Screen C + breadcrumb. */
  name: string;
  /** Short spec / description shown under the chassis hero. */
  description?: string;
}

export interface SubsystemEditsContextValue {
  /** Renames + qty edits + chassis swap applied to a single subsystem.
   *  Returns the same reference when there's no override (so React
   *  memoisation stays sharp). */
  applyEdits: (subsystem: Subsystem) => Subsystem;
  /** Convenience iterator: every non-deleted subsystem with overlays applied. */
  effectiveSubsystems: (subsystems: Subsystem[]) => Subsystem[];
  setName: (subsystemId: string, value: string) => void;
  setQty: (subsystemId: string, value: number) => void;
  deleteSubsystem: (subsystemId: string) => void;
  restoreSubsystem: (subsystemId: string) => void;
  isDeleted: (subsystemId: string) => boolean;
  /** Swap the chassis SKU of a subsystem to one of the catalog alternatives. */
  swapChassis: (subsystemId: string, swap: ChassisSwap) => void;
  /** Clear any chassis swap — falls back to the original `fake-data` chassis. */
  resetChassis: (subsystemId: string) => void;
  /** Read the currently active catalog entry id for a subsystem (or null
   *  if no swap is in effect). Used by the catalog L1 view to highlight
   *  which alternative card is "in proposal" right now. */
  getActiveChassisCatalogId: (subsystemId: string) => string | null;
  /** Lookup of currently deleted ids — useful for the "Restore" affordance
   *  in the L0 catalog when listing tombstoned subsystems. */
  deletedIds: string[];
}

export const SubsystemEditsContext =
  createContext<SubsystemEditsContextValue | null>(null);

export function useSubsystemEdits(): SubsystemEditsContextValue {
  const ctx = useContext(SubsystemEditsContext);
  if (!ctx) {
    throw new Error(
      "useSubsystemEdits must be used inside <SubsystemEditsProvider>",
    );
  }
  return ctx;
}
