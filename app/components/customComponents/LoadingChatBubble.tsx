import logoImage from "~/assets/logo.svg";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "~/components/ui/chat/chat-bubble";
import { Progress } from "~/components/ui/progress";

interface LoadingChatBubbleProps {
  system_generation_message: string;
  system_generation_progress: number;
  completed?: boolean;
  title?: string;
  isSubsystem?: boolean;
}

const LoadingChatBubble = ({
  system_generation_message,
  system_generation_progress,
  completed = false,
  title,
  isSubsystem = false,
}: LoadingChatBubbleProps) => {
  return (
    <ChatBubble key={"loading"} variant={"received"} className="w-full">
      <ChatBubbleAvatar fallback={"MW"} src={logoImage} />
      <ChatBubbleMessage variant={"received"} className="w-full grow pb-1">
        <div className="flex flex-col gap-2">
          <span className="text-black text-[14px] font-bold">
            Magic AI Advisor
          </span>

          {!completed && system_generation_progress < 100 && (
            <>
              <span>
                {isSubsystem
                  ? "Generating subsystem..."
                  : "Preparing proposal..."}
              </span>
              <span>{system_generation_message}</span>
            </>
          )}

          {(completed || system_generation_progress >= 100) && (
            <span>
              {isSubsystem
                ? `${title ? title : "Subsystem"} has been generated`
                : "The Proposal has been generated"}
            </span>
          )}

          <div className="flex gap-3 items-center">
            <Progress
              className={`h-2 ${completed ? "bg-green-100" : ""}`}
              value={system_generation_progress}
              color="#242E74"
            />
            <span className="text-primary">{system_generation_progress}%</span>
          </div>
        </div>
      </ChatBubbleMessage>
    </ChatBubble>
  );
};

export default LoadingChatBubble;
