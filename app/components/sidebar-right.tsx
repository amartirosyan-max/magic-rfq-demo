// import * as React from "react";
import { useEffect, useState } from "react";
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
}

export function SidebarRight({
  className,
  topSubsystemId,
  sidebarMode,
  category,
  ...props
}: SidebarRightProps) {
  const { diagram } = useDiagram();
  const [activeTab, setActiveTab] = useState<string>("magicAiAdvisor");

  useEffect(() => {
    if (sidebarMode === "options") setActiveTab("options");

    return () => setActiveTab("magicAiAdvisor");
  }, [sidebarMode]);

  return (
    <Sidebar
      collapsible="none"
      className={cn(
        "ticky top-0 hidden h-svh border-l lg:flex pt-2.5",
        className,
      )}
      style={{
        minInlineSize: "400px",
        // padding: activeTab === "options" ? "10px" : "",
        backgroundColor: activeTab === "options" ? "#ffffff" : "",
        overflow: "auto",
        paddingBlockEnd: activeTab === "options" ? "10px" : "",
      }}
      {...props}
    >
      <Tabs
        defaultValue="magicAiAdvisor"
        className="flex flex-col h-full gap-2.5"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <SidebarHeader className="border-sidebar-border flex flex-row items-center w-full justify-between px-2.5">
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

        <SidebarContent className="flex-1 overflow-auto">
          <TabsContent
            value="magicAiAdvisor"
            className="flex flex-col h-full data-[state=active]:flex data-[state=inactive]:hidden"
          >
            <SidebarRightChat topSubsystemId={topSubsystemId} />
          </TabsContent>

          <TabsContent
            value="team"
            className="h-full flex items-center justify-center data-[state=active]:flex data-[state=inactive]:hidden"
          >
            <div className="text-gray-500">
              Team functionality coming soon...
            </div>
          </TabsContent>
          <TabsContent value="options" className="p-[10px]">
            <Options isSidebar category={category} />
          </TabsContent>
        </SidebarContent>
      </Tabs>
    </Sidebar>
  );
}
