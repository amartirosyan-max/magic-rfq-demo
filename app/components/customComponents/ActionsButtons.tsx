import { CirclePlus, CircleX, Loader2, SquareSquare } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useProject } from "~/context/ProjectContext";
import { useSubsystemGeneration } from "~/context/SubsystemGenerationContext";
import { cn } from "~/lib/utils";
import { SystemGenerationStatus } from "~/types/project";
import { EUserProjectSelection } from "~/types/systemResponse";

interface IActionsButtonsProps {
  system: {
    id: number;
    status: EUserProjectSelection | string | null;
    recommended: boolean;
    design_completed?: boolean;
    title?: string;
  };
  isSidebar: boolean;
  onUpdateStatus: (status: EUserProjectSelection | null, id: string) => void;
  isLoading?: boolean;
}

const ActionsButtons = ({
  system,
  onUpdateStatus,
  isLoading,
  isSidebar,
}: IActionsButtonsProps) => {
  const { id, status, recommended, design_completed } = system;
  const { project } = useProject();
  const { startSubsystemGeneration, generatingSubsystemIds } =
    useSubsystemGeneration();

  // Check if this specific subsystem is being generated
  const isThisSubsystemGenerating = generatingSubsystemIds.includes(String(id));

  // Handle the add to proposal button click
  const handleAddToProposal = () => {
    const systemComplete =
      project?.system_generation_progress === 100 ||
      project?.system_generation_status === SystemGenerationStatus.COMPLETED;

    // If project generation is complete and this subsystem is not designed yet
    // then start its generation when adding to proposal
    if (
      systemComplete &&
      design_completed === false &&
      !isThisSubsystemGenerating
    ) {
      console.log("[ActionsButtons] Starting generation for subsystem:", id);
      startSubsystemGeneration(String(id), system.title);
    }

    // Update status regardless
    onUpdateStatus(
      status === EUserProjectSelection.Chosen
        ? null
        : EUserProjectSelection.Chosen,
      String(id),
    );
  };

  return (
    <div className="flex flex-col gap-2.5 select-none">
      <div
        className={cn("flex select-none", {
          "text-primary": status === EUserProjectSelection.Chosen,
          "text-destructive": status === EUserProjectSelection.Removed,
          "text-[#8B8B8B]": status === EUserProjectSelection.Existing,
        })}
        style={{
          justifyContent: isSidebar ? "start" : "center",
          padding: isSidebar ? "" : "1.5px",
        }}
      >
        <span className="flex h-5 items-center">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {!recommended && status === null && (
                <span className="text-[#B0B0B0] text-[16px] font-bold">
                  Not in proposal
                </span>
              )}
              {recommended && status === null && (
                <span className="text-[#087429] text-[16px] font-bold">
                  Recommended
                </span>
              )}
              {status === EUserProjectSelection.Chosen && (
                <span className="text-[16px] font-bold">In proposal</span>
              )}
              {status === EUserProjectSelection.Removed && (
                <span className="text-[16px] font-bold">Removed</span>
              )}
              {status === EUserProjectSelection.Existing && (
                <span className="text-[16px] font-bold">Already Done</span>
              )}
            </>
          )}
        </span>
      </div>
      <div className="flex gap-2.5 text-primary select-none">
        <Tooltip>
          <TooltipTrigger asChild className="select-none">
            <Button
              variant="ghost"
              onClick={handleAddToProposal}
              className={cn(
                "bg-[#EEF3F9] rounded-none justify-start px-5 py-3 select-none",
                status === EUserProjectSelection.Chosen
                  ? "text-white bg-primary hover:bg-primary/80 opacity-100!"
                  : "text-primary",
                {
                  "bg-[#E0EBFC]":
                    recommended && status !== EUserProjectSelection.Chosen,
                },
              )}
              disabled={isThisSubsystemGenerating}
            >
              <CirclePlus />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="select-none">
            <span>
              {status === EUserProjectSelection.Chosen
                ? "Undo selection"
                : "Add to proposal"}
            </span>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild className="select-none">
            <Button
              variant="ghost"
              onClick={() =>
                onUpdateStatus(
                  status === EUserProjectSelection.Existing
                    ? null
                    : EUserProjectSelection.Existing,
                  String(id),
                )
              }
              className={cn(
                "bg-[#EEF3F9] rounded-none justify-start px-5 py-3 select-none",
                status === EUserProjectSelection.Existing
                  ? "text-white bg-[#8B8B8B] hover:bg-[#8B8B8B]/80 opacity-100!"
                  : "text-primary ",
              )}
              disabled={isThisSubsystemGenerating}
            >
              <SquareSquare />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="select-none">
            <span>
              {status === EUserProjectSelection.Existing
                ? "Undo selection"
                : "Mark as Already Implemented"}
            </span>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              onClick={() =>
                onUpdateStatus(
                  status === EUserProjectSelection.Removed
                    ? null
                    : EUserProjectSelection.Removed,
                  String(id),
                )
              }
              className={cn(
                "bg-[#F9EEEE] rounded-none justify-start px-5 py-3 text-[#A63737] hover:text-white select-none",
                system.status === EUserProjectSelection.Removed
                  ? "text-white bg-destructive hover:bg-primary/80 opacity-100!"
                  : "text-[#A63737]",
              )}
              disabled={isThisSubsystemGenerating}
            >
              <CircleX />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="select-none">
            <span>
              {status === EUserProjectSelection.Removed
                ? "Undo removal"
                : "Remove as this options is not relevant"}
            </span>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default ActionsButtons;
