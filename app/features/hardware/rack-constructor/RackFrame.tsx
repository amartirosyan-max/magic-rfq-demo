/**
 * RackFrame — the visual frame of one rack.
 *
 *   ┌────────────────────────┐  ← Rack_Top.svg
 *   │  ┌──┬──────────────┬──┐ │
 *   │  │L │   slot area  │R │ │  ← N × RackUnitSlot
 *   │  │..│              │..│ │
 *   │  └──┴──────────────┴──┘ │
 *   └────────────────────────┘  ← Rack_bottom.svg
 *
 * The slot column is `position: relative`, so callers absolute-position
 * `RackNode`s on top of the empty-slot grid using `nodeTopOffsetPx`.
 *
 * This component is intentionally presentational: no selection logic,
 * no animation, no data fetching. `Rack.tsx` composes those concerns.
 */
import type { CSSProperties, ReactNode } from "react";

import rackTopUrl from "~/assets/hardware/Rack_PNG/Rack_Top.svg";
import rackBottomUrl from "~/assets/hardware/Rack_PNG/Rack_bottom.svg";

import {
  RACK_BOTTOM_HEIGHT_PX,
  RACK_TOP_HEIGHT_PX,
  RACK_WIDTH_PX,
  UNIT_HEIGHT_PX,
  rackTotalHeightPx,
} from "../config";
import { RackSideRail } from "./RackSideRail";
import { RackUnitSlot } from "./RackUnitSlot";

interface RackFrameProps {
  /** Total rack height in U (e.g. 42, 21, 12). */
  heightU: number;
  /**
   * Children are absolute-positioned ON TOP of the empty-slot grid
   * inside the slot column. Typically one or more `<RackNode>`s.
   */
  children?: ReactNode;
  /**
   * Optional override of `RACK_WIDTH_PX`. Most callers should leave this
   * undefined and rely on the CSS variable `--rack-width`.
   */
  widthPx?: number;
  className?: string;
}

export function RackFrame({
  heightU,
  children,
  widthPx,
  className,
}: RackFrameProps) {
  const totalHeight = rackTotalHeightPx(heightU);

  const outerStyle: CSSProperties = {
    width: widthPx ?? "var(--rack-width)",
    height: totalHeight,
    "--rack-unit-h": `${UNIT_HEIGHT_PX}px`,
    "--rack-width": `${RACK_WIDTH_PX}px`,
  } as CSSProperties;

  return (
    <div
      data-rack-frame
      style={outerStyle}
      className={["relative flex flex-col", className ?? ""].join(" ")}
    >
      <img
        src={rackTopUrl}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ height: RACK_TOP_HEIGHT_PX, width: "100%" }}
        className="block select-none"
      />

      <div
        data-rack-slot-column
        style={{ height: heightU * UNIT_HEIGHT_PX }}
        className="relative flex w-full items-stretch"
      >
        <RackSideRail side="left" />

        <div className="relative flex min-h-0 flex-1 flex-col bg-black/20 rounded-[2px]">
          {Array.from({ length: heightU }, (_, idx) => {
            const positionU = heightU - idx;
            return <RackUnitSlot key={positionU} positionU={positionU} />;
          })}

          {children ? (
            <div
              data-rack-node-layer
              className="pointer-events-none absolute inset-0 z-20"
            >
              {children}
            </div>
          ) : null}
        </div>

        <RackSideRail side="right" />
      </div>

      <img
        src={rackBottomUrl}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ height: RACK_BOTTOM_HEIGHT_PX, width: "100%" }}
        className="block select-none"
      />
    </div>
  );
}
