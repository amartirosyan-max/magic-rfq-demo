import type { DellCategories } from "~/types/systemResponse";

export type DiagramZone =
  | "DATA"
  | "SERVICES"
  | "OPEN_ECOSYSTEM"
  | "INFRASTRUCTURE"
  | "USE_CASES";

export const CATEGORY_TO_ZONE: Record<DellCategories, DiagramZone> = {
  use_cases: "USE_CASES",
  data: "DATA",
  services: "SERVICES",
  ecosystem: "OPEN_ECOSYSTEM",
  infrastructure: "INFRASTRUCTURE",
};

export const BOXES_PER_BLOCK = 4;
export const USE_CASES_BLOCK_WIDTH = 200;
export const DATA_BLOCK_WIDTH = 200;
export const USE_CASES_TIP_OFFSET = 42;
export const USE_CASES_BLOCK_MARGIN_LEFT = 19;
export const MIDDLE_BLOCK_MARGIN_LEFT = 34;
export const MIDDLE_BLOCK_MARGIN_RIGHT = 45;
// value chosen empirically based on visual appearance
export const MIDDLE_BLOCK_ANIMATION_OFFSET = 27;

export const MIDDLE_BLOCK_ANIMATION_MARGIN_LEFT =
  USE_CASES_BLOCK_WIDTH - MIDDLE_BLOCK_MARGIN_LEFT;
export const MIDDLE_BLOCK_ANIMATION_MARGIN_RIGHT =
  USE_CASES_BLOCK_WIDTH -
  MIDDLE_BLOCK_MARGIN_RIGHT +
  MIDDLE_BLOCK_ANIMATION_OFFSET;

export function createUseCasesClipPath(leftNotch: number | string) {
  const resolvedLeftNotch =
    typeof leftNotch === "number" ? `${leftNotch}px` : leftNotch;

  return `polygon(0% 0%, calc(100% - ${USE_CASES_TIP_OFFSET}px) 0%, 100% 50%, calc(100% - ${USE_CASES_TIP_OFFSET}px) 100%, 0% 100%, calc(0% + ${resolvedLeftNotch}) 50%)`;
}
