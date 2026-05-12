import type { LayerData } from "~/components/stack/constants";
import { CATEGORY_TO_ZONE, type DiagramZone } from "../utils";

export const splitSubsystemByZones = (
  subsystems: LayerData[],
): Partial<Record<DiagramZone, LayerData[]>> => {
  return subsystems.reduce(
    (acc, subsystem) => {
      const zone = CATEGORY_TO_ZONE[subsystem.category];

      if (!zone) {
        return acc;
      }

      (acc[zone] ??= []).push(subsystem);
      return acc;
    },
    {} as Partial<Record<DiagramZone, LayerData[]>>,
  );
};
