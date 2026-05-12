import api from "~/api/axios";
import {
  type ProjectResponse,
  type RebuildProjectResponse,
  SystemGenerationStatus,
  type ProjectUpdate,
  type ProjectFullResponse,
} from "~/types/project";
import { useQuery } from "@tanstack/react-query";
import { EQueryKey } from "~/constants/queryKeys";
import { saveAs } from "file-saver";

export const getProjects = async (): Promise<ProjectResponse[]> => {
  const response = await api.get<ProjectResponse[]>("/projects");
  return response.data;
};

export const getProject = async (id: string): Promise<ProjectFullResponse> => {
  const response = await api.get<ProjectFullResponse>(`/projects/${id}`);
  return response.data;
};

export const createNewProject = async (
  rfp: string,
  files: File[],
): Promise<ProjectFullResponse> => {
  const formData = new FormData();
  formData.append("rfp", rfp);
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await api.post<ProjectFullResponse>("/projects", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// Polling getProject until system_generation_progress is 100
export const useProjectPolling = ({
  projectId,
  enabled = true,
}: {
  projectId: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: [EQueryKey.PROJECT_DATA, projectId],
    queryFn: () => getProject(projectId),
    refetchInterval: (query) => {
      const data = query.state.data as ProjectFullResponse | undefined;
      return data &&
        (data.system_generation_status === SystemGenerationStatus.IN_PROGRESS ||
          data.system_generation_status === SystemGenerationStatus.INIT)
        ? 1000
        : false;
    },
    refetchOnWindowFocus: false, // Disable refetch on window focus
    enabled: enabled && !!projectId && projectId !== "", // Only enable if we have a projectId and enabled is true
  });
};

export const uploadProjectAssets = async (
  projectId: string,
  file: File,
): Promise<void> => {
  if (!projectId || projectId === "undefined") {
    throw new Error("Project ID is required");
  }

  const formData = new FormData();
  formData.append("files", file);

  const response = await api.post<void>(
    `/projects/${projectId}/assets`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export const deleteProjectAsset = async (
  projectId: number,
  assetId: number,
): Promise<void> => {
  if (!projectId) {
    throw new Error("Project ID is required");
  }
  if (!assetId) {
    throw new Error("Asset ID is required");
  }

  const response = await api.delete<void>(
    `/projects/${projectId}/assets/${assetId}`,
  );

  return response.data;
};

export const downloadProjectAsset = async (
  projectId: number,
  assetId: number,
): Promise<void> => {
  if (!projectId) throw new Error("Project ID is required");
  if (!assetId) throw new Error("Asset ID is required");

  const response = await api.get(`/projects/${projectId}/assets/${assetId}`, {
    responseType: "blob",
  });

  if (!response || !response.data) throw new Error("Failed to download asset");

  // Get filename from Content-Disposition or create default one
  let filename = `project_${projectId}_asset_${assetId}`;
  const contentDisposition = response.headers["content-disposition"];
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  saveAs(response.data, filename);
};

export const updateProject = async (
  projectId: string,
  projectUpdate: ProjectUpdate,
): Promise<ProjectResponse> => {
  if (!projectId || projectId === "undefined") {
    throw new Error("Project ID is required");
  }

  const response = await api.put<ProjectResponse>(
    `/projects/${projectId}`,
    projectUpdate,
  );
  return response.data;
};

/** DELETE /projects/{project_id} — soft delete, 204 No Content */
export const deleteProject = async (projectId: string): Promise<void> => {
  await api.delete(`/projects/${projectId}`);
};

/**
 * POST /projects/{project_id}/rebuild — перегенерация: создаёт новый проект на основе текущего.
 * Feedback по proposal учитывается при перегенерации. Редирект на новый project_id и поллинг.
 * 422 если system_generation_status !== "completed".
 */
export const rebuildProject = async (
  projectId: string,
): Promise<RebuildProjectResponse> => {
  if (!projectId || projectId === "undefined") {
    throw new Error("Project ID is required");
  }
  const response = await api.post<RebuildProjectResponse>(
    `/projects/${projectId}/rebuild`,
  );
  return response.data;
};
