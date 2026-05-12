import type { Box, LayerData } from "~/components/stack/constants";

function splitBoxesByBestPerSubsystem(boxes: Box[]) {
  const map = new Map<string, Box[]>();

  for (const box of boxes) {
    const key = box.rootSubsystemName ?? `__single__${box.id}`;
    const group = map.get(key) ?? [];
    group.push(box);
    map.set(key, group);
  }

  const best: Box[] = [];
  const rest: Box[] = [];

  for (const group of map.values()) {
    if (group.length === 0) continue;

    const ranked = group.filter((b) => b.rank != null);

    const bestBox =
      ranked.length > 0
        ? ranked.reduce((max, b) => (b.rank! > max.rank! ? b : max))
        : group[0];

    best.push(bestBox);
    rest.push(...group.filter((b) => b !== bestBox));
  }

  return { best, rest };
}

export function sortingByRankLayerData(arr: LayerData[]) {
  const allBoxes = arr.flatMap((l) => l.boxes);

  const { best, rest } = splitBoxesByBestPerSubsystem(allBoxes);

  const bestSorted = best
    .filter((b) => b.rank != null)
    .sort((a, b) => b.rank! - a.rank!);

  const bestWithoutRank = best.filter((b) => b.rank == null);

  return [...bestSorted, ...bestWithoutRank, ...rest];
}
