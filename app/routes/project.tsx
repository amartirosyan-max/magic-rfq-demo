import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getProjectSubsystem,
  getProjectTree,
  updateSystemAttributes,
  updateSystemStatus,
} from "~/api/systems";
import BlockTitle from "~/components/customComponents/BlockTitle";
import Price from "~/components/customComponents/Price/Price";
import Questions from "~/components/customComponents/Questions";

import Stack from "~/components/stack/Stack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { EQueryKey } from "~/constants/queryKeys";
import { useProject } from "~/context/ProjectContext";
import { useSubsystemGeneration } from "~/context/SubsystemGenerationContext";
import { useEffectiveSubsystemId } from "~/hooks/useEffectiveSubsystemId";
import { useStackData } from "~/hooks/useStackData";
import { SystemGenerationStatus } from "~/types/project";
import {
  EDesignStatus,
  EUserProjectSelection,
  type DellCategories,
} from "~/types/systemResponse";

import StackDell from "~/components/stackDell/StackDell";

import type { AxiosError } from "axios";
import { useLocation, useNavigate, useOutletContext } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useDiagram, type Diagram } from "~/context/DiagramContext";
import { useSubsystemStackData } from "~/hooks/useSubsystemStackData";
import type { ProjectLayoutContext } from "~/layouts/project";
import type { SystemTreeResponse } from "~/types/tree";

