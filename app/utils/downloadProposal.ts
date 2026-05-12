import html2canvas from "html2canvas-pro";
import { downloadProjectProposal } from "~/api/proposal";
import { toPng } from "html-to-image";
import type { Diagram } from "~/context/DiagramContext";

export const handleDownloadProposal = async (
  projectId: string,
  clientName: string | null,
  diagram: Diagram,
) => {
  const element = document.getElementById("stack-container");

  if (!element) {
    console.error("Element with id 'stack-container' not found");
    return;
  }

  try {
    const imgData =
      diagram === "nvidia"
        ? (await html2canvas(element)).toDataURL()
        : await toPng(element, { skipFonts: true });
    console.log("Generated image data:", imgData);

    await downloadProjectProposal(projectId, imgData, clientName);
    console.log("Proposal downloaded successfully");
  } catch (error) {
    console.error("Error downloading proposal:", error);
  }
};
