import type { QuestionnaireSection } from "~/types/systemResponse";

export enum CreatingStatus {
  IN_PROGRESS = "in_progress",
  REJECTED = "rejected",
  COMPLETED = "completed",
}

export interface ProposalSection {
  section: string;
  introduction: string;
  placeholder: string;
  conclusion: string;
}

export enum SystemGenerationStatus {
  INIT = "init",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface ProjectFile {
  id: number;
  name: string;
}

/** Агрегат фидбека по секции для дашборда (GET /projects) */
export interface IProjectFeedbackItem {
  section_index: number;
  section_title: string;
  feedback_status: "good" | "suggestion";
  comment: string | null;
}

export type ProjectResponse = {
  name: string;
  client_name: string;
  description: string;
  industry: string | null;
  budget_estimation: string | null;
  timeline: string | null;
  submission_deadline: string | null;
  id: number;
  /** ID исходного проекта (null для оригинала). Связь версий при rebuild. */
  parent_project_id?: number | null;
  /** 0 = оригинал, 1 = первый rebuild, 2 = второй и т.д. */
  rebuild_iteration?: number;
  creating_progress: number;
  creating_message: string;
  creating_status: CreatingStatus;
  system_generation_progress: number;
  system_generation_message: string;
  system_generation_status: SystemGenerationStatus;
  organization_id: number;
  organization_name: string;
  user_division: string | null;
  user_location: string | null;
  user_name: string | null;
  lead_score: string | null;
  proposal_confidence: number | null;
  questionnaire_completion: number | null;
  /** Агрегированные фидбеки по главам (для дашборда) */
  feedbacks?: IProjectFeedbackItem[];
};

/** Ответ POST /projects/{project_id}/rebuild — создание нового проекта (перегенерация proposal) */
export interface RebuildProjectResponse {
  project_id: number;
  parent_project_id: number;
  rebuild_iteration: number;
  status: "generating";
}

export type ProjectFullResponse = ProjectResponse & {
  questionnaire_sections: QuestionnaireSection[];
  proposal: ProposalSection[];
  files: ProjectFile[];
};

export interface ProjectUpdate {
  name: string;
  client_name: string;
  description: string;
  industry: string | null;
  budget_estimation: string | null;
  timeline: string | null;
  submission_deadline: string | null;
}
