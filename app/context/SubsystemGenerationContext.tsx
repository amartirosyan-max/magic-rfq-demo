import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import {
  getProjectSubsystemShort,
  useGenerateSubsystemTree,
} from "~/api/systems";
import { EDesignStatus } from "~/types/systemResponse";
import { EQueryKey } from "~/constants/queryKeys";

// Define a type for subsystem generation status
export interface SubsystemGenerationStatus {
  id: string;
  progress: number;
  message: string;
  status: EDesignStatus;
  title?: string;
  completed?: boolean; // Add completed flag
}

type SubsystemGenerationContextType = {
  isGeneratingSubsystem: boolean;
  generatingSubsystemIds: string[];
  subsystemGenerationStatuses: Record<string, SubsystemGenerationStatus>;
  startSubsystemGeneration: (subsystemId: string, title?: string) => void;
  stopSubsystemGeneration: (subsystemId: string) => void;
  clearCompletedGenerations: () => void; // Add new function to clear completed generations
};

const SubsystemGenerationContext =
  createContext<SubsystemGenerationContextType>({
    isGeneratingSubsystem: false,
    generatingSubsystemIds: [],
    subsystemGenerationStatuses: {},
    startSubsystemGeneration: () => {},
    stopSubsystemGeneration: () => {},
    clearCompletedGenerations: () => {},
  });

export const useSubsystemGeneration = () =>
  useContext(SubsystemGenerationContext);

