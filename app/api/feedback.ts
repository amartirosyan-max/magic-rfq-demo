// Proposal Feedback API (по главам: good / suggestion)
// GET /projects/{project_id}/proposal/feedback — все feedbacks по проекту (тело: { chapters: [...] })
// POST /projects/{project_id}/proposal/feedback — создать оценку секции
// PUT /projects/{project_id}/proposal/feedback/{id} — обновление
// DELETE /projects/{project_id}/proposal/feedback/{id} — soft delete (204)
// GET /proposal/feedback/history — история по всем проектам (тело: { feedbacks: [...] })

import api from "~/api/axios";

export type FeedbackStatus = "good" | "suggestion";

export interface IFeedbackResponse {
  id: number;
  project_id: number;
  user_name: string;
  section_index: number;
  section_title: string;
  feedback_status: FeedbackStatus;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ICreateFeedbackRequest {
  section_index: number;
  section_title: string;
  feedback_status: FeedbackStatus;
  comment?: string | null;
}

export interface IUpdateFeedbackRequest {
  feedback_status?: FeedbackStatus;
  comment?: string | null;
}

// Ответ GET /proposal/feedback/history — обёртка с массивом
export interface IFeedbackHistorySection {
  id: number;
  section_index: number;
  section_title: string;
  feedback_status: FeedbackStatus;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface IFeedbackHistoryItem {
  user_id: number;
  user_name: string;
  organization_id: number;
  organization_name: string;
  project_id: number;
  project_name: string;
  project_description: string;
  project_created_at: string;
  proposal_id: number | null;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
  updated_at: string | null;
  sections: IFeedbackHistorySection[];
}

export interface IFeedbackHistoryResponse {
  feedbacks: IFeedbackHistoryItem[];
}

export interface IProjectFeedbackResponse {
  chapters: IFeedbackResponse[];
}

export const getProjectFeedback = async (
  projectId: string,
): Promise<IFeedbackResponse[]> => {
  const response = await api.get<IProjectFeedbackResponse>(
    `/projects/${projectId}/proposal/feedback`,
  );
  return response.data.chapters ?? [];
};

export const createFeedback = async (
  projectId: string,
  data: ICreateFeedbackRequest,
): Promise<IFeedbackResponse> => {
  const response = await api.post<IFeedbackResponse>(
    `/projects/${projectId}/proposal/feedback`,
    data,
  );
  return response.data;
};

export const updateFeedback = async (
  projectId: string,
  feedbackId: number,
  data: IUpdateFeedbackRequest,
): Promise<IFeedbackResponse> => {
  const response = await api.put<IFeedbackResponse>(
    `/projects/${projectId}/proposal/feedback/${feedbackId}`,
    data,
  );
  return response.data;
};

export const deleteFeedback = async (
  projectId: string,
  feedbackId: number,
): Promise<void> => {
  await api.delete(`/projects/${projectId}/proposal/feedback/${feedbackId}`);
};

export const getFeedbackHistory = async (): Promise<IFeedbackHistoryItem[]> => {
  const response = await api.get<IFeedbackHistoryResponse>(
    "/proposal/feedback/history",
  );
  return response.data.feedbacks;
};
