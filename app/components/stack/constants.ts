import server from "~/assets/server.png";
import type { DellCategories } from "~/types/systemResponse";

const CORPORATE_COLORS: Record<string, string> = {
  corporate: "#10A5DB",
  government: "#10A5DB",

  banking: "#10A5DB",
  aviation: "#10A5DB",
  retail: "#10A5DB",

  strategy: "#7E52E4",
  placeholder: "#CCCCCC",
  unknown: "#666666",
  dark: "#333333",
  nvidia: "#76B900",
  dell: "#0076CE",
  hpe: "#01A982",
  lenovo: "#E2232A",
  supermicro: "#003A70",
  supermicro2: "#009639",
  oracle: "#C74634",
  microsoft: "#FEB800",
  microsoft2: "#F14F21",
  microsoft3: "#00A3EE",
  microsoft4: "#7EB900",
  amazon: "#FF9900",
  google: "#4285F4",
  google2: "#34A853",
  google3: "#FBBC05",
  google4: "#EA4335",
  hitachi: "#CC0001",
  apple: "#A2AAAD",
};

const ORDER_OF_LAYERS: Array<string> = [
  "hardware",
  "cloud",
  "virtualization",
  "mldata",
  "nvaie",
  "enterprise",
  "usecase",
  "strategy",
];

type Brand = keyof typeof CORPORATE_COLORS;

export type Box = {
  title: string;
  /** URL for the box (optional) */
  url?: string;
  hr_uid?: string;
  diagram_icon_url?: string;
  rootSubsystemName?: string;
  design_completed?: boolean;
  id: number;
  rank: number | null;
};

interface LayerData {
  /** Unique identifier for the layer (optional) */
  layer?: string;
  /** Title text for the layer */
  title: string;
  /** Brand key to select corporate color */
  brand: Brand;
  /** Array of box contents: string text or JSX node */
  boxes: Box[];
  color: string | null;
  /** URL for the layer (optional) */
  url?: string;
  hr_uid?: string;
  category: DellCategories;
  rank: number | null;
  id: number;
}

interface StackAnimatorProps {
  /** Array of layers forming the stack */
  stackData: LayerData[];
}

interface StackGeneratingInfo {
  design_completed: boolean;
  design_status: string;
  design_message: string;
  design_progress: number;
}

const MAX_IMAGES = 5;

const imagesMapping: Record<string, string> = {
  server: server,
};

export {
  CORPORATE_COLORS,
  ORDER_OF_LAYERS,
  type Brand,
  type LayerData,
  type StackAnimatorProps,
  type StackGeneratingInfo,
  MAX_IMAGES,
  imagesMapping,
};
