import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Download, Loader2, Pencil, Plus, RefreshCw, X } from "lucide-react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { useLocation, useNavigate, useParams } from "react-router";
import { getTopProducts, type TopProductItem } from "~/api/billing";
import {
  createFeedback,
  deleteFeedback,
  getProjectFeedback,
  type IFeedbackResponse,
  updateFeedback,
} from "~/api/feedback";
import {
  deleteProjectAsset,
  downloadProjectAsset,
  getProject,
  rebuildProject,
  updateProject,
  uploadProjectAssets,
} from "~/api/projects";
import {
  getProjectSubsystem,
  getProjectSubsystemByHrId,
  getProjectTree,
  useGenerateSystemTree,
} from "~/api/systems";
import FileDoc from "~/assets/filesIcons/file-doc.svg";
import FilePdf from "~/assets/filesIcons/file-pdf.svg";
import { AnimatedMarkdown } from "~/components/customComponents/AnimatedMarkdown";
import Completion from "~/components/customComponents/Completion";
import Price from "~/components/customComponents/Price/Price";
import Questions from "~/components/customComponents/Questions";
import UseCases from "~/components/customComponents/UseCases";
import type { StackGeneratingInfo } from "~/components/stack/constants";
import Stack from "~/components/stack/Stack";
import StackDell from "~/components/stackDell/StackDell";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { QualityStatusIcon } from "~/components/ui/quality-status-icon";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { EQueryKey } from "~/constants/queryKeys";
import { useDiagram } from "~/context/DiagramContext";
import { usePolling } from "~/context/PollingContext";
import { useStackData } from "~/hooks/useStackData";
import { useSubsystemStackData } from "~/hooks/useSubsystemStackData";
import {
  CreatingStatus,
  type ProjectFile,
  type ProjectFullResponse,
  SystemGenerationStatus,
} from "~/types/project";
import {
  EUserProjectSelection,
  type SubsystemInnerAResponse,
} from "~/types/systemResponse";
import type { SystemTreeResponse } from "~/types/tree";
import { handleDownloadProposal } from "~/utils/downloadProposal";

const markdownComponents: Components = {
  h3: ({ node, ...props }) => (
    <h3 className="text-xl font-bold text-black mt-6 mb-3" {...props} />
  ),
  h4: ({ node, ...props }) => (
    <h4 className="text-lg font-bold text-black mt-5 mb-2" {...props} />
  ),
  ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-4" {...props} />,
  ol: ({ node, ...props }) => (
    <ol className="list-decimal pl-6 my-4" {...props} />
  ),
  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
  p: ({ node, ...props }) => <p className="mb-4" {...props} />,
};

function SuggestionCommentForm({
  initialComment,
  onSave,
  onCancel,
  placeholder = "Add a comment...",
  hideLabel,
}: {
  initialComment: string;
  onSave: (comment: string | null) => void | Promise<void>;
  onCancel: () => void;
  placeholder?: string;
  hideLabel?: boolean;
}) {
  const [draft, setDraft] = useState(initialComment);
  return (
    <div className="flex flex-col gap-3">
      {!hideLabel && <label className="text-sm font-medium">Comment</label>}
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="resize-none"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => onSave(draft.trim() || null)}
          disabled={!draft.trim()}
        >
          Save comment
        </Button>
      </div>
    </div>
  );
}

type ProjectHeaderProps = {
  project: ProjectFullResponse;
  isEditingName: boolean;
  isEditingDescription: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  descriptionRef: React.RefObject<HTMLTextAreaElement | null>;
  handleNameBlurOrEnter: () => void;
  handleDescriptionBlurOrEnter: () => void;
  handleEditName: () => void;
  handleEditDescription: () => void;
  setIsEditingName: (value: boolean) => void;
  setIsEditingDescription: (value: boolean) => void;
  adjustTextareaHeight: (element: HTMLTextAreaElement) => void;
};

