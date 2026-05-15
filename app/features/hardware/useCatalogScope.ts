import { useMemo } from "react";
import { useHardwareProject } from "./HardwareProjectContext";
import { useSelection } from "./SelectionContext";
import { useActiveSubsystem } from "./useActiveSubsystem";
import { inProposalCatalogId, platformCatalog } from "./catalog-data";
import type { CatalogEntry, HardwareProject, Subsystem } from "./types";

/**
 * Drives the right-sidebar Catalog tab. Mirrors how deep the user has
 * drilled into the canvas:
 *
 *   - `project`   — Screen A overview, nothing picked. Catalog shows the
 *                   6 generic subsystem-category cards.
 *   - `subsystem` — sidebar pick of a subsystem (Screen C without a
 *                   selected rack unit). Catalog shows the platform
 *                   alternatives for that subsystem; the in-proposal SKU
 *                   is highlighted via `selectedId`.
 *   - `chassis`   — rack-unit click (Screen C with a unit selected).
 *                   Catalog opens with a "current chassis" context card
 *                   plus the component-category chip row.
 *
 * Self-healing: if `inProposalCatalogId[subsystemId]` does not resolve to
 * any entry in the platform list, we synthesise a one-off `CatalogEntry`
 * from `Subsystem.chassis` and prepend it. The user always sees the
 * selected chassis at the top of L1 even when the catalog is incomplete.
 */
export type CatalogScope =
  | { kind: "project" }
  | {
      kind: "subsystem";
      subsystem: Subsystem;
      alternatives: CatalogEntry[];
      selectedId: string | null;
    }
  | {
      kind: "chassis";
      subsystem: Subsystem;
      unitId: string;
      /** Hydrated catalog entry for the chassis currently open (always
       *  populated, either from the catalog or synthesised). */
      contextEntry: CatalogEntry;
    };

export function useCatalogScope(): CatalogScope {
  const project = useHardwareProject();
  const { selectedUnitId } = useSelection();
  const activeSubsystem = useActiveSubsystem();

  return useMemo<CatalogScope>(() => {
    if (!activeSubsystem) return { kind: "project" };

    const { list, proposalId } = resolveCatalogSource(project, activeSubsystem);
    const hydrated = hydrateAlternatives(activeSubsystem, list, proposalId);
    const selectedId =
      hydrated.find((e) => e.id === proposalId)?.id ??
      hydrated[0]?.id ??
      null;

    if (selectedUnitId) {
      const contextEntry =
        hydrated.find((e) => e.id === selectedId) ?? synthesiseFromChassis(activeSubsystem);
      return {
        kind: "chassis",
        subsystem: activeSubsystem,
        unitId: selectedUnitId,
        contextEntry,
      };
    }

    return {
      kind: "subsystem",
      subsystem: activeSubsystem,
      alternatives: hydrated,
      selectedId,
    };
  }, [project, activeSubsystem, selectedUnitId]);
}

/**
 * Where does this subsystem's catalog live?
 *
 *  1. `catalog-data.ts#platformCatalog` — the curated Dell-SKU catalog
 *     built for the Avaya demo (rich `bestFor` / `spec` / `price` shape,
 *     keyed by Avaya subsystem ids).
 *  2. `project.productAlternatives[subsystemId]` — per-project fallback
 *     defined in the project's data file (used by ADGSA-AI and any
 *     future project that doesn't ship in `catalog-data.ts`).
 *
 * The proposal id is whichever entry's `status === "in-proposal"` —
 * declared explicitly in `inProposalCatalogId` for Avaya, derived from
 * the `productAlternatives` list otherwise.
 */
function resolveCatalogSource(
  project: HardwareProject,
  subsystem: Subsystem,
): { list: CatalogEntry[]; proposalId: string | null } {
  const platformList = platformCatalog[subsystem.id];
  if (platformList && platformList.length > 0) {
    return {
      list: platformList,
      proposalId: inProposalCatalogId[subsystem.id] ?? null,
    };
  }
  const projectList = project.productAlternatives[subsystem.id] ?? [];
  const proposalId =
    projectList.find((e) => e.status === "in-proposal")?.id ?? null;
  return { list: projectList, proposalId };
}

/**
 * Returns the alternatives list with the proposal SKU guaranteed to be
 * present (synthesised from the chassis spec if missing).
 *
 * - Marks the in-proposal entry's `status` to `"in-proposal"`, even if
 *   the source data forgot to.
 * - All other entries are downgraded to `"not-in-proposal"` so we never
 *   render two "In proposal" badges in the same list.
 * - Prepends a synthetic entry at the top when the proposal id has no
 *   match in the catalog (data drift safety net).
 */
function hydrateAlternatives(
  subsystem: Subsystem,
  list: CatalogEntry[],
  proposalId: string | null,
): CatalogEntry[] {
  if (list.length === 0 && !proposalId) return [];

  const hasProposalEntry = list.some((e) => e.id === proposalId);
  const synthetic = !hasProposalEntry ? synthesiseFromChassis(subsystem) : null;

  const normalised = list.map((entry) => ({
    ...entry,
    status:
      entry.id === proposalId
        ? ("in-proposal" as const)
        : entry.status === "in-proposal"
          ? ("not-in-proposal" as const)
          : entry.status,
  }));

  return synthetic ? [synthetic, ...normalised] : normalised;
}

/**
 * Build a one-off `CatalogEntry` from a `Subsystem.chassis`. Used when
 * the platform catalog is missing the proposal SKU — the user still
 * sees what's currently installed.
 */
function synthesiseFromChassis(subsystem: Subsystem): CatalogEntry {
  const c = subsystem.chassis;
  return {
    id: `syn-${c.id}`,
    name: c.name,
    status: "in-proposal",
    bestFor: subsystem.titleSuffix,
    spec: `${c.sizeU}U · ${c.vendor}${c.watts ? ` · ${c.watts}W` : ""}`,
    description:
      c.description ||
      "Currently in the proposal. Full catalog entry is being prepared.",
  };
}

/** Convenience accessor — used in the breadcrumb for analytics later. */
export function useCatalogSubsystemId(): string | null {
  const project = useHardwareProject();
  const { selectedUnitId, selectedSubsystemId } = useSelection();
  if (selectedSubsystemId) return selectedSubsystemId;
  if (selectedUnitId) {
    for (const rack of project.racks) {
      const unit = rack.units.find((u) => u.id === selectedUnitId);
      if (unit) return unit.subsystemId;
    }
  }
  return null;
}
