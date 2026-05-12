import { useMutation, useQuery } from "@tanstack/react-query";
import api from "~/api/axios";
import { EQueryKey } from "~/constants/queryKeys";
import type {
  EUserProjectSelection,
  SubsystemResponse,
  SubsystemShortResponse,
} from "~/types/systemResponse";
import { EDesignStatus } from "~/types/systemResponse";
import type { SystemTreeResponse } from "~/types/tree";

// Generate tree of system with subsystem for project
export const generateSystemTree = async (projectId: string): Promise<void> => {
  const response = await api.post<void>(`/projects/${projectId}/systems`);

  return response.data;
};

export const useGenerateSystemTree = (options = {}) => {
  return useMutation({
    mutationFn: ({ projectId }: { projectId: string }) =>
      generateSystemTree(projectId),
    ...options,
  });
};

// Get project subsystem
export const getProjectSubsystem = async (
  projectId: string,
  subsystemId: string,
): Promise<SubsystemResponse> => {
  if (!subsystemId || subsystemId === "undefined") {
    throw new Error("Subsystem ID is required");
  }
  const response = await api.get<SubsystemResponse>(
    `/projects/${projectId}/systems/${subsystemId}`,
  );

  console.log("response", response.data);

  return response.data;
};

// Set system status by user
export const updateSystemStatus = async (
  projectId: string,
  subsystemId: string,
  status: EUserProjectSelection | null,
): Promise<void> => {
  const response = await api.put<void>(
    `/projects/${projectId}/systems/${subsystemId}`,
    { status },
  );

  return response.data;
};

// Generate subsystem tree of selected system
export const generateSubsystemTree = async (
  projectId: string,
  subsystemId: string,
): Promise<void> => {
  if (!subsystemId || subsystemId === "undefined") {
    throw new Error("Subsystem ID is required");
  }
  const response = await api.post<void>(
    `/projects/${projectId}/systems/${subsystemId}`,
  );

  return response.data;
};

export const useGenerateSubsystemTree = (options = {}) => {
  return useMutation({
    mutationFn: ({
      projectId,
      subsystemId,
    }: {
      projectId: string;
      subsystemId: string;
    }) => generateSubsystemTree(projectId, subsystemId),
    ...options,
  });
};

// Get system which are currently generating
export const getProjectSystemGenerations = async (
  projectId: string,
): Promise<SubsystemShortResponse[]> => {
  const response = await api.get<SubsystemShortResponse[]>(
    `/projects/${projectId}/systems/generations`,
  );

  return response.data;
};

// Get project tree
export const getProjectTree = async (
  projectId: string,
): Promise<SystemTreeResponse[]> => {
  const response = await api.get<SystemTreeResponse[]>(
    `/projects/${projectId}/tree`,
  );

  return response.data;
};

// Get project subsystem by human-readable ID
export const getProjectSubsystemByHrId = async (
  projectId: string,
  catalogSystemHrUid: string,
): Promise<SubsystemResponse[]> => {
  if (!catalogSystemHrUid || catalogSystemHrUid === "undefined") {
    throw new Error("Catalog system HR UID is required");
  }
  const response = await api.get<SubsystemResponse[]>(
    `/projects/${projectId}/systems/hr/${catalogSystemHrUid}`,
  );

  return response.data;
};

// Get project subsystem with base attributes only
export const getProjectSubsystemShort = async (
  projectId: string,
  subsystemId: string,
): Promise<SubsystemShortResponse> => {
  if (!subsystemId || subsystemId === "undefined") {
    throw new Error("Subsystem ID is required");
  }
  const response = await api.get<SubsystemShortResponse>(
    `/projects/${projectId}/systems/short/${subsystemId}`,
  );

  return response.data;
};

// Update system attributes
export const updateSystemAttributes = async ({
  projectId,
  subsystemId,
  title,
  description,
}: {
  projectId: string;
  subsystemId: string;
  title: string;
  description: string;
}): Promise<void> => {
  if (!subsystemId || subsystemId === "undefined") {
    throw new Error("Subsystem ID is required");
  }
  const response = await api.put<void>(
    `/projects/${projectId}/systems/${subsystemId}/info`,
    { title, description },
  );

  return response.data;
};

// Set product status by user
export const updateProductStatus = async (
  projectId: string,
  productId: string,
  status: EUserProjectSelection | null,
): Promise<void> => {
  const response = await api.put<void>(
    `/projects/${projectId}/products/${productId}`,
    { status },
  );

  return response.data;
};

// Set product family status by user
export const updateProductFamilyStatus = async (
  projectId: string,
  productFamilyId: string,
  status: EUserProjectSelection | null,
): Promise<void> => {
  const response = await api.put<void>(
    `/projects/${projectId}/product_families/${productFamilyId}`,
    { status },
  );

  return response.data;
};

// Polling for subsystem generation status
export const useSubsystemPolling = ({
  projectId,
  subsystemId,
  enabled = true,
}: {
  projectId: string;
  subsystemId: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: [EQueryKey.PROJECT_SUBSYSTEM_SHORT, projectId, subsystemId],
    queryFn: () => getProjectSubsystemShort(projectId, subsystemId),
    refetchInterval: (query) => {
      const data = query.state.data as SubsystemShortResponse | undefined;
      return data &&
        (data.design_status === EDesignStatus.InProgress ||
          data.design_status === EDesignStatus.Init)
        ? 1000
        : false;
    },
    refetchOnWindowFocus: false, // Disable refetch on window focus
    enabled:
      enabled &&
      !!projectId &&
      !!subsystemId &&
      projectId !== "" &&
      subsystemId !== "",
  });
};