function ProjectHeader({
  project,
  isEditingName,
  isEditingDescription,
  inputRef,
  descriptionRef,
  handleNameBlurOrEnter,
  handleDescriptionBlurOrEnter,
  handleEditName,
  handleEditDescription,
  setIsEditingName,
  setIsEditingDescription,
  adjustTextareaHeight,
}: ProjectHeaderProps) {
  return (
    <>
      <div className="flex flex-col gap-2.5">
        {isEditingName ? (
          <textarea
            id="project-name-input"
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className="text-3xl font-bold font-[Roboto_Serif] text-[#3a3540] bg-white border-b border-gray-300 focus:outline-none focus:border-primary resize-none overflow-hidden"
            defaultValue={project?.name || ""}
            onBlur={handleNameBlurOrEnter}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleNameBlurOrEnter();
              }
              if (e.key === "Escape") setIsEditingName(false);
            }}
            onInput={(e) =>
              adjustTextareaHeight(e.target as HTMLTextAreaElement)
            }
            rows={1}
          />
        ) : (
          <div className="relative flex items-center group gap-2.5">
            <h1 className="text-3xl font-bold font-[Roboto_Serif] text-[#3a3540]">
              {project?.name}
            </h1>
            {project?.creating_status !== CreatingStatus.IN_PROGRESS && (
              <button
                className="p-2 rounded hover:bg-gray-200 transition cursor-pointer"
                style={{ top: 0 }}
                onClick={handleEditName}
                tabIndex={-1}
              >
                <Pencil className="w-5 h-5 text-gray-500 opacity-50" />
              </button>
            )}
          </div>
        )}
      </div>
      {isEditingDescription ? (
        <textarea
          id="project-description-input"
          ref={descriptionRef as React.RefObject<HTMLTextAreaElement>}
          className="text-base leading-[150%] bg-white border-b border-gray-300 focus:outline-none focus:border-primary resize-none overflow-hidden"
          defaultValue={project?.description || ""}
          onBlur={handleDescriptionBlurOrEnter}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleDescriptionBlurOrEnter();
            }
            if (e.key === "Escape") setIsEditingDescription(false);
          }}
          onInput={(e) => adjustTextareaHeight(e.target as HTMLTextAreaElement)}
          rows={1}
        />
      ) : (
        <div className="relative flex items-start group gap-2.5">
          <p className="text-base leading-[150%]">{project.description}</p>
          {project?.creating_status !== CreatingStatus.IN_PROGRESS && (
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
      <Separator className="mx-2.5" />
    </>
  );
}

export default function ProjectRootPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("questions");
  const { id } = useParams();
  const { enablePolling } = usePolling();
  const navigate = useNavigate();
  const location = useLocation();
  const generationTriggeredRef = useRef<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<ProjectFile[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isUseCasesGenerating, setIsUseCasesGenerating] = useState(false);
  const [rebuildProposalModalOpen, setRebuildProposalModalOpen] =
    useState(false);
  // const [hiddenIcons, setHiddenIcons] = useState<boolean>(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const { diagram } = useDiagram();

  const { data: project } = useQuery({
    queryKey: [EQueryKey.PROJECT_DATA, id],
    queryFn: () => getProject(String(id)),
    enabled: !!id,
  });

  const projectId = project?.id ? String(project.id) : "";

  useEffect(() => {
    setIsUseCasesGenerating(false);
  }, [projectId]);

  const isProposalUnlocked =
    project?.system_generation_status === SystemGenerationStatus.COMPLETED ||
    isUseCasesGenerating;

  useEffect(() => {
    if (project?.files && project.files.length > 0) {
      setUploadedFiles(project.files);
    }
  }, [project?.files]);

  // Helper function to get icon based on file type
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return FilePdf;
      case "doc":
      case "docx":
        return FileDoc;
      default:
        return FileDoc; // Default icon
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    if (tab && ["home", "questions", "use_cases", "proposal"].includes(tab)) {
      setActiveTab(tab);
    } else {
      // Default to questions if no valid tab is in URL
      setActiveTab("questions");
    }
  }, [location.search]);

  // Scroll to proposal section when ?section=N is in URL
  const sectionParam = React.useMemo(
    () => new URLSearchParams(location.search).get("section"),
    [location.search],
  );

  useEffect(() => {
    if (activeTab !== "proposal" || sectionParam == null) return;
    const sectionIndex = parseInt(sectionParam, 10);
    if (Number.isNaN(sectionIndex) || sectionIndex < 0) return;

    const scrollToSection = () => {
      const el = document.getElementById(`proposal-section-${sectionIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      }
      return false;
    };

    const delays = [100, 350, 600, 1000];
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const delay of delays) {
      const t = setTimeout(() => {
        if (scrollToSection()) {
          timers.forEach(clearTimeout);
        }
      }, delay);
      timers.push(t);
    }
    return () => timers.forEach(clearTimeout);
  }, [activeTab, sectionParam, project?.proposal?.length, location.key]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    if (value === "proposal") {
      navigate(`/projects/${id}?tab=proposal`, { replace: true });
    } else if (value === "use_cases") {
      navigate(`/projects/${id}?tab=use_cases`, { replace: true });
    } else {
      navigate(`/projects/${id}`, { replace: true });
    }
  };

  const { mutate: generateSystemTree } = useGenerateSystemTree({
    onSuccess: () => {
      console.log("System tree generation completed successfully");
      if (project?.id) {
        enablePolling(String(project.id));
      }
    },
  });

  const { data: treeData } = useQuery<SystemTreeResponse[], AxiosError>({
    queryKey: [EQueryKey.PROJECT_TREE, id],
    queryFn: () => getProjectTree(id as string),
    enabled: !!id,
    retry: false,
  });

  const { data: subsystemData, isRefetching: isRefetchingSubsystem } = useQuery(
    {
      queryKey: [EQueryKey.PROJECT_SUBSYSTEM, id, treeData?.[0]?.id || null],
      queryFn: () => getProjectSubsystem(String(id), String(treeData?.[0].id)),
      enabled: treeData && treeData.length > 0 && !!id,
    },
  );

  const { data: useCasesData } = useQuery({
    queryKey: [
      EQueryKey.PROJECT_SUBSYSTEM_BY_HR_ID,
      id,
      "enterprise_apps_and_usecases",
    ],
    queryFn: () =>
      getProjectSubsystemByHrId(String(id), "enterprise_apps_and_usecases"),
    enabled:
      treeData && treeData.length > 0 && !!id && activeTab === "proposal",
  });

  const { data: topProductsData } = useQuery({
    queryKey: [EQueryKey.TOP_PRODUCTS, projectId, 5],
    queryFn: () => getTopProducts(projectId, 5),
    enabled: !!projectId && activeTab === "proposal",
  });

  const { data: proposalFeedback = [] } = useQuery<IFeedbackResponse[]>({
    queryKey: [EQueryKey.PROJECT_PROPOSAL_FEEDBACK, projectId],
    queryFn: () => getProjectFeedback(projectId),
    enabled:
      !!projectId && activeTab === "proposal" && !!project?.proposal?.length,
  });

  const feedbackBySection = React.useMemo(() => {
    const map = new Map<number, IFeedbackResponse>();
    const list = Array.isArray(proposalFeedback) ? proposalFeedback : [];
    list.forEach((f) => map.set(f.section_index, f));
    return map;
  }, [proposalFeedback]);

  const proposalSectionCount = project?.proposal?.length ?? 0;
  const feedbackList = Array.isArray(proposalFeedback) ? proposalFeedback : [];
  const canDownloadProposal = Boolean(
    proposalSectionCount > 0 &&
      feedbackList.length === proposalSectionCount &&
      feedbackList.every((f) => {
        if (!f.feedback_status) return false;
        if (f.feedback_status === "good") return true;
        return Boolean(f.comment?.trim());
      }),
  );

  const proposalCheckedCount =
    project?.proposal?.reduce(
      (acc, _, index) =>
        Boolean(feedbackBySection.get(index)?.feedback_status) ? acc + 1 : acc,
      0,
    ) ?? 0;
  const proposalUncheckedCount = proposalSectionCount - proposalCheckedCount;

  const feedbackQueryKey = [EQueryKey.PROJECT_PROPOSAL_FEEDBACK, projectId];

  const { mutateAsync: createFeedbackMutation } = useMutation({
    mutationFn: (data: {
      sectionIndex: number;
      sectionTitle: string;
      feedbackStatus: "good" | "suggestion";
      comment?: string | null;
    }) =>
      createFeedback(projectId, {
        section_index: data.sectionIndex,
        section_title: data.sectionTitle,
        feedback_status: data.feedbackStatus,
        comment: data.comment ?? null,
      }),
    onSuccess: (newFeedback) => {
      queryClient.setQueryData<IFeedbackResponse[]>(
        feedbackQueryKey,
        (prev) => {
          const list = Array.isArray(prev) ? prev : [];
          return [...list, newFeedback];
        },
      );
    },
  });

  const { mutateAsync: updateFeedbackMutation } = useMutation({
    mutationFn: (data: {
      feedbackId: number;
      feedbackStatus?: "good" | "suggestion";
      comment?: string | null;
    }) =>
      updateFeedback(projectId, data.feedbackId, {
        ...(data.feedbackStatus !== undefined && {
          feedback_status: data.feedbackStatus,
        }),
        ...(data.comment !== undefined && { comment: data.comment }),
      }),
    onSuccess: (updatedFeedback) => {
      queryClient.setQueryData<IFeedbackResponse[]>(
        feedbackQueryKey,
        (prev) => {
          const list = Array.isArray(prev) ? prev : [];
          return list.map((f) =>
            f.id === updatedFeedback.id ? updatedFeedback : f,
          );
        },
      );
    },
  });

  const { mutateAsync: deleteFeedbackMutation } = useMutation({
    mutationFn: (feedbackId: number) => deleteFeedback(projectId, feedbackId),
    onSuccess: (_, feedbackId) => {
      queryClient.setQueryData<IFeedbackResponse[]>(
        feedbackQueryKey,
        (prev) => {
          const list = Array.isArray(prev) ? prev : [];
          return list.filter((f) => f.id !== feedbackId);
        },
      );
    },
  });

  const [suggestionPopover, setSuggestionPopover] = useState<{
    sectionIndex: number;
    feedbackId: number | null;
    sectionTitle: string;
    openedFromGood?: boolean;
  } | null>(null);

  const [checklistSuggestionOpen, setChecklistSuggestionOpen] = useState<{
    sectionIndex: number;
    feedbackId: number | null;
    sectionTitle: string;
    openedFromGood?: boolean;
  } | null>(null);

  const stackData = useStackData({
    subsystemData,
    treeDataSystemId: treeData ? String(treeData?.[0]?.id) : undefined,
  });

  const subsystemsStackData = useSubsystemStackData({
    subsystemData,
    categories: ["data", "use_cases"],
  });

  useEffect(() => {
    // Generate system tree if not already generated when proposal tab is active
    if (activeTab === "proposal" && project?.id) {
      const projectId = String(project.id);

      // Only trigger generation if it's in INIT state and we haven't triggered it yet for this project
      if (
        project.system_generation_status === SystemGenerationStatus.INIT &&
        generationTriggeredRef.current !== projectId
      ) {
        generationTriggeredRef.current = projectId; // Mark as triggered for this project
        generateSystemTree({ projectId });
      } else if (
        project.system_generation_status ===
          SystemGenerationStatus.IN_PROGRESS ||
        project.system_generation_status === SystemGenerationStatus.COMPLETED
      ) {
        enablePolling(projectId); // Enable polling when tab is proposal
      }
    }
  }, [activeTab, project, generateSystemTree, enablePolling]);

  const { isPending: isDownloadProposalPending, mutate: downloadProposal } =
    useMutation({
      mutationFn: () =>
        handleDownloadProposal(
          String(project?.id),
          project?.client_name || null,
          diagram,
        ),
    });

  const { isPending: isRebuildPending, mutate: rebuildProposal } = useMutation({
    mutationFn: () => rebuildProject(String(project?.id)),
    onSuccess: (data) => {
      navigate(`/projects/${data.project_id}?tab=proposal`, { replace: true });
    },
  });

  const { mutate: updateProjectMutation } = useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name?: string;
      description?: string;
    }) => {
      if (!project) return;
      return updateProject(String(project.id), {
        name: name !== undefined ? name : project.name,
        client_name: project.client_name,
        description:
          description !== undefined ? description : project.description,
        industry: project.industry,
        budget_estimation: project.budget_estimation,
        timeline: project.timeline,
        submission_deadline: project.submission_deadline,
      });
    },
    onMutate: async ({ name, description }) => {
      await queryClient.cancelQueries({
        queryKey: [EQueryKey.PROJECT_DATA, String(project?.id)],
      });
      const previousProject = queryClient.getQueryData([
        EQueryKey.PROJECT_DATA,
        String(project?.id),
      ]);
      if (project) {
        queryClient.setQueryData([EQueryKey.PROJECT_DATA, String(project.id)], {
          ...project,
          ...(name !== undefined ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
        });
      }
      setIsEditingName(false);
      setIsEditingDescription(false);
      return { previousProject };
    },
    onError: (err, newData, context) => {
      if (context?.previousProject && project) {
        queryClient.setQueryData(
          [EQueryKey.PROJECT_DATA, String(project.id)],
          context.previousProject,
        );
      }
    },
    onSettled: () => {
      if (project) {
        queryClient.invalidateQueries({
          queryKey: [EQueryKey.PROJECT_DATA, String(project.id)],
        });
      }
    },
  });

  const handleEditName = () => {
    setIsEditingName(true);
    // Wait for the textarea to render before adjusting height
    setTimeout(() => {
      if (inputRef.current) {
        adjustTextareaHeight(inputRef.current);
      }
    }, 0);
  };

  const handleEditDescription = () => {
    setIsEditingDescription(true);
    // Wait for the textarea to render before adjusting height
    setTimeout(() => {
      if (descriptionRef.current) {
        adjustTextareaHeight(descriptionRef.current);
      }
    }, 0);
  };

  const handleNameBlurOrEnter = () => {
    if (!project || !inputRef.current) {
      setIsEditingName(false);
      return;
    }
    const newName = inputRef.current.value.trim();
    if (!newName || newName === project.name) {
      setIsEditingName(false);
      return;
    }
    updateProjectMutation({ name: newName });
  };

  const handleDescriptionBlurOrEnter = () => {
    if (!project || !descriptionRef.current) {
      setIsEditingDescription(false);
      return;
    }
    const newDescription = descriptionRef.current.value.trim();
    if (newDescription === project.description) {
      setIsEditingDescription(false);
      return;
    }
    updateProjectMutation({ description: newDescription });
  };

  // Function to adjust textarea height based on content
  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
    element.focus();
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const hasProposal = project.proposal && project.proposal.length > 0;

  const handleFileUpload = async (file: File) => {
    if (!project?.id) return;

    try {
      await uploadProjectAssets(String(project.id), file);
      setUploadedFiles((prev) => [...prev, file] as ProjectFile[]);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  // Add this new handler for multiple files
  const handleMultipleFilesUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(
        (file) => !file?.name?.toLowerCase().endsWith(".md"),
      );
      newFiles.forEach((file) => {
        handleFileUpload(file);
      });
    }
    queryClient.invalidateQueries({
      queryKey: [EQueryKey.PROJECT_DATA, project?.id],
    });
  };

  const handleFileDelete = async (fileId: number) => {
    if (!project?.id) return;

    try {
      await deleteProjectAsset(project.id, fileId);
      setUploadedFiles((prev) =>
        prev.filter((file) => (file as ProjectFile).id !== fileId),
      );
    } catch (error) {
      console.error("Error deleting file:", error);
    }
    queryClient.invalidateQueries({
      queryKey: [EQueryKey.PROJECT_DATA, project?.id],
    });
  };

  const stackGenerationInfo: StackGeneratingInfo = {
    design_completed: subsystemData?.design_completed!,
    design_status: subsystemData?.design_status!,
    design_message: subsystemData?.design_message!,
    design_progress: subsystemData?.design_progress!,
  };

  return (
    <div className="flex flex-1 flex-col gap-4 pb-2.5">
      <div className="bg-white rounded-md w-full h-full px-6 pb-5 flex flex-col gap-6">
        <Tabs
          defaultValue="questions"
          className="w-full h-full gap-2.5"
          onValueChange={handleTabChange}
          value={activeTab}
        >
          <div className="w-full bg-white sticky top-0 z-10 py-2.5 flex justify-between">
            <TabsList className="bg-white ">
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger
                value="use_cases"
                className="border-l-1 border-r-1 border-l-primary border-r-primary"
                disabled={project.creating_status !== CreatingStatus.COMPLETED}
              >
                Use cases
              </TabsTrigger>
              <TabsTrigger
                value="proposal"
                disabled={
                  project.creating_status !== CreatingStatus.COMPLETED ||
                  !isProposalUnlocked
                }
              >
                Proposal
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="questions">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2.5">
                <ProjectHeader
                  project={project}
                  isEditingName={isEditingName}
                  isEditingDescription={isEditingDescription}
                  inputRef={inputRef}
                  descriptionRef={descriptionRef}
                  handleNameBlurOrEnter={handleNameBlurOrEnter}
                  handleDescriptionBlurOrEnter={handleDescriptionBlurOrEnter}
                  handleEditName={handleEditName}
                  handleEditDescription={handleEditDescription}
                  setIsEditingName={setIsEditingName}
                  setIsEditingDescription={setIsEditingDescription}
                  adjustTextareaHeight={adjustTextareaHeight}
                />
                <p className="text-base font-bold leading-[150%]">
                  Project files
                </p>
                <div className="flex flex-col gap-2.5">
                  {uploadedFiles.filter(
                    (file) => !file?.name?.toLowerCase().endsWith(".md"),
                  ).length > 0 && (
                    <ul className="space-y-2 mt-3">
                      {uploadedFiles
                        .filter(
                          (file) => !file?.name?.toLowerCase().endsWith(".md"),
                        )
                        .map((file, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between text-sm p-2 bg-gray-50 w-fit gap-2.5 cursor-pointer"
                            onClick={() => {
                              if (file && "id" in file) {
                                downloadProjectAsset(
                                  project.id,
                                  (file as ProjectFile).id,
                                );
                              }
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={getFileIcon(file.name)}
                                alt="File Icon"
                                className="h-5 w-5"
                              />
                              <span className="text-black">{file.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileDelete((file as ProjectFile).id);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                    </ul>
                  )}
                  <Button
                    variant="ghost"
                    className="bg-[#EEF3F9] rounded-none justify-start px-5 py-3 relative w-fit text-primary"
                  >
                    <Plus /> Upload more files
                    <Input
                      type="file"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      accept=".doc, .docx, .pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/pdf"
                      onChange={handleMultipleFilesUpload}
                    />
                  </Button>
                </div>
              </div>
              {project?.questionnaire_sections.length > 0 && (
                <div className="flex flex-col gap-6">
                  <Completion
                    percentage={project.questionnaire_completion ?? 0}
                    onViewDesign={() => setActiveTab("proposal")}
                  />
                  <Completion
                    title="Proposal Confidence"
                    percentage={project.proposal_confidence ?? 0}
                    progressColor="#EF6800"
                    tooltipContent={
                      <>
                        <div className="mb-1 font-semibold">
                          Proposal Confidence
                        </div>
                        <p className="mb-2">
                          Reflects how much uncertainty remains about the
                          project – the more questions answered, the more
                          accurate the proposal.
                        </p>
                        <div className="mb-2 font-mono text-xs">
                          Scoring Criteria:
                        </div>
                        <ul className="mb-2 list-disc pl-4 space-y-1">
                          <li>
                            <span className="font-medium">Coverage</span> – how
                            many project questions have been answered
                          </li>
                          <li>
                            <span className="font-medium">Quality</span> –
                            completeness and depth of each answer
                          </li>
                          <li>
                            <span className="font-medium">Source</span> – how
                            the answer was obtained: extracted from RFP,
                            manually written, or generated with Magic Wand
                          </li>
                        </ul>
                        <div className="text-xs">
                          Higher confidence = more reliable hardware sizing,
                          services, and proposal components
                        </div>
                      </>
                    }
                  />
                  <Questions
                    questionnaire={project?.questionnaire_sections.sort(
                      (a, b) => {
                        const order = {
                          "Main contract information": 1,
                          "Problem to be solved": 2,
                          "Decision-makers": 3,
                        };
                        return (
                          ((order as Record<string, number>)[a.name] || 100) -
                          ((order as Record<string, number>)[b.name] || 100)
                        );
                      },
                    )}
                    onViewProposal={() => handleTabChange("proposal")}
                    isProposalUnlocked={isProposalUnlocked}
                    projectCreatingStatus={project?.creating_status}
                  />
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="use_cases">
            <div className="flex flex-col gap-2.5">
              <ProjectHeader
                project={project}
                isEditingName={isEditingName}
                isEditingDescription={isEditingDescription}
                inputRef={inputRef}
                descriptionRef={descriptionRef}
                handleNameBlurOrEnter={handleNameBlurOrEnter}
                handleDescriptionBlurOrEnter={handleDescriptionBlurOrEnter}
                handleEditName={handleEditName}
                handleEditDescription={handleEditDescription}
                setIsEditingName={setIsEditingName}
                setIsEditingDescription={setIsEditingDescription}
                adjustTextareaHeight={adjustTextareaHeight}
              />
              <UseCases
                isActive={activeTab === "use_cases"}
                onGenerationStateChange={setIsUseCasesGenerating}
              />
            </div>
          </TabsContent>
          <TabsContent value="proposal">
            {hasProposal ? (
              <div className="flex flex-col">
                <div className="flex flex-col gap-8 py-8 px-8">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-center font-[Roboto_Serif] text-[#3a3540]">
                      {project.name}
                    </h1>
                  </div>

                  <div className="proposal-content overflow-y-auto">
                    {diagram === "dell" && (
                      <div className="pb-12">
                        <StackDell
                          key={treeData ? treeData[0]?.id : "no-tree"}
                          subsystemsStackData={subsystemsStackData}
                          stackData={stackData}
                          isLoading={isRefetchingSubsystem}
                          isProposal={!stackGenerationInfo.design_completed}
                          stackGeneratingInfo={stackGenerationInfo}
                        />
                      </div>
                    )}
                    {/* section_index в feedback API = index секции в project.proposal */}
                    {project.proposal.map((section, index) => (
                      <AnimatedMarkdown
                        key={index}
                        index={index}
                        delay={300}
                        systemGenerationStatus={
                          project.system_generation_status
                        }
                        diagram={diagram}
                      >
                        <div
                          className="chapter mb-8"
                          id={`proposal-section-${index}`}
                          style={{ scrollMarginTop: 70 }}
                        >
                          <div className="flex flex-row items-center justify-between gap-4 mb-4">
                            <h2 className="text-xl font-semibold text-black">
                              {section.section}
                            </h2>
                            <div className="flex shrink-0 items-center gap-2">
                              {(() => {
                                const feedback = feedbackBySection.get(index);
                                const activeStatus =
                                  feedback?.feedback_status ?? null;
                                const handleGood = () => {
                                  if (activeStatus === "good") {
                                    deleteFeedbackMutation(feedback!.id);
                                    return;
                                  }
                                  if (feedback) {
                                    updateFeedbackMutation({
                                      feedbackId: feedback.id,
                                      feedbackStatus: "good",
                                      comment: "",
                                    });
                                  } else {
                                    createFeedbackMutation({
                                      sectionIndex: index,
                                      sectionTitle: section.section,
                                      feedbackStatus: "good",
                                      comment: "",
                                    });
                                  }
                                };
                                const handleSuggestion = () => {
                                  if (activeStatus === "suggestion") {
                                    deleteFeedbackMutation(feedback!.id);
                                    return;
                                  }
                                  setSuggestionPopover({
                                    sectionIndex: index,
                                    feedbackId:
                                      feedback?.feedback_status === "suggestion"
                                        ? feedback.id
                                        : (feedback?.id ?? null),
                                    sectionTitle: section.section,
                                    openedFromGood:
                                      feedback?.feedback_status === "good",
                                  });
                                };
                                return (
                                  <>
                                    <button
                                      type="button"
                                      className="cursor-pointer p-0 border-0 bg-transparent"
                                      onClick={handleGood}
                                      aria-label="good"
                                    >
                                      <QualityStatusIcon
                                        status="good"
                                        active={activeStatus === "good"}
                                      />
                                    </button>
                                    <Popover
                                      open={
                                        suggestionPopover?.sectionIndex ===
                                        index
                                      }
                                      onOpenChange={(open) => {
                                        if (!open) {
                                          if (
                                            suggestionPopover?.openedFromGood &&
                                            suggestionPopover.feedbackId != null
                                          ) {
                                            deleteFeedbackMutation(
                                              suggestionPopover.feedbackId,
                                            );
                                          }
                                          setSuggestionPopover(null);
                                        }
                                      }}
                                    >
                                      <PopoverTrigger asChild>
                                        <button
                                          type="button"
                                          className="cursor-pointer p-0 border-0 bg-transparent"
                                          onClick={handleSuggestion}
                                          aria-label="suggestion"
                                        >
                                          <QualityStatusIcon
                                            status="suggestion"
                                            active={
                                              activeStatus === "suggestion"
                                            }
                                          />
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        side="top"
                                        align="end"
                                        className="w-80"
                                      >
                                        <SuggestionCommentForm
                                          key={
                                            suggestionPopover?.sectionIndex ===
                                            index
                                              ? (suggestionPopover?.feedbackId ??
                                                `new-${index}`)
                                              : "closed"
                                          }
                                          initialComment={
                                            suggestionPopover?.sectionIndex ===
                                            index
                                              ? (feedbackBySection.get(index)
                                                  ?.comment ?? "")
                                              : ""
                                          }
                                          onSave={async (comment) => {
                                            if (
                                              suggestionPopover?.sectionIndex !==
                                                index ||
                                              !comment?.trim()
                                            )
                                              return;
                                            const {
                                              feedbackId,
                                              sectionIndex,
                                              sectionTitle,
                                            } = suggestionPopover;
                                            if (feedbackId != null) {
                                              await updateFeedbackMutation({
                                                feedbackId,
                                                feedbackStatus: "suggestion",
                                                comment: comment.trim(),
                                              });
                                            } else {
                                              await createFeedbackMutation({
                                                sectionIndex,
                                                sectionTitle,
                                                feedbackStatus: "suggestion",
                                                comment: comment.trim(),
                                              });
                                            }
                                            setSuggestionPopover(null);
                                          }}
                                          onCancel={() => {
                                            if (
                                              suggestionPopover?.openedFromGood &&
                                              suggestionPopover.feedbackId !=
                                                null
                                            ) {
                                              deleteFeedbackMutation(
                                                suggestionPopover.feedbackId,
                                              );
                                            }
                                            setSuggestionPopover(null);
                                          }}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="max-w-none">
                            <ReactMarkdown components={markdownComponents}>
                              {section.introduction}
                            </ReactMarkdown>

                            {section.placeholder === "#root" &&
                              (diagram === "nvidia" ? (
                                <div className="pb-12" id="stack-container">
                                  <Stack
                                    key={treeData ? treeData[0]?.id : "no-tree"}
                                    stackData={stackData}
                                    isLoading={isRefetchingSubsystem}
                                  />
                                </div>
                              ) : (
                                <div className="pb-12" id="stack-container">
                                  <StackDell
                                    key={treeData ? treeData[0]?.id : "no-tree"}
                                    subsystemsStackData={subsystemsStackData}
                                    stackData={stackData}
                                    isLoading={isRefetchingSubsystem}
                                    isProposal={
                                      !stackGenerationInfo.design_completed
                                    }
                                    stackGeneratingInfo={stackGenerationInfo}
                                  />
                                </div>
                              ))}

                            {index === 4 &&
                              (topProductsData?.length ?? 0) > 0 && (
                                <div className="w-full overflow-x-auto pb-8">
                                  <table className="w-full border-collapse bg-white border border-gray-200">
                                    <thead>
                                      <tr className="border-b border-gray-200">
                                        <th className="text-center py-2 px-5 max-[1600px]:px-2.5 text-[12px] leading-[18px] font-semibold text-[#717680] whitespace-nowrap">
                                          Image
                                        </th>
                                        <th className="text-left py-2 px-5 max-[1600px]:px-2.5 text-[12px] leading-[18px] font-semibold text-[#717680] whitespace-nowrap">
                                          Name
                                        </th>
                                        <th className="text-left py-2 px-5 max-[1600px]:px-2.5 text-[12px] leading-[18px] font-semibold text-[#717680] whitespace-nowrap">
                                          Description
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {[...(topProductsData ?? [])]
                                        .sort((a, b) => a.order - b.order)
                                        .map((sub) => (
                                          <React.Fragment key={sub.id}>
                                            <tr>
                                              <td
                                                colSpan={4}
                                                className="py-2 px-5 max-[1600px]:px-2.5 text-white font-bold"
                                                style={{
                                                  backgroundColor: "#3744A6",
                                                  fontSize: "16px",
                                                  fontWeight: 700,
                                                }}
                                              >
                                                {sub.title}
                                              </td>
                                            </tr>
                                            {sub.top_products.map(
                                              (product: TopProductItem) => (
                                                <tr
                                                  key={`${sub.id}-${product.id}`}
                                                  className="border-b border-gray-200"
                                                >
                                                  <td className="p-5 max-[1600px]:p-2.5 border-b border-gray-200 align-middle text-center">
                                                    {product.image_url ? (
                                                      <img
                                                        src={product.image_url}
                                                        alt=""
                                                        className="w-12 h-12 object-contain mx-auto"
                                                      />
                                                    ) : (
                                                      <span className="text-gray-400 text-xs">
                                                        —
                                                      </span>
                                                    )}
                                                  </td>
                                                  <td className="p-5 max-[1600px]:p-2.5 border-b border-gray-200 align-middle break-words font-semibold">
                                                    {product.name ?? "—"}
                                                  </td>
                                                  <td className="p-5 max-[1600px]:p-2.5 border-b border-gray-200 align-middle break-words text-gray-600 text-sm">
                                                    {product.description ?? "—"}
                                                  </td>
                                                </tr>
                                              ),
                                            )}
                                          </React.Fragment>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                            {index === 5 && treeData && treeData.length > 0 && (
                              <Price
                                subsystemId={
                                  treeData && treeData.length > 0
                                    ? String(treeData[0].id)
                                    : undefined
                                }
                              />
                            )}

                            {section.placeholder ===
                              "#enterprise_apps_and_usecases" &&
                              useCasesData &&
                              useCasesData.length > 0 && (
                                <ol className="list-decimal list-outside pl-8 space-y-4">
                                  {useCasesData[0].subsystems
                                    .filter(
                                      (subsystem: SubsystemInnerAResponse) =>
                                        subsystem.status ===
                                          EUserProjectSelection.Chosen ||
                                        (subsystem.status === null &&
                                          subsystem.recommended),
                                    )
                                    .map(
                                      (subsystem: SubsystemInnerAResponse) => (
                                        <li key={subsystem.id} className="pl-2">
                                          <div className="flex-col flex gap-1 justify-start">
                                            <p className="font-bold">
                                              {subsystem.title}
                                            </p>
                                            <p>
                                              {subsystem.long_description
                                                ? subsystem.long_description
                                                    .split("\\n")
                                                    .map((line, i) => (
                                                      <span key={i}>
                                                        {line}
                                                        <br />
                                                      </span>
                                                    ))
                                                : subsystem.description}
                                            </p>
                                          </div>
                                        </li>
                                      ),
                                    )}
                                </ol>
                              )}

                            {section.conclusion && (
                              <div className="max-w-none mt-4">
                                <ReactMarkdown components={markdownComponents}>
                                  {section.conclusion}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                        </div>
                      </AnimatedMarkdown>
                    ))}
                  </div>

                  {/* Review Checklist */}
                  <div
                    className="flex flex-col gap-4 py-8 px-8"
                    style={{ backgroundColor: "#DCE7F8" }}
                  >
                    <h2
                      className="text-center font-bold"
                      style={{
                        color: "#181D27",
                        fontWeight: 700,
                        fontSize: 24,
                        lineHeight: "140%",
                      }}
                    >
                      Are you ready to send to the client?
                    </h2>
                    <p
                      className="text-center"
                      style={{
                        color: "#535862",
                        fontWeight: 400,
                        fontSize: 16,
                        lineHeight: "24px",
                      }}
                    >
                      Mark each section as Done or leave a comment to enable
                      download.
                    </p>
                    <div
                      className="flex flex-col rounded-lg px-6 py-4"
                      style={{ backgroundColor: "#fff" }}
                    >
                      <div className="flex justify-between items-center">
                        <span
                          style={{
                            color: "#717680",
                            fontSize: 12,
                            lineHeight: "16px",
                            fontWeight: 600,
                          }}
                        >
                          Review Checklist
                        </span>
                        <span
                          style={{
                            color: "#717680",
                            fontSize: 12,
                            lineHeight: "16px",
                            fontWeight: 600,
                          }}
                        >
                          Checked: {proposalCheckedCount}/{proposalSectionCount}
                        </span>
                      </div>
                      <Separator
                        className="my-3"
                        style={{ backgroundColor: "#E9EAEB" }}
                      />
                      <div className="flex flex-col gap-4">
                        {project.proposal.map((section, index) => {
                          const feedback = feedbackBySection.get(index);
                          const activeStatus =
                            feedback?.feedback_status ?? null;
                          const handleGood = () => {
                            if (activeStatus === "good") {
                              deleteFeedbackMutation(feedback!.id);
                              return;
                            }
                            if (feedback) {
                              updateFeedbackMutation({
                                feedbackId: feedback.id,
                                feedbackStatus: "good",
                                comment: "",
                              });
                            } else {
                              createFeedbackMutation({
                                sectionIndex: index,
                                sectionTitle: section.section,
                                feedbackStatus: "good",
                                comment: "",
                              });
                            }
                          };
                          const handleSuggestion = () => {
                            if (activeStatus === "suggestion") {
                              deleteFeedbackMutation(feedback!.id);
                              return;
                            }
                            setChecklistSuggestionOpen({
                              sectionIndex: index,
                              feedbackId:
                                feedback?.feedback_status === "suggestion"
                                  ? feedback.id
                                  : (feedback?.id ?? null),
                              sectionTitle: section.section,
                              openedFromGood:
                                feedback?.feedback_status === "good",
                            });
                          };
                          const isSuggestionFormOpen =
                            checklistSuggestionOpen?.sectionIndex === index;
                          const comment = feedback?.comment ?? "";
                          return (
                            <div
                              key={index}
                              className="flex justify-between items-start gap-4"
                            >
                              <div className="flex flex-col gap-2 min-w-0 flex-1">
                                <span className="font-bold text-black">
                                  {section.section}
                                </span>
                                {activeStatus === "suggestion" &&
                                  comment &&
                                  !isSuggestionFormOpen && (
                                    <div
                                      role="button"
                                      tabIndex={0}
                                      className="text-sm cursor-pointer w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
                                      style={{ color: "#717680" }}
                                      onClick={() =>
                                        setChecklistSuggestionOpen({
                                          sectionIndex: index,
                                          feedbackId: feedback!.id,
                                          sectionTitle: section.section,
                                        })
                                      }
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "Enter" ||
                                          e.key === " "
                                        ) {
                                          e.preventDefault();
                                          setChecklistSuggestionOpen({
                                            sectionIndex: index,
                                            feedbackId: feedback!.id,
                                            sectionTitle: section.section,
                                          });
                                        }
                                      }}
                                    >
                                      {comment}
                                    </div>
                                  )}
                                {isSuggestionFormOpen && (
                                  <div
                                    className="pt-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <SuggestionCommentForm
                                      key={`checklist-${index}-${checklistSuggestionOpen?.feedbackId ?? `new-${index}`}`}
                                      initialComment={
                                        feedbackBySection.get(index)?.comment ??
                                        ""
                                      }
                                      placeholder="Suggested fix or note…"
                                      hideLabel
                                      onSave={async (newComment) => {
                                        if (
                                          checklistSuggestionOpen?.sectionIndex !==
                                            index ||
                                          !newComment?.trim()
                                        )
                                          return;
                                        const {
                                          feedbackId,
                                          sectionIndex,
                                          sectionTitle,
                                        } = checklistSuggestionOpen;
                                        if (feedbackId != null) {
                                          await updateFeedbackMutation({
                                            feedbackId,
                                            feedbackStatus: "suggestion",
                                            comment: newComment.trim(),
                                          });
                                        } else {
                                          await createFeedbackMutation({
                                            sectionIndex,
                                            sectionTitle,
                                            feedbackStatus: "suggestion",
                                            comment: newComment.trim(),
                                          });
                                        }
                                        setChecklistSuggestionOpen(null);
                                      }}
                                      onCancel={() => {
                                        if (
                                          checklistSuggestionOpen?.openedFromGood &&
                                          checklistSuggestionOpen.feedbackId !=
                                            null
                                        ) {
                                          deleteFeedbackMutation(
                                            checklistSuggestionOpen.feedbackId,
                                          );
                                        }
                                        setChecklistSuggestionOpen(null);
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <button
                                  type="button"
                                  className="cursor-pointer p-0 border-0 bg-transparent"
                                  onClick={handleGood}
                                  aria-label="good"
                                >
                                  <QualityStatusIcon
                                    status="good"
                                    active={activeStatus === "good"}
                                  />
                                </button>
                                <button
                                  type="button"
                                  className="cursor-pointer p-0 border-0 bg-transparent"
                                  onClick={handleSuggestion}
                                  aria-label="suggestion"
                                >
                                  <QualityStatusIcon
                                    status="suggestion"
                                    active={activeStatus === "suggestion"}
                                  />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          className="bg-[#EEF3F9] rounded-none px-5 py-3 text-primary h-10 w-[180px] justify-center"
                          onClick={() => downloadProposal()}
                          disabled={
                            !canDownloadProposal ||
                            project.creating_status !==
                              CreatingStatus.COMPLETED ||
                            project.system_generation_status !==
                              SystemGenerationStatus.COMPLETED ||
                            isDownloadProposalPending ||
                            isRefetchingSubsystem
                          }
                        >
                          {isDownloadProposalPending ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <>
                              <Download /> Download proposal
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          className="bg-[#EEF3F9] rounded-none px-5 py-3 text-primary h-10 w-[180px] justify-center"
                          onClick={() => setRebuildProposalModalOpen(true)}
                          disabled={
                            !canDownloadProposal ||
                            project.creating_status !==
                              CreatingStatus.COMPLETED ||
                            project.system_generation_status !==
                              SystemGenerationStatus.COMPLETED ||
                            isRebuildPending ||
                            isRefetchingSubsystem
                          }
                        >
                          {isRebuildPending ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <>
                              <RefreshCw /> Refresh Proposal
                            </>
                          )}
                        </Button>
                      </div>
                      <Dialog
                        open={rebuildProposalModalOpen}
                        onOpenChange={setRebuildProposalModalOpen}
                      >
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Rebuild proposal</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to rebuild the proposal?
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setRebuildProposalModalOpen(false)}
                              disabled={isRebuildPending}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              variant="default"
                              onClick={() => {
                                setRebuildProposalModalOpen(false);
                                rebuildProposal();
                              }}
                              disabled={isRebuildPending}
                            >
                              {isRebuildPending ? (
                                <Loader2 className="animate-spin size-4" />
                              ) : (
                                "Refresh Proposal"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <p className="text-center text-sm text-[#3a3540]">
                        Complete the checklist to download. Unchecked:{" "}
                        {proposalUncheckedCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin mb-4" />
                <p>Generating proposal...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
