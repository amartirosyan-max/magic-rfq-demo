import { Loader2, PanelRightOpen } from "lucide-react";
import LogoMindware from "~/assets/logo_mv.svg?react";

import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import { getProjects } from "~/api/projects";
import { NavUser } from "~/components/nav-user";
import { Button } from "~/components/ui/button";
import { EQueryKey } from "~/constants/queryKeys";
import { useAuth } from "~/context/AuthContext";
import { useProject } from "~/context/ProjectContext";

export function SiteHeader() {
  // const { toggleSidebar } = useSidebar();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { account } = useAuth();
  const { project } = useProject();
  const { data: projects, isLoading } = useQuery({
    queryKey: [EQueryKey.PROJECTS],
    queryFn: getProjects,
  });

  return (
    <header className="flex sticky top-0 z-50 w-full items-center bg-primary">
      <div className="flex h-(--header-height) w-full items-center gap-8 px-4">
        {pathname !== "/dashboard" && (
          <>
            <Button
              className="h-8 w-8 text-white hover:text-secondary"
              variant="ghost"
              size="icon"
              // onClick={toggleSidebar}
              onClick={() => navigate("/dashboard")}
            >
              {/*<SidebarIcon />*/}
              <PanelRightOpen className="size-6" />
            </Button>
          </>
        )}

        <div className="flex gap-6 items-center">
          <LogoMindware className="text-white" />
          <span
            className="
          text-[var(--secondary)]
          font-semibold
          text-[27px]
          leading-[110%]
          tracking-widest
          uppercase
          select-none
        "
          >
            MAGIC
          </span>
        </div>
        {isLoading && !project ? (
          <div className="flex items-center justify-end w-full h-full">
            <Loader2 className="animate-spin" color="white" />
          </div>
        ) : (
          <NavUser
            user={{
              name: account?.name ?? "Admin",
              email: account?.email ?? account?.login ?? "",
              avatar: "/avatars/shadcn.jpg",
            }}
          />
        )}
      </div>
    </header>
  );
}
