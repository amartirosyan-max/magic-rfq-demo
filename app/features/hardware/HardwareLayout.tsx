import { useEffect, useMemo, type ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { SiteHeader } from "~/components/site-header";
import { SidebarLeft } from "~/components/sidebar-left";
import { SidebarRight } from "~/components/sidebar-right";
import { DiagramProvider } from "~/context/DiagramContext";
import formatToUSD from "~/utils/formatUSD";
import { CatalogPanel } from "./CatalogPanel";
import { ComponentEditsProvider } from "./ComponentEditsProvider";
import { RackEditsProvider } from "./RackEditsProvider";
import {
  getFakeNavItems,
  getFakeProject,
  getFakeProjectPrice,
} from "./adapter";
import {
  HardwareProjectProvider,
  useHardwareProject,
} from "./HardwareProjectContext";
import { SelectionProvider, useSelection } from "./SelectionContext";
import { SubsystemEditsProvider } from "./SubsystemEditsProvider";
import { useSubsystemEdits } from "./SubsystemEditsContext";
import type { HardwareProject } from "./types";

/**
 * Three-column shell for the hardware configurator demo.
 *
 * Reuses the existing app sidebar components (`SidebarLeft`, `SidebarRight`)
 * and feeds them fake data via the `adapter` module — no new sidebar UI is
 * introduced. The catalog body inside the right sidebar is overridden with
 * the hardware subsystem-category list; the chat body is a friendly
 * placeholder for the demo.
 *
 * The left header keeps `Preview Proposal`; in this demo it resets the
 * canvas to the multi-rack overview (no rack / unit / subsystem selection)
 * instead of opening the project proposal tab. Header click-to-project
 * remains disabled via `disableHeaderClick`.
 *
 * `SelectionProvider` wraps the whole shell so subsystem clicks in the
 * nav are pure client state (no route change); children can read it via
 * `useSelection()` to render Screens A/B/C accordingly.
 *
 * The `project` prop selects which `HardwareProject` (Avaya, ADGSA-AI,
 * …) this instance renders. Every feature component below reads it via
 * `useHardwareProject()` instead of importing a singleton, so adding a
 * new project is a single new data file + a new route entry.
 *
 * `SubsystemEditsProvider` is keyed by `project.id` so that switching
 * between routes (which never happens without a full unmount today,
 * but keeping it safe) doesn't bleed renames/deletes across projects.
 */
export function HardwareLayout({
  project,
  children,
}: {
  project: HardwareProject;
  children: ReactNode;
}) {
  return (
    <HardwareProjectProvider project={project}>
      <SelectionProvider>
        <SubsystemEditsProvider key={project.id}>
          <RackEditsProvider key={project.id}>
          <ComponentEditsProvider>
            <HardwareLayoutInner>{children}</HardwareLayoutInner>
          </ComponentEditsProvider>
          </RackEditsProvider>
        </SubsystemEditsProvider>
      </SelectionProvider>
    </HardwareProjectProvider>
  );
}

function HardwareLayoutInner({ children }: { children: ReactNode }) {
  const project = useHardwareProject();
  const {
    selectedSubsystemId,
    selectSubsystem,
    selectedUnitId,
    selectUnit,
    resetView,
  } = useSelection();
  const { effectiveSubsystems, isDeleted } = useSubsystemEdits();
  const projectResponse = useMemo(() => getFakeProject(project), [project]);
  const projectPriceData = useMemo(
    () => getFakeProjectPrice(project),
    [project],
  );
  /* Project the subsystem-edit overlay (renames + deletes) into the nav
   * so the left sidebar reflects renamed labels and skips deleted rows. */
  const editedSubsystems = useMemo(
    () => effectiveSubsystems(project.subsystems),
    [effectiveSubsystems, project.subsystems],
  );
  const navItems = useMemo(
    () => getFakeNavItems(selectedSubsystemId, project, editedSubsystems),
    [selectedSubsystemId, project, editedSubsystems],
  );

  /* Stale-selection guard: when a subsystem is deleted while it (or one
   * of its rack units) is selected, drop the selection so we don't keep
   * dangling state pointing at something the user can no longer see. */
  useEffect(() => {
    if (selectedSubsystemId && isDeleted(selectedSubsystemId)) {
      selectSubsystem(null);
    }
  }, [selectedSubsystemId, isDeleted, selectSubsystem]);

  useEffect(() => {
    if (!selectedUnitId) return;
    for (const rack of project.racks) {
      const unit = rack.units.find((u) => u.id === selectedUnitId);
      if (unit && isDeleted(unit.subsystemId)) {
        selectUnit(null);
        return;
      }
    }
  }, [selectedUnitId, isDeleted, selectUnit, project.racks]);

  return (
    <DiagramProvider>
      <SidebarProvider className="[--header-height:calc(--spacing(14))] h-svh overflow-hidden">
        <SiteHeader />
        <div className="flex min-h-0 flex-1 w-full overflow-hidden">
          <SidebarLeft
            collapsible="none"
            project={projectResponse}
            navItems={navItems}
            projectPriceData={projectPriceData}
            className="h-full border-r-0 p-4"
            disableHeaderClick
            onPreviewProposalClick={() => {
              /* "Proposal preview" = rack overview: no rack / unit / subsystem
               * focus AND the canvas scroller re-centres so the user sees
               * the full row again (not whatever rack happened to be in
               * frame from the previous selection). */
              resetView();
            }}
            priceOverride={{
              label: "Grand Total:",
              value: formatToUSD(project.grandTotalUSD),
            }}
            onNavItemSelect={(item) => {
              /* Top-level row (the project header) returns to a clean
               * rack-overview snapshot: clears every selection axis
               * AND re-centres Screen A's scroller via `resetView()`.
               * Plain `selectSubsystem(null)` alone wouldn't drop a
               * canvas-driven rack selection or pull the scroller
               * back to the row midpoint. */
              if (!item.hr_uid) {
                resetView();
                return;
              }
              /* Toggle: clicking the already-selected row should behave like
               * Preview Proposal: clear selected rack + subsystem and re-centre. */
              if (item.hr_uid === selectedSubsystemId) {
                resetView();
                return;
              }
              selectSubsystem(item.hr_uid);
            }}
          />

          <SidebarInset className="flex min-h-0 flex-1 flex-col min-w-0 bg-transparent">
            <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
          </SidebarInset>

          <SidebarRight
            className="h-full bg-slate-100"
            sidebarMode="options"
            category="infrastructure"
            defaultTab="options"
            optionsBgColor="#dde5ea"
            catalogSlot={<CatalogPanel />}
            chatSlot={
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-400">
                Magic AI Advisor — coming soon.
              </div>
            }
          />
        </div>
      </SidebarProvider>
    </DiagramProvider>
  );
}
