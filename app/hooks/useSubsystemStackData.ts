import {
  EUserProjectSelection,
  type SubsystemResponse,
} from "~/types/systemResponse";
import { useEffectiveSubsystemId } from "./useEffectiveSubsystemId";
import { useMemo } from "react";
import { STACK_ORDER } from "~/utils/stackOrder";
import type { LayerData } from "~/components/stack/constants";
import { useCasesIcons } from "~/utils/useCasesDellDiagramIcons";

type AllowedCategory = "use_cases" | "data";

export function useSubsystemStackData({
  subsystemData,
  treeDataSystemId,
  categories = ["use_cases"],
}: {
  subsystemData?: SubsystemResponse;
  treeDataSystemId?: string;
  categories?: AllowedCategory[];
}) {
  const { id, systemId, subsystemPath } = useEffectiveSubsystemId();

  const basePath = useMemo(() => {
    let path = `/projects/${id}/systems/${treeDataSystemId || systemId}`;
    if (subsystemPath) path += "/" + subsystemPath;
    return path;
  }, [id, systemId, subsystemPath, treeDataSystemId]);

  const isSelected = (item: {
    status: EUserProjectSelection | string | null;
    recommended?: boolean;
  }) =>
    item.status === EUserProjectSelection.Chosen ||
    (item.status === null && item.recommended);

  const shuffledPlaceholders = useMemo(() => {
    const arr = [...useCasesIcons];

    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }, []);

  return useMemo(() => {
    if (!subsystemData?.subsystems?.length) return [];

    return categories
      .map<LayerData | null>((category) => {
        const subsystem = subsystemData.subsystems.find(
          (s) => s.category === category,
        );

        if (!subsystem?.subsystems?.length) return null;

        const selected = subsystem.subsystems
          .filter(isSelected)
          .sort((a, b) => {
            if (!a.hr_uid || !b.hr_uid) return 0;

            return (
              (STACK_ORDER[a.hr_uid as keyof typeof STACK_ORDER] ?? 100) -
              (STACK_ORDER[b.hr_uid as keyof typeof STACK_ORDER] ?? 100)
            );
          });

        let placeholderIndex = 0;

        const boxes = selected.map((sub) => {
          let icon = sub.diagram_icon_url;

          if (!icon) {
            icon =
              shuffledPlaceholders[
                placeholderIndex % shuffledPlaceholders.length
              ];

            placeholderIndex++;
          } else {
            icon = icon;
          }

          return {
            id: sub.id,
            title: sub.title,
            url: `${basePath}/subsystem/${sub.id}`,
            hr_uid: sub.hr_uid ?? undefined,
            diagram_icon_url: icon,
            design_completed: sub.design_completed,
            rank: sub.rank,
          };
        });

        return {
          layer: category,
          title:
            subsystem.title ??
            (category === "use_cases" ? "Use Cases" : "Data"),
          brand: "nvidia",
          color: subsystem.color === "nan" ? null : subsystem.color,
          url: basePath,
          category: subsystem.category,
          rank: subsystem.rank,
          boxes,
          id: subsystem.id,
        };
      })
      .filter((layer): layer is LayerData => layer !== null);
  }, [subsystemData, basePath, categories, shuffledPlaceholders]);
}
