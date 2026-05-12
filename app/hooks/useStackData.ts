import { useMemo } from "react";
import type {
  SubsystemInnerAResponse,
  SubsystemInnerBResponse,
} from "~/types/systemResponse";
import {
  EUserProjectSelection,
  type SubsystemResponse,
} from "~/types/systemResponse";
import { useEffectiveSubsystemId } from "~/hooks/useEffectiveSubsystemId";

function calculateFinalRank(
  subsystemRank: number,
  productRank: number,
  productHRUID: string,
) {
  const coefficient = productHRUID.includes("Dell") ? 1.3 : 1;

  return subsystemRank * productRank * coefficient;
}

export function useStackData({
  subsystemData,
  treeDataSystemId,
}: {
  subsystemData?: SubsystemResponse;
  treeDataSystemId?: string;
}) {
  const { id, systemId, subsystemPath } = useEffectiveSubsystemId();

  console.log("subsystemsData", subsystemData);

  const basePath = useMemo(() => {
    let path = `/projects/${id}/systems/${treeDataSystemId || systemId}`;
    if (subsystemPath) {
      path += "/" + subsystemPath;
    }
    return path;
  }, [id, systemId, subsystemPath, treeDataSystemId]);

  const filterForStack = (item: {
    status: EUserProjectSelection | string | null;
    recommended: boolean;
  }) => {
    return (
      item.status === EUserProjectSelection.Chosen ||
      (item.status === null && item.recommended)
    );
  };

  return useMemo(() => {
    if (!subsystemData) return [];

    const allHaveNested =
      subsystemData.subsystems?.length > 0
        ? subsystemData.subsystems.every(
            (s: SubsystemInnerAResponse) =>
              s.subsystems && s.subsystems.length > 0,
          )
        : false;

    function getSubsystemUrl(sub: any) {
      return `${basePath}/subsystem/${sub.id}`;
    }

    if (allHaveNested) {
      console.log("All subsystems have nested subsystems");
      return (
        subsystemData.subsystems
          .sort((a, b) => {
            return (
              (a.order ?? Number.MAX_SAFE_INTEGER) -
              (b.order ?? Number.MAX_SAFE_INTEGER)
            );
          })
          ?.filter(filterForStack)
          .map((subsystem: SubsystemInnerAResponse) => {
            // Identify which subsystems have selected/recommended products
            const subsystemsWithProducts = new Set(
              subsystem.subsystems
                .filter((s) => s.products?.some(filterForStack))
                .map((s) => s.id),
            );

            return {
              id: subsystem.id,
              layer: "hardware",
              // title: recommendedName || subsystem.title,
              title: subsystem.title,
              brand: "nvidia",
              color: subsystem.color,
              url: getSubsystemUrl(subsystem),
              hr_uid: subsystem.hr_uid || undefined,
              category: subsystem.category,
              design_completed: subsystemData.design_completed,
              design_status: subsystemData.design_status,
              rank: subsystem.rank,
              order: subsystem.order ?? null,
              boxes: [
                // Only include subsystems that don't have any selected products
                ...(subsystem.subsystems
                  ?.filter(filterForStack)
                  .filter((s) => !subsystemsWithProducts.has(s.id))
                  .map((s: SubsystemInnerBResponse) => ({
                    title: s.title,
                    url: `${basePath}/subsystem/${subsystem.id}/subsystem/${s.id}`,
                    hr_uid: s.hr_uid || undefined,
                    diagram_icon_url: s.diagram_icon_url ?? undefined,
                    design_completed: s.design_completed,
                    id: s.id,
                    rank: s.rank,
                    order: s.order ?? null,
                  })) || []),
                // Include all selected products
                ...subsystem.subsystems.flatMap(
                  (s: SubsystemInnerBResponse) =>
                    s.products?.filter(filterForStack).map((p) => ({
                      title: p.name,
                      url: `${basePath}/subsystem/${subsystem.id}/subsystem/${s.id}`,
                      rootSubsystemName: subsystemPath ? "" : s.title,
                      hr_uid: p.hr_uid || undefined,
                      diagram_icon_url:
                        p.diagram_icon_url ?? s.diagram_icon_url ?? undefined,
                      design_completed: s.design_completed,
                      id: p.id,
                      rank:
                        p.rank != null && s.rank != null
                          ? calculateFinalRank(s.rank, p.rank, p.hr_uid)
                          : null,
                      order: p.order ?? null,
                    })) || [],
                ),
              ],
            };
          }) || []
      );
    } else {
      console.log("Not all subsystems have nested subsystems");
      console.log("systemId: ", systemId);
      console.log("subsystemPath: ", subsystemPath);
      console.log("basePath: ", basePath);

      console.log(
        "subsystemData.products\n" + "              ?.filter(filterForStack): ",
        subsystemData.products?.filter(filterForStack),
      );

      return [
        {
          id: subsystemData.id,
          layer: "hardware",
          title: subsystemData.title,
          brand: "nvidia",
          color: subsystemData.color === "nan" ? null : subsystemData.color,
          url: basePath,
          category: subsystemData.category,
          design_completed: subsystemData.design_completed,
          design_status: subsystemData.design_status,
          rank: subsystemData.rank,
          order: subsystemData.order ?? null,
          boxes: [
            ...(subsystemData.subsystems
              ?.filter(filterForStack)
              .flatMap((subsystem: SubsystemInnerAResponse) => {
                if (
                  subsystem.products?.some(
                    (product) =>
                      product.status === EUserProjectSelection.Chosen ||
                      (product.recommended && product.status === null),
                  )
                ) {
                  console.log("subsystem.products: ", subsystem.products);
                  return subsystem.products
                    ?.filter(
                      (product) =>
                        product.status === EUserProjectSelection.Chosen ||
                        (product.recommended && product.status === null),
                    )
                    .map((product) => ({
                      id: product.id,
                      title: product.name,
                      url: `${basePath}/subsystem/${subsystem.id}`,
                      rootSubsystemName: basePath.endsWith(`/${subsystem.id}`)
                        ? ""
                        : subsystem.title,
                      hr_uid: product.hr_uid || undefined,
                      diagram_icon_url:
                        product.diagram_icon_url ??
                        subsystem.diagram_icon_url ??
                        undefined,
                      design_completed: subsystem.design_completed,
                      rank:
                        product.rank != null && subsystem.rank != null
                          ? calculateFinalRank(
                              subsystem.rank,
                              product.rank,
                              product.hr_uid,
                            )
                          : null,
                      order: product.order ?? null,
                    }));
                } else {
                  return {
                    id: subsystem.id,
                    title: subsystem.title,
                    url: `${basePath}/subsystem/${subsystem.id}`,
                    hr_uid: subsystem.hr_uid || undefined,
                    rootSubsystemName: "",
                    diagram_icon_url: subsystem.diagram_icon_url ?? undefined,
                    design_completed: subsystem.design_completed,
                    rank: subsystem.rank,
                    order: subsystem.order ?? null,
                  };
                }
              }) || []),
            ...(subsystemData.products?.filter(filterForStack).map((p) => ({
              id: p.id,
              title: p.name,
              rootSubsystemName: basePath.endsWith(`/${subsystemData.id}`)
                ? ""
                : subsystemData.title,
              hr_uid: p.hr_uid,
              rank:
                p.rank != null && subsystemData.rank != null
                  ? calculateFinalRank(subsystemData.rank, p.rank, p.hr_uid)
                  : null,
              diagram_icon_url:
                p.diagram_icon_url ??
                subsystemData.diagram_icon_url ??
                undefined,
              design_completed: subsystemData.design_completed,
              order: p.order ?? null,
            })) || []),
          ].sort((a, b) => {
            return (
              (a.order ?? Number.MAX_SAFE_INTEGER) -
              (b.order ?? Number.MAX_SAFE_INTEGER)
            );
          }),
        },
      ];
    }
  }, [subsystemData, basePath]);
}
