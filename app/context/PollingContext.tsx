import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useProjectPolling } from "~/api/projects";
import { type ProjectResponse, SystemGenerationStatus } from "~/types/project";
import { useQueryClient } from "@tanstack/react-query";
import { EQueryKey } from "~/constants/queryKeys";
import { useParams } from "react-router";
import { useProject } from "~/context/ProjectContext";

type PollingContextType = {
  isPollingEnabled: boolean;
  enablePolling: (projectId: string) => void;
  disablePolling: () => void;
  pollingData: ProjectResponse | undefined;
};

const PollingContext = createContext<PollingContextType>({
  isPollingEnabled: false,
  enablePolling: () => {},
  disablePolling: () => {},
  pollingData: undefined,
});

export const usePolling = () => useContext(PollingContext);

export const PollingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isPollingEnabled, setIsPollingEnabled] = useState(false);
  const queryClient = useQueryClient();
  const { id } = useParams();
  const { project } = useProject();

  // Store the previous progress to detect changes
  const previousProgressRef = useRef<number | undefined>(undefined);

  // Use the polling hook but manage the enabled state ourselves
  const { data: pollingData } = useProjectPolling({
    projectId: id || "",
    enabled: isPollingEnabled && !!id,
  });

  // Auto-start polling if system generation is in progress when app loads
  useEffect(() => {
    if (project && !isPollingEnabled) {
      if (
        project.system_generation_status ===
          SystemGenerationStatus.IN_PROGRESS ||
        project.system_generation_status === SystemGenerationStatus.INIT
      ) {
        console.log(
          `[PollingContext] Found project in progress on load, auto-enabling polling for project ${project.id}`,
        );
        enablePolling();
      }
    }
  }, [project]);

  // Effect to handle data updates when progress changes
  useEffect(() => {
    if (!pollingData) return;

    const currentProgress = pollingData.system_generation_progress;
    const previousProgress = previousProgressRef.current;

    // If progress has changed, update all relevant data
    if (
      previousProgress !== undefined &&
      currentProgress !== previousProgress
    ) {
      console.log(
        `[PollingContext] Progress changed from ${previousProgress} to ${currentProgress}, invalidating queries`,
      );

      // Invalidate tree data
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_TREE, id],
      });

      // Invalidate price data
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_PRICE_DATA, id],
      });

      // Invalidate use cases data
      queryClient.invalidateQueries({
        queryKey: [
          EQueryKey.PROJECT_SUBSYSTEM_BY_HR_ID,
          id,
          "enterprise_apps_and_usecases",
        ],
      });

      // Invalidate any subsystem data
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_SUBSYSTEM],
      });

      // Invalidate subsystem billing
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.SUBSYSTEM_BILLING],
      });
    }

    // Also refresh on failed status
    if (
      pollingData.system_generation_status === SystemGenerationStatus.FAILED
    ) {
      console.log(
        "[PollingContext] System generation failed, invalidating queries",
      );
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_TREE, id],
      });
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_SUBSYSTEM],
      });
    }

    // Update the ref for next comparison
    previousProgressRef.current = currentProgress;
  }, [
    pollingData?.system_generation_progress,
    pollingData?.system_generation_status,
    queryClient,
    id,
  ]);

  const enablePolling = () => {
    setIsPollingEnabled(true);
  };

  const disablePolling = () => {
    setIsPollingEnabled(false);
  };

  return (
    <PollingContext.Provider
      value={{
        isPollingEnabled,
        enablePolling,
        disablePolling,
        pollingData,
      }}
    >
      {children}
    </PollingContext.Provider>
  );
};