export const SubsystemGenerationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [generatingSubsystemIds, setGeneratingSubsystemIds] = useState<
    string[]
  >([]);
  const [subsystemGenerationStatuses, setSubsystemGenerationStatuses] =
    useState<Record<string, SubsystemGenerationStatus>>({});

  // Add a ref to track if the provider is initialized
  const isInitialized = useRef(false);

  const { id: projectId } = useParams();
  const queryClient = useQueryClient();

  // Set initialized flag
  useEffect(() => {
    console.log("[SubsystemGeneration] Provider initialized");
    isInitialized.current = true;
    return () => {
      console.log("[SubsystemGeneration] Provider cleanup");
      isInitialized.current = false;
    };
  }, []);

  // Mutation for starting subsystem generation
  const { mutate: generateSubsystem } = useGenerateSubsystemTree({
    onSuccess: (
      _: void,
      {
        subsystemId,
      }: {
        subsystemId: string;
      },
    ) => {
      console.log(
        `[SubsystemGeneration] Generation started for subsystem ${subsystemId}`,
      );
    },
    onError: (
      error: Error,
      {
        subsystemId,
      }: {
        subsystemId: string;
      },
    ) => {
      console.error(
        `[SubsystemGeneration] Failed to start generation for ${subsystemId}:`,
        error,
      );
      stopSubsystemGeneration(subsystemId);
    },
  });

  // Check if we need to stop polling for any subsystems
  useEffect(() => {
    const checkCompletedSubsystems = async () => {
      if (!projectId) return;

      // Check each subsystem in parallel
      const promises = generatingSubsystemIds.map(async (subsystemId) => {
        try {
          const data = await getProjectSubsystemShort(
            String(projectId),
            subsystemId,
          );

          // Update status for this subsystem
          setSubsystemGenerationStatuses((prev) => ({
            ...prev,
            [subsystemId]: {
              id: subsystemId,
              progress: data.design_progress,
              message: data.design_message,
              status: data.design_status,
              title: prev[subsystemId]?.title,
              completed: data.design_status === EDesignStatus.Completed,
            },
          }));

          // If completed or failed, stop polling but keep the status in the UI
          if (
            data.design_status === EDesignStatus.Completed ||
            data.design_status === EDesignStatus.Failed
          ) {
            console.log(
              `[SubsystemGeneration] Generation finished for ${subsystemId} with status: ${data.design_status}`,
            );

            // Store final message for the completed generation
            setSubsystemGenerationStatuses((prev) => ({
              ...prev,
              [subsystemId]: {
                ...prev[subsystemId],
                completed: true,
                message:
                  data.design_status === EDesignStatus.Completed
                    ? `Generation completed successfully.`
                    : `Generation failed: ${data.design_message || "Unknown error"}`,
                progress:
                  data.design_status === EDesignStatus.Completed
                    ? 100
                    : prev[subsystemId].progress,
              },
            }));

            // Invalidate queries for this subsystem
            queryClient.invalidateQueries({
              queryKey: [EQueryKey.PROJECT_SUBSYSTEM, projectId, subsystemId],
            });
            queryClient.invalidateQueries({
              queryKey: [EQueryKey.PROJECT_TREE, projectId],
            });

            // Remove from generating list but keep in statuses
            return { id: subsystemId, shouldRemove: true };
          }

          return { id: subsystemId, shouldRemove: false };
        } catch (error) {
          console.error(
            `[SubsystemGeneration] Error polling subsystem ${subsystemId}:`,
            error,
          );

          // Store error message
          setSubsystemGenerationStatuses((prev) => ({
            ...prev,
            [subsystemId]: {
              ...prev[subsystemId],
              completed: true,
              message: `Error: ${
                error instanceof Error
                  ? error.message
                  : "Failed to fetch generation status"
              }`,
            },
          }));

          return { id: subsystemId, shouldRemove: true };
        }
      });

      // Process results
      const results = await Promise.all(promises);
      const idsToRemove = results
        .filter((r) => r.shouldRemove)
        .map((r) => r.id);

      if (idsToRemove.length > 0) {
        setGeneratingSubsystemIds((prev) =>
          prev.filter((id) => !idsToRemove.includes(id)),
        );
      }
    };

    // Set up polling
    const pollingInterval =
      generatingSubsystemIds.length > 0
        ? setInterval(checkCompletedSubsystems, 2000)
        : null;

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [projectId, generatingSubsystemIds, queryClient]);

  // Stop polling for a specific subsystem and remove from UI
  const stopSubsystemGeneration = useCallback((subsystemId: string) => {
    setGeneratingSubsystemIds((prev) =>
      prev.filter((id) => id !== subsystemId),
    );

    // Now we only remove from generating list, not from statuses
    // Keep the status in UI
  }, []);

  // Add a function to clear completed generations (e.g., on navigation)
  const clearCompletedGenerations = useCallback(() => {
    setSubsystemGenerationStatuses((prev) => {
      const newStatuses = { ...prev };
      // Only keep actively generating subsystems
      Object.keys(newStatuses).forEach((id) => {
        if (newStatuses[id].completed) {
          delete newStatuses[id];
        }
      });
      return newStatuses;
    });
  }, []);

  // Start subsystem generation and polling
  const startSubsystemGeneration = useCallback(
    (subsystemId: string, title?: string) => {
      // Debug logging first to ensure it gets executed
      console.log(
        `[SubsystemGeneration] Request to start generation for subsystem: ${subsystemId}, provider initialized: ${isInitialized.current}`,
      );

      if (!projectId) {
        console.error("[SubsystemGeneration] No projectId available");
        return;
      }

      // Don't start if already generating this subsystem
      if (generatingSubsystemIds.includes(subsystemId)) {
        console.log(
          `[SubsystemGeneration] Already generating subsystem ${subsystemId}`,
        );
        return;
      }

      console.log(
        `[SubsystemGeneration] Starting generation for subsystem: ${subsystemId}, project: ${projectId}`,
      );

      // Add to generating list first to prevent race conditions
      setGeneratingSubsystemIds((prev) => {
        console.log(
          `[SubsystemGeneration] Current generating list:`,
          prev,
          `Adding: ${subsystemId}`,
        );
        return [...prev, subsystemId];
      });

      // Initialize status
      setSubsystemGenerationStatuses((prev) => ({
        ...prev,
        [subsystemId]: {
          id: subsystemId,
          progress: 0,
          message: "Starting subsystem generation...",
          status: EDesignStatus.InProgress,
          title: title,
        },
      }));

      // Generate the subsystem tree - do this immediately to fix timing issues
      try {
        console.log(`[SubsystemGeneration] Calling API for ${subsystemId}`);
        generateSubsystem({ projectId, subsystemId });
      } catch (error) {
        console.error(`[SubsystemGeneration] Error calling API:`, error);
      }
    },
    [projectId, generateSubsystem, generatingSubsystemIds],
  );

  return (
    <SubsystemGenerationContext.Provider
      value={{
        isGeneratingSubsystem: generatingSubsystemIds.length > 0,
        generatingSubsystemIds,
        subsystemGenerationStatuses,
        startSubsystemGeneration,
        stopSubsystemGeneration,
        clearCompletedGenerations,
      }}
    >
      {children}
    </SubsystemGenerationContext.Provider>
  );
};
