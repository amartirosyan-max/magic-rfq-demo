// Chat API: project-level and subsystem-level messages, upload, history
// Doc: FE RankChatUseCasesOrder.docx

import api from "~/api/axios";

export enum EChatTarget {
  Questions = "questions",
  Design = "design",
  Price = "price",
}

export interface IChatRequest {
  message: string;
  target: EChatTarget;
  /** ID прикреплённых файлов (из upload) */
  asset_ids?: number[];
}

export interface IChatResponse {
  message: string;
}

// --- Upload (POST /projects/{id}/chat/upload) ---
export interface IChatUploadItem {
  id: number;
  file_name: string;
  content_type: string;
}

export const uploadChatFiles = async (
  projectId: string,
  files: File[],
): Promise<IChatUploadItem[]> => {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const response = await api.post<IChatUploadItem[]>(
    `/projects/${projectId}/chat/upload`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
};

// --- Send message: project-level (POST /projects/{id}/chat) ---
export const sendProjectChatMessage = async (
  projectId: string,
  data: IChatRequest,
): Promise<IChatResponse> => {
  const response = await api.post<IChatResponse>(
    `/projects/${projectId}/chat`,
    data,
  );
  return response.data;
};

// --- Send message: subsystem-level (POST /projects/{id}/systems/{sid}/chat) ---
export const sendChatMessage = async (
  projectId: string,
  subsystemId: string,
  data: IChatRequest,
): Promise<IChatResponse> => {
  const response = await api.post<IChatResponse>(
    `/projects/${projectId}/systems/${subsystemId}/chat`,
    data,
  );
  return response.data;
};

// --- History (GET /projects/{id}/chat/history) ---
export interface IChatAssetInfo {
  id: number;
  file_name: string;
  content_type: string;
}

export interface IChatMessage {
  sender: "user" | "bot";
  message: string;
  assets: IChatAssetInfo[] | null;
}

export const getChatHistory = async (
  projectId: string,
): Promise<IChatMessage[]> => {
  const response = await api.get<IChatMessage[]>(
    `/projects/${projectId}/chat/history`,
  );
  return response.data;
};

// --- Download attached file (GET /projects/{id}/assets/{asset_id}/download) ---
// Для скачивания через тот же API можно использовать downloadProjectAsset из ~/api/projects.
// Если бекенд отдаёт по пути /download, используйте эндпоинт ниже.
