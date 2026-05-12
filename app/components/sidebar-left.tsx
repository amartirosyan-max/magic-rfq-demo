import * as React from "react";

import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { Info, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import type { IProjectPriceResponse } from "~/api/billing";
import { NavMain } from "~/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "~/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { EQueryKey } from "~/constants/queryKeys";
import { cn, parseLeadScore } from "~/lib/utils";
import {
  CreatingStatus,
  type ProjectResponse,
  SystemGenerationStatus,
} from "~/types/project";
import formatToUSD from "~/utils/formatUSD";
import { Button } from "./ui/button";
import type { NavItem } from "~/types/navigation";

interface ISidebarLeftProps extends React.ComponentProps<typeof Sidebar> {
  className?: string;
  navItems: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    category: string;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  project?: ProjectResponse;
  projectPriceData?: IProjectPriceResponse;
}

export function SidebarLeft({
  className,
  navItems,
  project,
  projectPriceData,
  ...props
}: ISidebarLeftProps) {
  const navigate = useNavigate();
  const projectId = project?.id ? String(project.id) : "";
  const { data: isUseCasesGeneratedCache = false } = useQuery({
    queryKey: [EQueryKey.USE_CASES_GENERATED, projectId],
    queryFn: () => false,
    enabled: false,
    initialData: false,
  });
  const isUseCasesGenerated = isUseCasesGeneratedCache;
  const isProjectCompleted =
    project?.creating_status === CreatingStatus.COMPLETED;
  const canPreviewProposal =
    isProjectCompleted &&
    (project?.system_generation_status === SystemGenerationStatus.COMPLETED ||
      isUseCasesGenerated);
  const leadScoreValue = parseLeadScore(project?.lead_score);

  React.useEffect(() => {
    if (!project?.id || Number.isNaN(leadScoreValue)) return;
    if (leadScoreValue <= 2.0) {
      navigate(`/projects/${project.id}/lead-score`, { replace: true });
    }
  }, [leadScoreValue, navigate, project?.id]);

  return (
    <Sidebar className={cn("border-r-0", className)} {...props}>
      <SidebarHeader>
        <div
          className="bg-[var(--chat-background)] flex flex-col items-center justify-center gap-2.5 p-4 cursor-pointer"
          onClick={() => {
            if (
              project &&
              project.creating_status !== CreatingStatus.IN_PROGRESS
            ) {
              navigate(`/projects/${project?.id}`, { replace: true });
            }
          }}
        >
          {!project ||
          project.creating_status === CreatingStatus.IN_PROGRESS ? (
            <div className="flex items-center justify-center w-full h-full">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-1">
                <h2 className="text-[#3a3540] text-center text-lg font-bold leading-[140%] font-[Roboto_Serif]">
                  {project?.client_name}
                </h2>

                <p className="text-black text-center text-base leading-[150%]">
                  {project?.name}
                </p>
              </div>
              {project.lead_score && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center gap-2 text-black text-center text-base leading-[150%] cursor-help">
                      <span>
                        Lead score: {project.lead_score.split("/")[0]}
                      </span>
                      <span className="inline-flex h-4 w-4 items-center justify-center  text-primary">
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    className="max-w-sm p-3 text-base"
                    side="right"
                    bgVar="--lead-score-tooltip-bg"
                    fgVar="--lead-score-tooltip-fg"
                  >
                    <div className="max-w-sm text-[13px] leading-snug">
                      <div className="mb-1 font-semibold">
                        Lead Score Calculation
                      </div>

                      <div className="mb-2 font-mono text-xs">Lead Score:</div>
                      <div className="mb-2 font-mono text-xs whitespace-nowrap">
                        <span className="whitespace-nowrap">
                          (Budget × 0.40)
                        </span>{" "}
                        +{" "}
                        <span className="whitespace-nowrap">(RFP × 0.35)</span>{" "}
                        +{" "}
                        <span className="whitespace-nowrap">
                          (AI Fit × 0.25)
                        </span>
                      </div>

                      <ul className="mb-2 list-disc pl-4">
                        <li>
                          <span className="font-medium">Budget (40%)</span> —
                          project budget estimate
                        </li>
                        <li>
                          <span className="font-medium">RFP (35%)</span> — AI
                          depth & technical scope
                        </li>
                        <li>
                          <span className="font-medium">AI Fit (25%)</span> —
                          enterprise AI relevance
                        </li>
                      </ul>

                      <div className="text-xs opacity-80">
                        Each factor is scored from{" "}
                        <span className="font-medium">0 to 10</span>.
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
              {(projectPriceData?.price !== "0" ||
                projectPriceData?.price_max !== "0") && (
                <div className="flex flex-col items-center gap-1 text-black text-center text-base leading-[150%] ">
                  <span>Price range:</span>
                  {/*<span className="font-bold">$234,000 - $380,000</span>*/}
                  <span className="font-bold">
                    {projectPriceData?.price && +projectPriceData.price > 0
                      ? `${formatToUSD(+projectPriceData.price * 0.8)} - ${formatToUSD(+projectPriceData.price * 1.3)}`
                      : "Add more info for price estimation"}
                  </span>
                </div>
              )}

              {/*<div className="flex items-center gap-2 w-full relative h-12">*/}
              {/*  <div className="relative w-full h-full bg-white">*/}
              {/*    <div*/}
              {/*      className="absolute left-0 top-0 h-full bg-secondary"*/}
              {/*      style={{ width: "35%" }}*/}
              {/*    />*/}
              {/*  </div>*/}
              {/*  <div className="absolute w-full text-center text-sm font-medium top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary">*/}
              {/*    Proposal Progress*/}
              {/*  </div>*/}
              {/*</div>*/}
              {canPreviewProposal ? (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`/projects/${project?.id}?tab=proposal`);
                  }}
                >
                  Preview Proposal
                </Button>
              ) : (
                <Button
                  disabled={!isProjectCompleted}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`/projects/${project?.id}?tab=use_cases`);
                  }}
                >
                  Use cases
                </Button>
              )}
            </>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/*<NavFavorites favorites={data.favorites} />*/}
        {/*<NavWorkspaces workspaces={data.workspaces} />*/}
        {/*<NavSecondary items={data.navSecondary} className="mt-auto" />*/}
        {/* <NavMain items={navItems} /> */}
        <NavMain items={navItems as unknown as NavItem[]} />
      </SidebarContent>
      <SidebarFooter className="p-0">
        <span className="text-sm text-left leading-[150%] text-[#949496]">
          Powered by <span className="font-bold">Data Monsters</span>
        </span>
      </SidebarFooter>
      {/*<SidebarRail />*/}
    </Sidebar>
  );
}
