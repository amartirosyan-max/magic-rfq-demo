import React from "react";
import { useNavigate } from "react-router";
import { spanifyText } from "~/components/stack/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

interface ContentBoxProps {
  content: {
    title: string;
    url?: string;
    rootSubsystemName?: string;
    hr_uid?: string;
  };
  isometricImage?: string | null;
}

function ContentBox({ content, isometricImage }: ContentBoxProps) {
  const navigate = useNavigate();

  const boxContent = (
    <div
      className={`
        content-box
        flex-1
        min-w-[120px]
        flex items-center justify-center
        ${isometricImage ? "bg-transparent" : "bg-black/25"}
        self-stretch
        p-0.5
        transform
        min-h-[40px]
        cursor-pointer
        relative
        h-full
      `}
      onClick={(event) => {
        console.log("clicked, ", content);
        event.stopPropagation();
        if (content?.url) {
          navigate(content.url);
        }
      }}
    >
      <div className="box-text text-white text-center leading-tight text-[14px] font-medium">
        {isometricImage ? (
          <>
            {/* Empty span to maintain the same height as text boxes */}
            <span className="opacity-0">placeholder</span>
            {/* Absolutely positioned image that breaks out of the container */}
            <div className="absolute inset-0 overflow-visible flex items-center justify-center pointer-events-none">
              <img
                src={isometricImage}
                alt={content.title || "Isometric Image"}
                className="scale-[1.7] z-10 max-w-20 -mt-5"
              />
            </div>
          </>
        ) : (
          spanifyText(content.title as string)
        )}
      </div>
    </div>
  );

  // If we have a root subsystem name, wrap the box in a tooltip
  if (content.rootSubsystemName) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{boxContent}</TooltipTrigger>
          <TooltipContent>
            {isometricImage ? (
              <>
                <p>{content.rootSubsystemName}:</p>
                <p>{content.title}</p>
              </>
            ) : (
              <p>{content.rootSubsystemName}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Otherwise return just the box
  return boxContent;
}

export default ContentBox;
