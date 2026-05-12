import { Outlet, useLocation, useParams } from "react-router";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { SidebarLeft } from "~/components/sidebar-left";
import { SidebarRight } from "~/components/sidebar-right";
import { SiteHeader } from "~/components/site-header";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import type { SystemTreeResponse } from "~/types/tree";
import { ScrollArea } from "~/components/ui/scroll-area";
import { getProject } from "~/api/projects";
import { getProjectPrice } from "~/api/billing";
import { useProject } from "~/context/ProjectContext";
import { PollingProvider } from "~/context/PollingContext";
import { SubsystemGenerationProvider } from "~/context/SubsystemGenerationContext";
import { mapTreeToSidebar } from "~/utils/tree";
import { useQuery } from "@tanstack/react-query";
import { getProjectTree } from "~/api/systems";
import { EQueryKey } from "~/constants/queryKeys";
import { ProjectBreadcrumbs } from "~/components/project-breadcrumbs";
import { DiagramContext, DiagramProvider } from "~/context/DiagramContext";

export type SidebarRightMode = "chat" | "options";

export type ProjectLayoutContext = {
  openRightOptions: (
    category?: "ecosystem" | "infrastructure" | undefined,
  ) => void;
  openRightChat: () => void;
};

export default function ProjectLayout() {
  const { id, systemId, "*": subsystemPath } = useParams();
  const location = useLocation();
  const { setProject } = useProject();

  const [rightCategory, setRightCategory] = useState<
    "ecosystem" | "infrastructure" | undefined
  >();
  const [sidebarRightMode, setSidebarRightMode] =
    useState<SidebarRightMode>("chat");

  const { data: projectData, isPending: isPendingProject } = useQuery({
    queryKey: [EQueryKey.PROJECT_DATA, id],
    queryFn: () => getProject(String(id)),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data &&
        "creating_status" in data &&
        data.creating_status === "in_progress"
        ? 1000
        : false;
    },
  });

  const { data: treeData, isLoading: isLoadingTree } = useQuery<
    SystemTreeResponse[],
    AxiosError
  >({
    queryKey: [EQueryKey.PROJECT_TREE, id],
    queryFn: () => getProjectTree(id as string),
    enabled: !!id,
    retry: false,
  });

  useEffect(() => {
    if (projectData) {
      setProject(projectData);
    }
  }, [projectData, setProject]);

  const { data: projectPriceData } = useQuery({
    queryKey: [EQueryKey.PROJECT_PRICE_DATA, id],
    queryFn: () => getProjectPrice(String(id)),
    enabled: !!id,
    retry: false,
  });

  const navItems = useMemo(() => {
    if (!treeData || !Array.isArray(treeData)) return [];

    // First generate the nav items
    const items = mapTreeToSidebar(
      treeData,
      id as string,
      undefined,
      true,
      location.pathname,
    );

    return items;
  }, [treeData, id, location.pathname]);

  return (
    <PollingProvider>
      <SubsystemGenerationProvider>
        <DiagramProvider>
          <SidebarProvider className="[--header-height:calc(--spacing(14))] overflow-hidden max-h-screen">
            <SiteHeader />
            <div className="flex flex-1 gap-4">
              <SidebarLeft
                project={projectData}
                navItems={navItems}
                projectPriceData={projectPriceData}
                className="top-(--header-height) h-[calc(100svh-var(--header-height))]! border-r-0! p-4 pr-0"
              />
              <SidebarInset className="flex flex-col h-[calc(100svh-var(--header-height))] min-w-0">
                <header className="sticky top-0 flex items-top h-11 shrink-0 gap-2 bg-background pt-4">
                  <ProjectBreadcrumbs
                    treeData={treeData}
                    projectId={id as string}
                    systemId={systemId}
                    subsystemPath={subsystemPath}
                  />
                </header>
                <ScrollArea
                  className="flex-1 min-h-0 h-full"
                  scrollHideDelay={0}
                >
                  <main className="h-full flex flex-col min-h-full">
                    <Outlet
                      context={{
                        openRightOptions: (
                          category?: "ecosystem" | "infrastructure",
                        ) => {
                          setRightCategory(category);
                          setSidebarRightMode("options");
                        },
                        openRightChat: () => {
                          setSidebarRightMode("chat");
                        },
                      }}
                    />
                  </main>
                </ScrollArea>
              </SidebarInset>
              <SidebarRight
                className="top-(--header-height) h-[calc(100svh-var(--header-height)-44px)]! bg-[var(--chat-background)] mt-11"
                topSubsystemId={
                  treeData && treeData.length > 0
                    ? String(treeData[0].id)
                    : undefined
                }
                sidebarMode={sidebarRightMode}
                category={rightCategory}
              />
            </div>
          </SidebarProvider>
          {(isPendingProject || isLoadingTree) && (
            <div className="flex items-center justify-center h-screen">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
          )}
        </DiagramProvider>
      </SubsystemGenerationProvider>
    </PollingProvider>
  );
}
