import { Paperclip, SendHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  EChatTarget,
  getChatHistory,
  sendProjectChatMessage,
  uploadChatFiles,
  type IChatAssetInfo,
} from "~/api/chat";
import { downloadProjectAsset } from "~/api/projects";
import FileDoc from "~/assets/filesIcons/file-doc.svg";
import FilePdf from "~/assets/filesIcons/file-pdf.svg";
import logoImage from "~/assets/logo.svg";
import { usePolling } from "~/context/PollingContext";
import { useProject } from "~/context/ProjectContext";
import {
  useSubsystemGeneration,
  type SubsystemGenerationStatus,
} from "~/context/SubsystemGenerationContext";
import { CreatingStatus, SystemGenerationStatus } from "~/types/project";
import LoadingChatBubble from "./customComponents/LoadingChatBubble";
import type { SidebarRightProps } from "./sidebar-right";
import { Button } from "./ui/button";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "./ui/chat/chat-bubble";
import { ChatInput } from "./ui/chat/chat-input";
import { ChatMessageList } from "./ui/chat/chat-message-list";
import { Input } from "./ui/input";
import { SidebarContent } from "./ui/sidebar";
import { Tabs, TabsContent } from "./ui/tabs";

interface SidebarRightChatProps
  extends Omit<SidebarRightProps, "sidebarMode" | "category"> {
  topSubsystemId?: string;
}

// message types
type Message =
  | {
      type: "chat";
      role: "assistant" | "user";
      message: string;
      assets?: IChatAssetInfo[] | null;
    }
  | {
      type: "loading";
      id: string;
      system_generation_message: string;
      system_generation_progress: number;
      completed?: boolean;
      title?: string;
      isSubsystem?: boolean;
    };

const INITIAL_MESSAGES: Array<Message> = [
  {
    type: "chat",
    role: "assistant",
    message: "New project was successfully created",
  },
];

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return FilePdf;
  return FileDoc;
};

