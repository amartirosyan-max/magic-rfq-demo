// import * as React from "react";
import { useEffect, useState, type ReactNode } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "~/components/ui/sidebar";
import { useDiagram } from "~/context/DiagramContext";
import type { SidebarRightMode } from "~/layouts/project";
import { cn } from "~/lib/utils";
import { Options } from "./options";
import { SidebarRightChat } from "./sidebar-right-chat";
import "./sidebar-right.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export interface SidebarRightProps
  extends React.ComponentProps<typeof Sidebar> {
  className?: string;
  topSubsystemId?: string;
  sidebarMode: SidebarRightMode;
  category: "ecosystem" | "infrastructure" | undefined;
  /**
   * Optional slot overrides used by demo flows that want the same sidebar
   * chrome but custom (non-API) content inside the tabs. Both slots are
   * fully backward-compatible — when omitted, the production behaviour is
   * preserved (chat + Options).
   */
  catalogSlot?: ReactNode;
  chatSlot?: ReactNode;
  defaultTab?: "magicAiAdvisor" | "team" | "options";
  /**
   * Background colour applied (via inline style) when the Options /
   * Catalog tab is active. Defaults to `#ffffff` to preserve the
   * production project-layout behaviour. The hardware demo overrides
   * to `#f1f5f9` (Tailwind `slate-100`) per Dr. Artemy's 2026-05-13
   * comment "the catalog background should be light gray".
   *
   * It has to live as a prop (rather than just a className) because the
   * existing implementation sets `backgroundColor` via an inline style,
   * which beats any Tailwind utility supplied through `className`.
   */
  optionsBgColor?: string;
}

export function SidebarRight({
  className,
  topSubsystemId,
  sidebarMode,
  category,
  catalogSlot,
  chatSlot,
  defaultTab = "magicAiAdvisor",
  optionsBgColor = "#ffffff",
  ...props
}: SidebarRightProps) {
  const { diagram } = useDiagram();
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  useEffect(() => {
    if (sidebarMode === "options") setActiveTab("options");

    return () => setActiveTab(defaultTab);
  }, [sidebarMode, defaultTab]);

  return (
    <Sidebar
      collapsible="none"
      className={cn(
        "sticky top-0 hidden h-svh min-h-0 overflow-hidden border-l pt-3.5 lg:flex",
        className,
      )}
      style={{
        minInlineSize: "400px",
        // padding: activeTab === "options" ? "10px" : "",
        backgroundColor: activeTab === "options" ? optionsBgColor : "",
        overflow: "hidden",
        paddingBlockEnd: activeTab === "options" ? "10px" : "",
      }}
      {...props}
    >
      <Tabs
        defaultValue={defaultTab}
        className="flex h-full min-h-0 flex-col gap-2.5"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <SidebarHeader className="border-sidebar-border flex w-full shrink-0 flex-row items-center justify-between px-2.5 mt-1.5 ml-[3.5px]">
          <TabsList className="bg-transparent">
            <TabsTrigger value="magicAiAdvisor">Magic AI Advisor</TabsTrigger>
            <TabsTrigger
              value="team"
              className="border-l-1 border-r-1 border-l-primary border-r-primary"
            >
              Team
            </TabsTrigger>
            <TabsTrigger value="options">Catalog</TabsTrigger>
          </TabsList>
        </SidebarHeader>

        <SidebarContent className="min-h-0 flex-1 overflow-hidden">
          <TabsContent
            value="magicAiAdvisor"
            className="flex h-full min-h-0 flex-col overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden"
          >
            {chatSlot ?? <SidebarRightChat topSubsystemId={topSubsystemId} />}
          </TabsContent>

          <TabsContent
            value="team"
            className="flex h-full min-h-0 items-center justify-center overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden"
          >
            <div className="text-gray-500">
              Team functionality coming soon...
            </div>
          </TabsContent>
          <TabsContent
            value="options"
            className="h-full min-h-0 overflow-hidden p-[10px] data-[state=active]:flex data-[state=inactive]:hidden"
          >
            {catalogSlot ?? <Options isSidebar category={category} />}
          </TabsContent>
        </SidebarContent>
      </Tabs>
    </Sidebar>
  );
}
