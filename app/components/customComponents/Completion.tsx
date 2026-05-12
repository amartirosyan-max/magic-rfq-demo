import { Info } from "lucide-react";
import { Progress } from "~/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

interface ICompletionProps {
  percentage: number;
  onViewDesign?: () => void;
  title?: string;
  progressColor?: string;
  tooltipContent?: React.ReactNode;
}

const Completion = ({
  percentage,
  onViewDesign,
  title = "Questionnaire Completion",
  progressColor = "#8DDF8A",
  tooltipContent,
}: ICompletionProps) => {
  const titleBlock = (
    <h3 className="font-bold leading-[140%] text-[20px] flex items-center gap-2">
      {title}
      {tooltipContent && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex h-4 w-4 items-center justify-center text-primary cursor-help">
              <Info className="h-3.5 w-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent
            className="max-w-lg p-3 text-base"
            side="right"
            bgVar="--lead-score-tooltip-bg"
            fgVar="--lead-score-tooltip-fg"
          >
            <div className="max-w-lg text-[13px] leading-snug">
              {tooltipContent}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </h3>
  );

  return (
    <div className="text-black flex flex-col gap-4">
      {titleBlock}
      <div className="flex gap-3 items-center">
        <Progress
          className={`h-4 rounded-xl ${percentage === 100 ? "bg-green-100" : "bg-[#EDF2F8]"}`}
          value={percentage}
          color={progressColor}
        />
        <span className="font-bold text-xl">{percentage}%</span>
      </div>
      {/*{percentage >= 50 && (*/}
      {/*  <div className="pt-2 flex gap-2 items-center">*/}
      {/*    <p className="text-base leading-[150%]">*/}
      {/*      Congratulations! We have enough information to suggest a proposal.*/}
      {/*      Add more information to adjust the price.*/}
      {/*    </p>*/}
      {/*    <Button*/}
      {/*      className="bg-[var(--active-tab)] px-6"*/}
      {/*      onClick={onViewDesign}*/}
      {/*    >*/}
      {/*      View Design*/}
      {/*    </Button>*/}
      {/*  </div>*/}
      {/*)}*/}
    </div>
  );
};

export default Completion;