export function SidebarRightChat({ topSubsystemId }: SidebarRightChatProps) {
  const { id, systemId } = useParams();
  const { project } = useProject();
  const { pollingData } = usePolling();
  const { subsystemGenerationStatuses } = useSubsystemGeneration();

  const isChatReady =
    !!id && !!project && project.creating_status === CreatingStatus.COMPLETED;

  const [messages, setMessages] = useState<Array<Message>>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const messagesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyLoadedForProjectRef = useRef<string | null>(null);

  const prevSubsystemStatuses = useRef<
    Record<string, SubsystemGenerationStatus>
  >({});
  const prevProjectStatus = useRef<{
    status?: SystemGenerationStatus;
    message?: string;
    progress?: number;
  } | null>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setMessages(INITIAL_MESSAGES);
    setPendingFiles([]);
    prevSubsystemStatuses.current = {};
    prevProjectStatus.current = null;
    historyLoadedForProjectRef.current = null;
  }, [id]);

  // Подгрузка истории чата после создания проекта (creating_status === COMPLETED)
  useEffect(() => {
    if (!id || !isChatReady || historyLoadedForProjectRef.current === id)
      return;
    historyLoadedForProjectRef.current = id;
    getChatHistory(id)
      .then((history) => {
        if (history.length === 0) return;
        const mapped: Message[] = history.map((h) => ({
          type: "chat" as const,
          role: h.sender === "bot" ? "assistant" : "user",
          message: h.message,
          assets: h.assets ?? undefined,
        }));
        setMessages(mapped);
      })
      .catch(() => {});
  }, [id, isChatReady]);

  // Add project generation status as a message when it changes
  useEffect(() => {
    const currentStatus =
      pollingData?.system_generation_status ||
      project?.system_generation_status;

    const currentMessage =
      pollingData?.system_generation_message ||
      project?.system_generation_message;

    const currentProgress =
      pollingData?.system_generation_progress ||
      project?.system_generation_progress;

    const prev = prevProjectStatus.current;
    const hasChanged =
      !prev ||
      prev.status !== currentStatus ||
      prev.message !== currentMessage ||
      prev.progress !== currentProgress;

    if (
      currentStatus &&
      (currentStatus === SystemGenerationStatus.IN_PROGRESS ||
        currentStatus === SystemGenerationStatus.COMPLETED) &&
      hasChanged
    ) {
      prevProjectStatus.current = {
        status: currentStatus,
        message: currentMessage,
        progress: currentProgress,
      };

      const projectLoadingMessage: Message = {
        type: "loading",
        id: "project-generation",
        system_generation_message: currentMessage || "Generating...",
        system_generation_progress:
          currentStatus === SystemGenerationStatus.COMPLETED
            ? 100
            : currentProgress || 0,
        completed: currentStatus === SystemGenerationStatus.COMPLETED,
        isSubsystem: false,
      };

      setMessages((prev) => {
        const existingMsgIndex = prev.findIndex(
          (msg) => msg.type === "loading" && msg.id === "project-generation",
        );
        if (existingMsgIndex >= 0) {
          const newMessages = [...prev];
          newMessages[existingMsgIndex] = projectLoadingMessage;
          return newMessages;
        } else {
          return [...prev, projectLoadingMessage];
        }
      });
    }
  }, [
    pollingData?.system_generation_status,
    pollingData?.system_generation_message,
    pollingData?.system_generation_progress,
    project?.system_generation_status,
    project?.system_generation_message,
    project?.system_generation_progress,
  ]);

  // Add subsystem generation statuses as messages when they change
  useEffect(() => {
    // Process each subsystem status
    Object.values(subsystemGenerationStatuses).forEach((status) => {
      if (!status) return;

      const prevStatus = prevSubsystemStatuses.current[status.id];
      // Check if status is new or has changed
      if (
        !prevStatus ||
        prevStatus.progress !== status.progress ||
        prevStatus.message !== status.message ||
        prevStatus.completed !== status.completed
      ) {
        // Update reference
        prevSubsystemStatuses.current[status.id] = { ...status };

        // Create a loading message
        const subsystemLoadingMessage: Message = {
          type: "loading",
          id: `subsystem-${status.id}`,
          system_generation_message: status.title
            ? `${status.completed ? "✓ " : ""}Generating ${status.title}: ${status.message}`
            : `${status.completed ? "✓ " : ""}Generating subsystem ${status.id}: ${status.message}`,
          system_generation_progress: status.progress,
          completed: status.completed,
          title: status.title,
          isSubsystem: true,
        };

        // Add or update the subsystem message
        setMessages((prev) => {
          // Check if we already have a message for this subsystem
          const existingMsgIndex = prev.findIndex(
            (msg) =>
              msg.type === "loading" && msg.id === `subsystem-${status.id}`,
          );

          if (existingMsgIndex >= 0) {
            // Update existing message
            const newMessages = [...prev];
            newMessages[existingMsgIndex] = subsystemLoadingMessage;
            return newMessages;
          } else {
            // Add new message
            return [...prev, subsystemLoadingMessage];
          }
        });
      }
    });
  }, [subsystemGenerationStatuses]);

  async function sendMessageBlocking(
    query: string,
    assetIds?: number[],
    attachedAssets?: IChatAssetInfo[],
  ) {
    if (!id) return;
    setMessages((prev) => [
      ...prev,
      {
        type: "chat",
        role: "user",
        message: query,
        assets: attachedAssets ?? undefined,
      },
      { type: "chat", role: "assistant", message: "" },
    ]);

    try {
      const response = await sendProjectChatMessage(id, {
        message: query,
        target: EChatTarget.Questions,
        ...(assetIds?.length ? { asset_ids: assetIds } : {}),
      });
      setMessages((prev) => {
        const newMessages = [...prev];
        for (let i = newMessages.length - 1; i >= 0; i--) {
          const message = newMessages[i];
          if (message.type === "chat" && message.role === "assistant") {
            newMessages[i] = {
              type: "chat",
              role: "assistant",
              message: response.message,
            };
            break;
          }
        }
        return newMessages;
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || isGenerating || (!input.trim() && pendingFiles.length === 0))
      return;

    setIsGenerating(true);
    try {
      let assetIds: number[] | undefined;
      let uploadedAssets: IChatAssetInfo[] | undefined;

      if (pendingFiles.length > 0) {
        try {
          const uploaded = await uploadChatFiles(id, pendingFiles);
          assetIds = uploaded.map((u) => u.id);
          uploadedAssets = uploaded;
          setPendingFiles([]);
        } catch (err) {
          console.error("Error uploading chat files:", err);
          return;
        }
      }

      const text = input.trim() || "📎";
      setInput("");
      await sendMessageBlocking(text, assetIds, uploadedAssets ?? undefined);
    } finally {
      setIsGenerating(false);
    }
  };

  // Render messages based on type
  const renderMessage = (message: Message, index: number) => {
    if (message.type === "loading") {
      return (
        <LoadingChatBubble
          key={message.id || `loading-${index}`}
          system_generation_message={message.system_generation_message}
          system_generation_progress={message.system_generation_progress}
          completed={message.completed}
          title={message.title}
          isSubsystem={message.isSubsystem}
        />
      );
    }

    const isLastAssistant =
      message.role === "assistant" &&
      index === messages.length - 1 &&
      isGenerating;
    const assets = message.assets;

    return (
      <ChatBubble
        key={`msg-${index}`}
        variant={message.role === "assistant" ? "received" : "sent"}
      >
        <ChatBubbleAvatar
          fallback={message.role === "assistant" ? "MW" : "AD"}
          src={message.role === "assistant" ? logoImage : undefined}
        />
        <ChatBubbleMessage
          variant={message.role === "assistant" ? "received" : "sent"}
          isLoading={isLastAssistant}
        >
          <div className="flex flex-col gap-2">
            {message.role === "assistant" && (
              <span className="text-black text-[14px] font-bold">
                Magic AI Advisor
              </span>
            )}
            {message.message !== "📎" ? message.message : null}
            {assets && assets.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {assets.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-1 text-xs hover:bg-muted/80"
                      onClick={() =>
                        id && downloadProjectAsset(Number(id), a.id)
                      }
                    >
                      <img
                        src={getFileIcon(a.file_name)}
                        alt=""
                        className="h-4 w-4"
                      />
                      {a.file_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ChatBubbleMessage>
      </ChatBubble>
    );
  };

  return (
    <Tabs
      defaultValue="magicAiAdvisor"
      className="flex flex-col h-full gap-2.5"
    >
      <SidebarContent className="flex-1 overflow-hidden">
        <TabsContent
          value="magicAiAdvisor"
          className="flex flex-col h-full data-[state=active]:flex data-[state=inactive]:hidden"
        >
          <div className="chat flex-1 overflow-auto" ref={messagesRef}>
            <ChatMessageList>
              {/* Render all messages in order */}
              {messages.map(renderMessage)}
            </ChatMessageList>
          </div>

          <div className="mt-auto p-2.5">
            {!isChatReady && (
              <p className="text-muted-foreground text-sm mb-2">
                Chat will be available after the project is created
              </p>
            )}
            <form
              ref={formRef}
              onSubmit={onSubmit}
              className="relative rounded-lg border bg-white focus-within:ring-1 focus-within:ring-ring p-1"
            >
              <ChatInput
                placeholder={
                  isChatReady
                    ? "Message Magic AI Advisor"
                    : "Waiting for project to load..."
                }
                className="min-h-12 text-black resize-none rounded-lg bg-white border-0 p-3 shadow-none focus-visible:ring-0"
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e as React.FormEvent);
                  }
                }}
                disabled={!isChatReady}
              />
              {pendingFiles.length > 0 && (
                <ul className="flex flex-wrap gap-1.5 px-3 pb-1">
                  {pendingFiles.map((file, idx) => (
                    <li
                      key={`${file.name}-${idx}`}
                      className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-1 text-xs"
                    >
                      <img
                        src={getFileIcon(file.name)}
                        alt=""
                        className="h-4 w-4"
                      />
                      <span className="max-w-[120px] truncate">
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full"
                        onClick={() =>
                          setPendingFiles((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center p-3 pt-0">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  disabled={!isChatReady}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="size-6" />
                  <span className="sr-only">Attach file</span>
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,text/plain,.txt,.xlsx,image/*"
                  onChange={(e) => {
                    const input = e.target;
                    const fileList = input?.files;
                    if (!fileList?.length) {
                      if (input) input.value = "";
                      return;
                    }
                    const toAdd = Array.from(fileList).filter(
                      (f) => !f.name.toLowerCase().endsWith(".md"),
                    );
                    if (toAdd.length) {
                      setPendingFiles((prev) => [...prev, ...toAdd]);
                    }
                    if (input) input.value = "";
                  }}
                />
                <Button
                  size="default"
                  className="ml-auto gap-2"
                  type="submit"
                  disabled={
                    !isChatReady ||
                    isGenerating ||
                    (!input.trim() && pendingFiles.length === 0)
                  }
                >
                  Send
                  <SendHorizontal className="size-6" />
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </SidebarContent>
    </Tabs>
  );
}
