import { saveAs } from "file-saver";
import api from "~/api/axios";
import { type QuestionnaireQuestion } from "~/types/systemResponse";

export interface QuestionUpdate {
  answer: string;
}

export const giveAnswer = async (
  questionId: number,
  answer: QuestionUpdate,
): Promise<void> => {
  const response = await api.put<void>(`/questions/${questionId}`, answer);

  return response.data;
};

//PUT
// /questions/{question_id}/magic
// Ask answer
//Parameters
// Try it out
// Name	Description
// question_id *
// integer($int64)
// (path)
//200 ok QuestionnaireQuestion

export const askAnswer = async (
  questionId: number,
): Promise<QuestionnaireQuestion> => {
  const response = await api.put<QuestionnaireQuestion>(
    `/questions/${questionId}/magic`,
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

export const exportQuestionnaire = async (
  projectId: string,
  subsystemId?: string,
): Promise<void> => {
  if (!projectId || projectId === "undefined") {
    throw new Error("Project ID is required");
  }

  const url = subsystemId
    ? `/projects/${projectId}/export/questionnaire/subsystem/${subsystemId}`
    : `/projects/${projectId}/export/questionnaire`;

  const response = await api.get(url, {
    responseType: "blob",
  });

  if (!response || !response.data) {
    throw new Error("Failed to export questionnaire");
  }

  const baseName =
    `questionnaire_${projectId}` +
    (subsystemId ? `_subsystem_${subsystemId}` : "");
  const filename = getFilenameFromDisposition(
    response.headers["content-disposition"],
    baseName,
  );

  saveAs(response.data, filename);
};
