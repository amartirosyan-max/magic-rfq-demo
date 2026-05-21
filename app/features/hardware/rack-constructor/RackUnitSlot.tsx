/**
 * RackUnitSlot — one empty 1U row in the rack interior (center band only).
 *
 * Side rails are rendered once per column in `RackFrame`. Each slot shows a
 * light translucent fill so empty U positions read as individual bays;
 * chassis nodes in the overlay layer cover occupied slots.
 */
import type { CSSProperties } from "react";
import { cn } from "~/lib/utils";

interface RackUnitSlotProps {
  /** U position (1 = bottom, heightU = top). */
  positionU: number;
}

export function RackUnitSlot({ positionU }: RackUnitSlotProps) {
  const style: CSSProperties = {
    height: "var(--rack-unit-h)",
  };

  return (
    <div
      data-rack-unit-slot={positionU}
      style={style}
      className={cn(
        "w-full shrink-0 rounded-[2px] z-10",
        "border-[0.5px] border-black/20",
        "bg-gray-200/15",
      )}
    />
  );
}
