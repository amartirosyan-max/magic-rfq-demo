import { Separator } from "~/components/ui/separator";
import {
  EUserProjectSelection,
  type SubsystemResponse,
} from "~/types/systemResponse";
import ActionsButtons from "~/components/customComponents/ActionsButtons";
import { Pencil } from "lucide-react";
import { useRef, useState } from "react";

interface IBlockTitleProps {
  onUpdateStatus: (status: EUserProjectSelection | null, id: string) => void;
  onUpdateTitle?: (newTitle: string) => void;
  onUpdateAttributes?: (newTitle: string, newDescription: string) => void;
  subsystem: SubsystemResponse;
}

const BlockTitle = ({
  onUpdateStatus,
  onUpdateTitle,
  onUpdateAttributes,
  subsystem,
}: IBlockTitleProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  // Function to adjust textarea height based on content
  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
    element.focus();
  };

  // Handle editing title
  const handleEditTitle = () => {
    if (!onUpdateTitle && !onUpdateAttributes) return;

    setIsEditingTitle(true);
    // Wait for the textarea to render before adjusting height
    setTimeout(() => {
      if (inputRef.current) {
        adjustTextareaHeight(inputRef.current);
      }
    }, 0);
  };

  // Handle editing description
  const handleEditDescription = () => {
    if (!onUpdateAttributes) return;

    setIsEditingDescription(true);
    // Wait for the textarea to render before adjusting height
    setTimeout(() => {
      if (descriptionRef.current) {
        adjustTextareaHeight(descriptionRef.current);
      }
    }, 0);
  };

  // Handle blur or enter key when editing title
  const handleTitleBlurOrEnter = () => {
    if (!inputRef.current) {
      setIsEditingTitle(false);
      return;
    }

    const newTitle = inputRef.current.value.trim();
    if (!newTitle || newTitle === subsystem.title) {
      setIsEditingTitle(false);
      return;
    }

    if (onUpdateAttributes) {
      onUpdateAttributes(newTitle, subsystem.description || "");
    } else if (onUpdateTitle) {
      onUpdateTitle(newTitle);
    }
    setIsEditingTitle(false);
  };

  // Handle blur or enter key when editing description
  const handleDescriptionBlurOrEnter = () => {
    if (!descriptionRef.current || !onUpdateAttributes) {
      setIsEditingDescription(false);
      return;
    }

    const newDescription = descriptionRef.current.value.trim();
    if (newDescription === subsystem.description) {
      setIsEditingDescription(false);
      return;
    }

    onUpdateAttributes(subsystem.title, newDescription);
    setIsEditingDescription(false);
  };

  return (
    <div className="flex gap-6 text-black justify-between">
      <div className="flex flex-col gap-1 w-full">
        {isEditingTitle ? (
          <textarea
            id="title-input"
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className={
              "text-3xl font-bold font-[Roboto_Serif] text-[#3a3540] bg-white border-b border-gray-300 focus:outline-none focus:border-primary resize-none overflow-hidden"
            }
            defaultValue={subsystem.title || ""}
            onBlur={handleTitleBlurOrEnter}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleTitleBlurOrEnter();
              }
              if (e.key === "Escape") setIsEditingTitle(false);
            }}
            onInput={(e) =>
              adjustTextareaHeight(e.target as HTMLTextAreaElement)
            }
            rows={1}
          />
        ) : (
          <div className="relative flex items-center group gap-2.5">
            <h1 className="text-3xl font-bold font-[Roboto_Serif] text-[#3a3540]">
              {subsystem.title}
            </h1>
            {(onUpdateTitle || onUpdateAttributes) && (
              <button
                className="p-2 rounded hover:bg-gray-200 transition cursor-pointer"
                style={{ top: 0 }}
                onClick={handleEditTitle}
                tabIndex={-1}
              >
                <Pencil className="w-5 h-5 text-gray-500 opacity-50" />
              </button>
            )}
          </div>
        )}

        {isEditingDescription ? (
          <textarea
            id="description-input"
            ref={descriptionRef as React.RefObject<HTMLTextAreaElement>}
            className={
              "text-base leading-[150%] bg-white border-b border-gray-300 focus:outline-none focus:border-primary resize-none overflow-hidden w-full"
            }
            defaultValue={subsystem.description || ""}
            onBlur={handleDescriptionBlurOrEnter}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleDescriptionBlurOrEnter();
              }
              if (e.key === "Escape") setIsEditingDescription(false);
            }}
            onInput={(e) =>
              adjustTextareaHeight(e.target as HTMLTextAreaElement)
            }
            rows={1}
          />
        ) : (
          <div className="relative flex items-start group gap-2.5">
            <p className="text-base leading-[150%]">{subsystem.description}</p>
            {onUpdateAttributes && (
              <button
                className="p-2 rounded hover:bg-gray-200 transition cursor-pointer"
                style={{ top: 0 }}
                onClick={handleEditDescription}
                tabIndex={-1}
              >
                <Pencil className="w-5 h-5 text-gray-500 opacity-50" />
              </button>
            )}
          </div>
        )}
      </div>
      <Separator orientation="vertical" className="bg-[var(--active-tab)]" />
      <ActionsButtons
        system={{
          id: subsystem.id,
          status: subsystem.status,
          recommended: subsystem.recommended,
          design_completed: (subsystem as SubsystemResponse).design_completed,
          title: (subsystem as SubsystemResponse).title,
        }}
        isSidebar={false}
        onUpdateStatus={onUpdateStatus}
      />
    </div>
  );
};

export default BlockTitle;
