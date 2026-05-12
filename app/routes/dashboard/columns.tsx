import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { MoreHorizontal, Trash } from "lucide-react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { ChatBubbleAvatar } from "~/components/ui/chat/chat-bubble";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Progress } from "~/components/ui/progress";
import { QualityStatusIcon } from "../../components/ui/quality-status-icon";
import { cn } from "~/lib/utils";
import { type ProjectResponse } from "~/types/project";

// const mapStatusToTextName = {
//   [SystemGenerationStatus.INIT]: "Proposal draft",
//   [SystemGenerationStatus.IN_PROGRESS]: "In Progress",
//   [SystemGenerationStatus.COMPLETED]: "Completed",
//   [SystemGenerationStatus.FAILED]: "Failed",
// };

export function getColumns(
  onDeleteClick: (project: ProjectResponse) => void,
): ColumnDef<ProjectResponse>[] {
  return [
    {
      id: "project_status",
      header: "Profile",
      minSize: 240,
      cell: ({ row }) => {
        // const status: SystemGenerationStatus =
        //   row.original.system_generation_status;
        const submissionDeadline: string | null =
          row.original.submission_deadline;
        const userName: string = row.original.user_name || "Person name";
        const deadlineDate = submissionDeadline
          ? dayjs(submissionDeadline)
          : null;
        const isValidDate =
          deadlineDate?.isValid() &&
          submissionDeadline !== null &&
          !submissionDeadline.startsWith("0000-");
        const formattedSubmissionDeadline = isValidDate
          ? deadlineDate?.format("MMMM D, YYYY")
          : null;

        const isDeadlinePast = submissionDeadline
          ? dayjs(submissionDeadline).isBefore(dayjs().subtract(1, "week"))
          : false;
        const isDeadlineUpcoming = submissionDeadline
          ? dayjs(submissionDeadline).isAfter(dayjs().add(2, "week"))
          : false;
        const deadlineColor = isDeadlinePast
          ? "text-gray-500"
          : isDeadlineUpcoming
            ? "text-black"
            : "text-[#FF3B30]";

        const organizationName: string = row.original.organization_name;
        return (
          <div className="flex flex-col gap-4 min-w-60">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <ChatBubbleAvatar
                  className="text-black"
                  fallback={userName.slice(0, 2).toUpperCase()}
                  src={undefined}
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <span className="text-base font-medium text-ellipsis overflow-hidden text-wrap text-black">
                {userName}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-base text-black font-medium">
                {organizationName}
              </span>
              <div className="px-4 border-l-2 border-[#DBDBDB] flex flex-col">
                {/*<span className="text-base text-[#414141]">*/}
                {/*  {mapStatusToTextName[status]}*/}
                {/*</span>*/}
                {formattedSubmissionDeadline && (
                  <>
                    <span className={cn("text-base")}>
                      Submission Deadline:
                    </span>
                    <span className={cn("text-base", deadlineColor)}>
                      {formattedSubmissionDeadline}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "client_name",
      header: "Project",
      accessorFn: (row) => row.client_name,
      cell: ({ row }) => {
        const clientName: string = row.original.client_name;
        const projectName: string = row.original.name;

        return (
          <div className="flex flex-col items-start gap-2 text-ellipsis overflow-hidden text-wrap">
            <span className="text-wrap font-bold text-base">{clientName}</span>
            <span className="text-base text-[#414141]">{projectName}</span>
          </div>
        );
      },
    },
    {
      id: "description",
      header: "Description",
      cell: ({ row }) => {
        const description: string = row.original.description;
        const progress: number = row.original.system_generation_progress;
        const status: string = row.original.system_generation_status;
        if (description.length > 100) {
          return (
            <div className="flex flex-col gap-2">
              <div className="text-ellipsis overflow-hidden text-wrap text-base text-[#414141]">
                {description}
              </div>
              {progress < 100 && status === "in_progress" && (
                <div className="flex gap-4 items-center text-base">
                  Generating proposal:
                  <Progress
                    value={progress}
                    className={`h-3 rounded-none ${progress === 100 ? "bg-green-100" : "bg-[#EDF2F8]"}`}
                    color="#242E74"
                  />
                  <span className="text-base text-primary">{progress}%</span>
                </div>
              )}
            </div>
          );
        }
      },
    },
    {
      id: "quality",
      header: "Quality / Readiness",
      cell: ({ row }) => {
        const feedbacks = row.original.feedbacks;
        const statuses = feedbacks?.length
          ? feedbacks.map((f) => f.feedback_status)
          : [undefined];
        return (
          <div className="flex items-center gap-[10px]">
            {statuses.map((status, i) => (
              <QualityStatusIcon key={i} status={status} />
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(String(project.id))
                }
              >
                Copy project ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick(project);
                }}
              >
                Delete project <Trash className="ml-2 h-4 w-4 text-red-400" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
