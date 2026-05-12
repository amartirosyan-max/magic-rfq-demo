import api from "~/api/axios";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

export const downloadProjectProposal = async (
  projectId: string,
  image_base64: string,
  clientName: string | null,
): Promise<void> => {
  if (!projectId || projectId === "undefined") {
    throw new Error("Project ID is required");
  }

  const response = await api.post(
    `/projects/${projectId}/proposal-docx`,
    { image_base64 },
    { responseType: "blob" },
  );

  if (!response || !response.data) {
    throw new Error("Failed to download proposal");
  }

  // Format date as "June 25 2025"
  const formattedDate = dayjs().format("MMMM D YYYY");
  const safeClientName = clientName
    ? clientName.replace(/[\\/:*?"<>|]/g, "")
    : "Client";
  let filename = `${safeClientName} Proposal ${formattedDate}.docx`;

  const contentDisposition = response.headers["content-disposition"];
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  saveAs(response.data, filename);
  console.log("Proposal downloaded successfully");
};
