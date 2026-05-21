/**
 * StandaloneNode — a frameless solo chassis.
 *
 * Used when `rack.kind === "standalone"`: there is no rack frame, no
 * top/bottom SVG and no side rails. The chassis image floats on the
 * canvas at the same vertical scale as a `sizeU` block inside a framed
 * rack (`sizeU × --rack-unit-h`), so different rack types visually
 * compose at consistent unit-heights.
 *
 * The intrinsic width is dictated by the child's natural aspect ratio
 * (`w-auto` on the wrapper). Callers that need a hard width cap can
 * pass `widthPx` to override.
 *
 * Selection / motion / hover concerns live one layer up in `Rack.tsx`,
 * mirroring how `RackNode` defers those to its caller.
 */
import type { CSSProperties, ReactNode } from "react";

import { UNIT_HEIGHT_PX } from "../config";

interface StandaloneNodeProps {
  /** Chassis height in U — drives the rendered height. */
  sizeU: number;
  /** Chassis body (image, ring, click target). */
  children?: ReactNode;
  /**
   * Optional explicit width. Default: `w-auto`, lets the chassis image
   * pick its own width via aspect ratio.
   */
  widthPx?: number;
  className?: string;
}

export function StandaloneNode({
  sizeU,
  children,
  widthPx,
  className,
}: StandaloneNodeProps) {
  const style: CSSProperties = {
    height: sizeU * UNIT_HEIGHT_PX,
    width: widthPx,
  };

  return (
    <div
      data-standalone-node
      data-size-u={sizeU}
      style={style}
      className={[
        "relative inline-flex items-stretch",
        widthPx ? "" : "w-auto",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
