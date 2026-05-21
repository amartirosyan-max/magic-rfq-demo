/**
 * RackNode — a chassis card occupying `sizeU` rows of a rack.
 *
 * Positioned absolutely inside the center column's node layer (between
 * the two side rails — the layer is already inset, so we use full width
 * of that column with `left: 0; right: 0` only).
 *
 *   topInSlotColumn = (heightU − positionU − sizeU + 1) × unitHeight
 */
import type { CSSProperties, ReactNode } from "react";

import { UNIT_HEIGHT_PX } from "../config";

interface RackNodeProps {
  /** Bottom-most U the chassis occupies (1 = bottom of rack). */
  positionU: number;
  /** Chassis height in U. */
  sizeU: number;
  /** Total rack height in U — needed to convert U → pixel offset. */
  heightU: number;
  /**
   * Body of the chassis row: image, label, status badge, etc.
   * Rendered inside the inner slot area between the two side rails.
   */
  children?: ReactNode;
  className?: string;
}

export function RackNode({
  positionU,
  sizeU,
  heightU,
  children,
  className,
}: RackNodeProps) {
  const topInSlotColumn =
    (heightU - positionU - sizeU + 1) * UNIT_HEIGHT_PX;

  const style: CSSProperties = {
    top: topInSlotColumn,
    left: 0,
    right: 0,
    height: sizeU * UNIT_HEIGHT_PX,
  };

  return (
    <div
      data-rack-node
      data-position-u={positionU}
      data-size-u={sizeU}
      style={style}
      className={[
        "pointer-events-auto absolute overflow-visible",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
