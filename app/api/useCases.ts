import { type Query, useMutation, useQuery } from "@tanstack/react-query";
import { saveAs } from "file-saver";
import api from "~/api/axios";
import { EQueryKey } from "~/constants/queryKeys";
import type {
  EUserProjectSelection,
  SubsystemResponse,
} from "~/types/systemResponse";

export type UseCaseStatus = EUserProjectSelection | null;

export const getUseCases = async (
  projectId: string,
): Promise<SubsystemResponse> => {
  const response = await api.get<SubsystemResponse>(
    `/projects/${projectId}/usecases`,
  );
  return response.data;
};

export const generateUseCases = async (
  projectId: string,
): Promise<SubsystemResponse> => {
  const response = await api.post<SubsystemResponse>(
    `/projects/${projectId}/usecases/generate`,
  );
  return response.data;
};

export const extendUseCases = async (
  projectId: string,
): Promise<SubsystemResponse> => {
  const response = await api.post<SubsystemResponse>(
    `/projects/${projectId}/usecases/extend`,
  );
  return response.data;
};

export const updateUseCaseStatus = async (
  projectId: string,
  useCaseId: string,
  status: UseCaseStatus,
): Promise<void> => {
  if (!useCaseId || useCaseId === "undefined") {
    throw new Error("Use case ID is required");
  }
  const response = await api.put<void>(
    `/projects/${projectId}/usecases/${useCaseId}/status`,
    { status },
  );
  return response.data;
};

const getFilenameFromDisposition = (
  contentDisposition: string | undefined,
  fallback: string,
) => {
  if (!contentDisposition) return fallback;
  const filenameMatch = contentDisposition.match(/filename="(.+)"/);
  return filenameMatch?.[1] ?? fallback;
};

export const exportUseCases = async (projectId: string): Promise<void> => {
  if (!projectId || projectId === "undefined") {
    throw new Error("Project ID is required");
  }

  const response = await api.get(`/projects/${projectId}/export/usecases`, {
    responseType: "blob",
  });

  if (!response || !response.data) {
    throw new Error("Failed to export use cases");
  }

  const filename = getFilenameFromDisposition(
    response.headers["content-disposition"],
    `use_cases_${projectId}`,
  );

  saveAs(response.data, filename);
};

export const useUseCases = ({
  projectId,
  enabled = true,
  refetchInterval,
}: {
  projectId: string;
  enabled?: boolean;
  refetchInterval?:
    | number
    | false
    | ((
        query: Query<SubsystemResponse, Error, SubsystemResponse, string[]>,
      ) => number | false | undefined);
}) => {
  return useQuery({
    queryKey: [EQueryKey.USE_CASES, projectId],
    queryFn: () => getUseCases(projectId),
    refetchOnWindowFocus: false,
    enabled: enabled && !!projectId && projectId !== "",
    refetchInterval,
  });
};

export const useGenerateUseCases = (options = {}) => {
  return useMutation({
    mutationFn: ({ projectId }: { projectId: string }) =>
      generateUseCases(projectId),
    ...options,
  });
};

export const useExtendUseCases = (options = {}) => {
  return useMutation({
    mutationFn: ({ projectId }: { projectId: string }) =>
      extendUseCases(projectId),
    ...options,
  });
};

export const useUpdateUseCaseStatus = (options = {}) => {
  return useMutation({
    mutationFn: ({
      projectId,
      useCaseId,
      status,
    }: {
      projectId: string;
      useCaseId: string;
      status: UseCaseStatus;
    }) => updateUseCaseStatus(projectId, useCaseId, status),
    ...options,
  });
};
