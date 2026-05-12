import { useMemo, type ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { SidebarLeft } from "~/components/sidebar-left";
import { SidebarRight } from "~/components/sidebar-right";
import { DiagramProvider } from "~/context/DiagramContext";
import formatToUSD from "~/utils/formatUSD";
import { CatalogEntryCard } from "./CatalogEntryCard";
import { HardwareLogo } from "./HardwareLogo";
import {
  getFakeNavItems,
  getFakeProject,
  getFakeProjectPrice,
} from "./adapter";
import { hardwareProject } from "./fake-data";
import { SelectionProvider, useSelection } from "./SelectionContext";

/**
 * Three-column shell for the hardware configurator demo.
 *
 * Reuses the existing app sidebar components (`SidebarLeft`, `SidebarRight`)
 * and feeds them fake data via the `adapter` module — no new sidebar UI is
 * introduced. The catalog body inside the right sidebar is overridden with
 * the hardware subsystem-category list; the chat body is a friendly
 * placeholder for the demo.
 *
 * `SelectionProvider` wraps the whole shell so subsystem clicks in the
 * nav are pure client state (no route change); children can read it via
 * `useSelection()` to render Screens A/B/C accordingly.
 */
export function HardwareLayout({ children }: { children: ReactNode }) {
  return (
    <SelectionProvider>
      <HardwareLayoutInner>{children}</HardwareLayoutInner>
    </SelectionProvider>
  );
}

function HardwareLayoutInner({ children }: { children: ReactNode }) {
  const { selectedSubsystemId, selectSubsystem } = useSelection();
  const project = getFakeProject();
  const projectPriceData = getFakeProjectPrice();
  const navItems = useMemo(
    () => getFakeNavItems(selectedSubsystemId),
    [selectedSubsystemId],
  );

  return (
    <DiagramProvider>
      <SidebarProvider className="[--header-height:calc(--spacing(14))] overflow-hidden max-h-screen">
        <div className="flex flex-1 h-screen w-full">
          <SidebarLeft
            project={project}
            navItems={navItems}
            projectPriceData={projectPriceData}
            className="h-screen border-r-0 p-4"
            topSlot={<HardwareLogo />}
            disableHeaderClick
            hidePrimaryAction
            priceOverride={{
              label: "Grand Total:",
              value: formatToUSD(hardwareProject.grandTotalUSD),
            }}
            onNavItemSelect={(item) => {
              /* Top-level row (the project) clears the selection. */
              if (!item.hr_uid) {
                selectSubsystem(null);
                return;
              }
              /* Toggle: clicking the already-selected row clears it. */
              selectSubsystem(
                item.hr_uid === selectedSubsystemId ? null : item.hr_uid,
              );
            }}
          />

          <SidebarInset className="flex flex-col h-screen min-w-0 bg-transparent">
            {children}
          </SidebarInset>

          <SidebarRight
            className="h-screen bg-[var(--chat-background)]"
            sidebarMode="options"
            category="infrastructure"
            defaultTab="options"
            catalogSlot={
              <div className="flex flex-col gap-2 divide-y divide-slate-100">
                {hardwareProject.subsystemCategories.map((entry) => (
                  <CatalogEntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            }
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
