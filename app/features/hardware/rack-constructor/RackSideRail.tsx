/**
 * RackSideRail — left or right border of the rack slot column.
 *
 * Rendered once per side at full slot-column height (not per 1U row) so
 * the rails read as a single continuous strip with no gaps between units.
 *
 * Pure CSS for now. When a dedicated side-rail SVG is provided later,
 * swap the `<div>` for an `<img>` or inline SVG — props stay the same.
 */
import type { CSSProperties } from "react";
import { cn } from "~/lib/utils";

export type RackSideRailSide = "left" | "right";

interface RackSideRailProps {
  side: RackSideRailSide;
  /** Optional className passthrough. */
  className?: string;
}

export function RackSideRail({ side, className }: RackSideRailProps) {
  const style: CSSProperties = {
    width: "var(--rack-side-rail-w)",
    height: "100%",
  };

  return (
    <div
      data-rack-side-rail={side}
      style={style}
      className={cn(
        "shrink-0 rounded-[1px] border border-white/95 bg-white/[0.55]",
        className,
      )}
    />
  );
}
