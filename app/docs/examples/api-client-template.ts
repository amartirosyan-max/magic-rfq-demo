// @ts-nocheck — this file is a documentation template, not a real API module.
//                See app/docs/14-implementation-playbook.md (Recipe B).

/**
 * Template: a new API module under `app/api/<area>.ts`.
 *
 * Conventions:
 *   - Always import the singleton from `~/api/axios`. Never call `axios.create()` here.
 *   - Mirror the backend response shape in a TypeScript interface (or in `app/types/`).
 *   - Throw early on missing required ids.
 *   - For polling, expose a `useXxxPolling()` hook colocated below the function.
 *   - For binary downloads use `responseType: "blob"` and `file-saver`'s `saveAs(...)`.
 *
 * Steps to use:
 *   1. Copy this file as `app/api/<area>.ts`.
 *   2. Replace `Xyz`, `xyz`, etc. with your actual area name.
 *   3. Add a query key entry to `EQueryKey` in `app/constants/queryKeys.ts`.
 *   4. Consume the function with `useQuery({ queryKey: [...], queryFn: ... })` from a component.
 *   5. On mutations, invalidate every dependent `EQueryKey` in `onSuccess`.
 */

import { type Query, useMutation, useQuery } from "@tanstack/react-query";
import { saveAs } from "file-saver";
import api from "~/api/axios";
import { EQueryKey } from "~/constants/queryKeys";

// ---- Types ---------------------------------------------------------------

export interface IXyzResponse {
  id: number;
  name: string;
  status: "init" | "in_progress" | "completed" | "failed";
  progress: number;
  message: string;
}

export interface IXyzCreateRequest {
  name: string;
}

export interface IXyzUpdateRequest {
  name?: string;
}

// ---- Reads ---------------------------------------------------------------

export const getXyzList = async (projectId: string): Promise<IXyzResponse[]> => {
  if (!projectId || projectId === "undefined") {
    throw new Error("Project ID is required");
  }
  const response = await api.get<IXyzResponse[]>(`/projects/${projectId}/xyz`);
  return response.data;
};

export const getXyz = async (
  projectId: string,
  xyzId: string,
): Promise<IXyzResponse> => {
  if (!projectId || projectId === "undefined") {
    throw new Error("Project ID is required");
  }
  if (!xyzId || xyzId === "undefined") {
    throw new Error("Xyz ID is required");
  }
  const response = await api.get<IXyzResponse>(
    `/projects/${projectId}/xyz/${xyzId}`,
  );
  return response.data;
};

// ---- Writes --------------------------------------------------------------

export const createXyz = async (
  projectId: string,
  data: IXyzCreateRequest,
): Promise<IXyzResponse> => {
  if (!projectId || projectId === "undefined") {
    throw new Error("Project ID is required");
  }
  const response = await api.post<IXyzResponse>(
    `/projects/${projectId}/xyz`,
    data,
  );
  return response.data;
};

export const updateXyz = async (
  projectId: string,
  xyzId: string,
  data: IXyzUpdateRequest,
): Promise<IXyzResponse> => {
  const response = await api.put<IXyzResponse>(
    `/projects/${projectId}/xyz/${xyzId}`,
    data,
  );
  return response.data;
};

export const deleteXyz = async (
  projectId: string,
  xyzId: string,
): Promise<void> => {
  await api.delete(`/projects/${projectId}/xyz/${xyzId}`);
};

// ---- Generation hook (mutation) -----------------------------------------

export const useGenerateXyz = (options = {}) => {
  return useMutation({
    mutationFn: ({ projectId }: { projectId: string }) =>
      api.post<void>(`/projects/${projectId}/xyz/generate`).then((r) => r.data),
    ...options,
  });
};

// ---- Polling -------------------------------------------------------------

/**
 * Polls a single xyz item every 1s while its status is init/in_progress.
 * Stops polling automatically once status is completed/failed.
 */
export const useXyzPolling = ({
  projectId,
  xyzId,
  enabled = true,
}: {
  projectId: string;
  xyzId: string;
  enabled?: boolean;
}) => {
  return useQuery({
    // NOTE: replace with a real key from `EQueryKey`
    queryKey: [EQueryKey.PROJECT_DATA, "xyz-polling", projectId, xyzId],
    queryFn: () => getXyz(projectId, xyzId),
    refetchInterval: (query: Query<IXyzResponse>) => {
      const data = query.state.data;
      return data && (data.status === "init" || data.status === "in_progress")
        ? 1000
        : false;
    },
    refetchOnWindowFocus: false,
    enabled: enabled && !!projectId && !!xyzId,
  });
};

// ---- Binary download -----------------------------------------------------

export const exportXyz = async (
  projectId: string,
  xyzId: string,
): Promise<void> => {
  const response = await api.get(
    `/projects/${projectId}/xyz/${xyzId}/export`,
    { responseType: "blob" },
  );
  if (!response?.data) throw new Error("Failed to export xyz");

  let filename = `xyz_${xyzId}.bin`;
  const contentDisposition = response.headers["content-disposition"];
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="(.+)"/);
    if (match?.[1]) filename = match[1];
  }
  saveAs(response.data, filename);
};
