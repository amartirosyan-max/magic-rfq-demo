import { EUserProjectSelection } from "~/types/systemResponse";

export interface SystemTreeResponse {
  id: number;
  hr_uid: string | null;
  title: string;
  description: string;
  order: number;
  recommended: boolean;
  status: EUserProjectSelection;
  subsystems: SystemTreeResponse[];
  category: string;
}
