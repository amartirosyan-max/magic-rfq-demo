export interface SubsystemInnerAResponse {
  id: number;
  hr_uid: string | null;
  title: string;
  description: string;
  long_description: string | null;
  color: string | null;
  recommended: boolean;
  status: EUserProjectSelection | string | null;
  design_completed: boolean;
  products: SystemProductResponse[];
  subsystems: SubsystemInnerBResponse[];
  category: DellCategories;
  diagram_icon_url: string | null;
  trending: string | null;
  rank: number | null;
  order?: number | null;
}

export interface SystemProductResponse {
  id: number;
  hr_uid: string;
  sku: string | null;
  name: string;
  description: string;
  image_url: string | null;
  diagram_icon_url: string | null;
  vendor: string | null;
  recommended: boolean;
  status: EUserProjectSelection | string | null;
  rank: number | null;
  trending: string | null;
  order?: number | null;
}

export interface SubsystemInnerBResponse {
  id: number;
  hr_uid: string | null;
  title: string;
  description: string;
  color: string | null;
  recommended: boolean;
  status: EUserProjectSelection | string | null;
  design_completed: boolean;
  products: SystemProductResponse[];
  diagram_icon_url: string | null;
  rank: number | null;
  order?: number | null;
}

export enum EUserProjectSelection {
  Chosen = "chosen",
  Existing = "existing",
  Removed = "removed",
}

export interface QuestionnaireSection {
  id: number;
  name: string;
  questions: QuestionnaireQuestion[];
}

export interface QuestionnaireQuestion {
  id: number;
  question: string;
  mandatory: boolean;
  answer_type: EAnswerType;
  answer_source: EAnswerSource | string | null;
  answer_options: string[];
  answer: Answer;
}

export enum EAnswerType {
  String = "string",
  Text = "text",
  Number = "number",
  Date = "date",
  Option = "option",
}

export enum EAnswerSource {
  Rfp = "rfp",
  Ai = "ai",
  User = "user",
}

export type Answer = string | null;

export enum EDesignStatus {
  Init = "init",
  InProgress = "in_progress",
  Completed = "completed",
  Failed = "failed",
}

export type DellCategories =
  | "use_cases"
  | "data"
  | "services"
  | "ecosystem"
  | "infrastructure";

export interface SubsystemResponse {
  id: number;
  project_id: number;
  parent_id: number | null;
  hr_uid: string | null;
  title: string;
  description: string;
  long_description: string | null;
  color: string | null;
  recommended: boolean;
  status: EUserProjectSelection | string | null;
  design_completed: boolean;
  design_progress: number;
  design_message: string;
  design_status: EDesignStatus;
  products: SystemProductResponse[];
  product_families: SystemProductFamilyResponse[];
  subsystems: SubsystemInnerAResponse[];
  questionnaire: QuestionnaireSection[];
  category: DellCategories;
  rank: number | null;
  trending: string | null;
  order?: number | null;
  diagram_icon_url: string | null;
}

export interface SystemProductFamilyResponse {
  id: number;
  hr_uid: string | null;
  name: string;
  description: string;
  image_url: string;
  color: string;
  recommended: boolean;
  status: EUserProjectSelection | string | null;
  trending: string | null;
}

export interface SubsystemShortResponse {
  id: number;
  project_id: number;
  parent_id: number | null;
  hr_uid: string | null;
  title: string;
  description: string;
  long_description: string | null;
  color: string | null;
  recommended: boolean;
  status: EUserProjectSelection | string | null;
  design_completed: boolean;
  design_progress: number;
  design_message: string;
  design_status: EDesignStatus;
}