export default function Page() {
  const queryClient = useQueryClient();
  const { id, effectiveSubsystemId, systemId } = useEffectiveSubsystemId();
  const { project } = useProject();
  const { startSubsystemGeneration, generatingSubsystemIds } =
    useSubsystemGeneration();

  const { data: treeData } = useQuery<SystemTreeResponse[], AxiosError>({
    queryKey: [EQueryKey.PROJECT_TREE, id],
    queryFn: () => getProjectTree(id as string),
    enabled: !!id,
    retry: false,
  });

  const isRootSystem = systemId === effectiveSubsystemId;
  const location = useLocation();

  const { openRightOptions, openRightChat } =
    useOutletContext<ProjectLayoutContext>();

  const { diagram, setDiagram } = useDiagram();

  // Track subsystems we've attempted to generate to prevent duplicated generation
  const processedSubsystems = useRef<Set<string>>(new Set());

  const {
    data: subsystemData,
    isPending: isLoadingSubsystem,
    isRefetching: isRefetchingSubsystem,
  } = useQuery({
    queryKey: [EQueryKey.PROJECT_SUBSYSTEM, id, effectiveSubsystemId],
    queryFn: () => getProjectSubsystem(String(id), effectiveSubsystemId!),
    enabled: !!id && !!effectiveSubsystemId,
  });

  // Auto-start generation if needed when navigating to a subsystem
  useEffect(() => {
    if (!subsystemData || !id || !effectiveSubsystemId || !project) return;

    const subsystemId = effectiveSubsystemId;

    // Check if we've already processed this subsystem
    if (processedSubsystems.current.has(subsystemId)) {
      return;
    }

    // Check if project generation is complete
    const isProjectComplete =
      project.system_generation_progress === 100 ||
      project.system_generation_status === SystemGenerationStatus.COMPLETED;

    // Check if this subsystem is already being generated
    const isThisSubsystemGenerating =
      generatingSubsystemIds.includes(subsystemId);

    // Check if the subsystem design is already completed or in progress
    const isDesignCompletedOrInProgress =
      subsystemData.design_completed ||
      subsystemData.design_status === EDesignStatus.Completed ||
      subsystemData.design_status === EDesignStatus.InProgress;

    console.log("[Project Route] Check conditions:", {
      isProjectComplete,
      designCompleted: subsystemData.design_completed,
      designStatus: subsystemData.design_status,
      isThisSubsystemGenerating,
      subsystemId,
      alreadyProcessed: processedSubsystems.current.has(subsystemId),
    });

    // Only start generation if all conditions are met
    if (
      isProjectComplete &&
      !isDesignCompletedOrInProgress &&
      !isThisSubsystemGenerating
    ) {
      console.log(
        "[Project Route] Auto-starting generation for subsystem:",
        subsystemId,
      );

      // Mark this subsystem as processed to prevent re-triggering
      processedSubsystems.current.add(subsystemId);

      startSubsystemGeneration(subsystemId, subsystemData.title);
    } else {
      // Still mark as processed if we decided not to generate
      processedSubsystems.current.add(subsystemId);
    }

    // Clean up when unmounting or when effectiveSubsystemId changes
    return () => {
      // No cleanup needed
    };
  }, [
    subsystemData,
    id,
    effectiveSubsystemId,
    project,
    generatingSubsystemIds,
    startSubsystemGeneration,
  ]);

  // Clear the processed subsystem set when navigating to a new subsystem
  useEffect(() => {
    return () => {
      // When this component unmounts or effectiveSubsystemId changes,
      // we reset the processed subsystems set
      if (effectiveSubsystemId) {
        processedSubsystems.current = new Set();
      }
    };
  }, [effectiveSubsystemId]);

  const [activeTab, setActiveTab] = useState(
    () => location.state?.activeTab ?? "questions",
  );

  const stackData = useStackData({ subsystemData });
  const subsystemsStackData = useSubsystemStackData({
    subsystemData,
    categories: ["data", "use_cases"],
  });

  console.log("[Project Route] Stack Data:", stackData);

  // Mutation for updating subsystem attributes (title and/or description)
  const { mutate: updateSubsystemAttributesMutation } = useMutation({
    mutationFn: async ({
      title,
      description,
    }: {
      title: string;
      description: string;
    }) => {
      if (!id || !effectiveSubsystemId || !subsystemData) return;
      return updateSystemAttributes({
        projectId: String(id),
        subsystemId: effectiveSubsystemId,
        title,
        description,
      });
    },
    onMutate: async ({ title, description }) => {
      if (!id || !effectiveSubsystemId) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [EQueryKey.PROJECT_SUBSYSTEM, id, effectiveSubsystemId],
      });

      // Snapshot the previous subsystem data
      const previousSubsystem = queryClient.getQueryData([
        EQueryKey.PROJECT_SUBSYSTEM,
        id,
        effectiveSubsystemId,
      ]);

      // Optimistically update to the new values
      if (previousSubsystem) {
        queryClient.setQueryData(
          [EQueryKey.PROJECT_SUBSYSTEM, id, effectiveSubsystemId],
          {
            ...previousSubsystem,
            title,
            description,
          },
        );
      }

      return { previousSubsystem };
    },
    onError: (err, newValues, context) => {
      // If the mutation fails, revert back to the previous value
      if (context?.previousSubsystem && id && effectiveSubsystemId) {
        queryClient.setQueryData(
          [EQueryKey.PROJECT_SUBSYSTEM, id, effectiveSubsystemId],
          context.previousSubsystem,
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      if (id && effectiveSubsystemId) {
        queryClient.invalidateQueries({
          queryKey: [EQueryKey.PROJECT_SUBSYSTEM, id, effectiveSubsystemId],
        });
        queryClient.invalidateQueries({
          queryKey: [EQueryKey.PROJECT_TREE, id],
        });
      }
    },
  });

  const updateSystemStatusMutation = useMutation({
    mutationFn: ({
      status,
      systemId,
    }: {
      status: EUserProjectSelection | null;
      systemId?: string;
    }) =>
      updateSystemStatus(String(id), systemId || effectiveSubsystemId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_SUBSYSTEM, id, effectiveSubsystemId],
      });
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_PRICE_DATA, id],
      });
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_TREE, id],
      });
    },
  });

  useEffect(() => {
    if (activeTab === "design") openRightOptions();

    return () => openRightChat();
  }, [activeTab]);

  if (isLoadingSubsystem || !subsystemData) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pb-2.5 relative">
      <div className="bg-white rounded-md w-full h-full px-6 pb-5 flex flex-col gap-6">
        <Tabs
          defaultValue="questions"
          className="w-full h-full gap-2.5"
          onValueChange={setActiveTab}
          value={activeTab}
        >
          <div className="w-full bg-white sticky top-0 z-10 py-2.5 flex justify-between">
            <TabsList className="bg-white">
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger
                value="design"
                className="border-l-1 border-r-1 border-l-primary border-r-primary"
              >
                Design
              </TabsTrigger>
              <TabsTrigger value="price">Price</TabsTrigger>
            </TabsList>
            {activeTab === "design" && (
              <div>
                <Select
                  value={diagram}
                  onValueChange={(value: string) =>
                    setDiagram(value as Diagram)
                  }
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="nvidia" className="cursor-pointer">
                      NVIDIA
                    </SelectItem>
                    <SelectItem value="dell" className="cursor-pointer">
                      Dell
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <TabsContent value="questions">
            <div className="flex flex-col gap-6">
              <BlockTitle
                onUpdateStatus={(
                  status: EUserProjectSelection | null,
                  systemId: string,
                ) => updateSystemStatusMutation.mutate({ status, systemId })}
                onUpdateAttributes={(title: string, description: string) =>
                  updateSubsystemAttributesMutation({ title, description })
                }
                subsystem={subsystemData}
              />
              {subsystemData?.questionnaire.length > 0 && (
                <>
                  <Questions
                    questionnaire={subsystemData?.questionnaire}
                    onViewDesign={() => setActiveTab("design")}
                    onViewPrice={() => setActiveTab("price")}
                  />
                </>
              )}
            </div>
          </TabsContent>
          <TabsContent value="design">
            <div className="flex flex-col gap-6">
              <BlockTitle
                onUpdateStatus={(
                  status: EUserProjectSelection | null,
                  systemId: string,
                ) => updateSystemStatusMutation.mutate({ status, systemId })}
                onUpdateAttributes={(title: string, description: string) =>
                  updateSubsystemAttributesMutation({ title, description })
                }
                subsystem={subsystemData}
              />

              <div className="pb-6" id="stack-container">
                {diagram === "dell" ? (
                  <StackDell
                    stackData={stackData}
                    subsystemsStackData={subsystemsStackData}
                    isLoading={isRefetchingSubsystem}
                    isProposal={false}
                    isRootSystem={isRootSystem}
                  />
                ) : (
                  <Stack
                    key={subsystemData.id}
                    stackData={stackData}
                    isLoading={isRefetchingSubsystem}
                  />
                )}
              </div>

              {/* // TODO: Duplicate options */}
              {/* {diagram === "nvidia" && <Options isSidebar={false} />} */}
            </div>
          </TabsContent>
          <TabsContent value="price">
            <div className="flex flex-col gap-6">
              <BlockTitle
                onUpdateStatus={(
                  status: EUserProjectSelection | null,
                  systemId: string,
                ) => updateSystemStatusMutation.mutate({ status, systemId })}
                onUpdateAttributes={(title: string, description: string) =>
                  updateSubsystemAttributesMutation({ title, description })
                }
                subsystem={subsystemData}
              />
              <Price />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
