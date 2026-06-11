/**
 * RackNode — a chassis card occupying `sizeU` rows of a rack.
 *
 * Purely presentational: it absolutely positions itself inside the center
 * column's node layer at the U position it is given, and renders whatever
 * body it is handed. It owns NO drag logic — the drag wiring (dnd-kit
 * `useDraggable`) lives one layer up in `DraggableRackNode.tsx` and is passed
 * in as plain props (`nodeRef`, `dragHandleProps`, `isActiveDrag`). This keeps
 * the primitive free of feature dependencies so it can migrate to Magic 2.1
 * unchanged (see `MIGRATION-NOTES.md`).
 */
import type { CSSProperties, ReactNode, Ref } from "react";

import { UNIT_HEIGHT_PX } from "../config";

interface RackNodeProps {
  positionU: number;
  sizeU: number;
  heightU: number;
  children?: ReactNode;
  className?: string;

  /** Callback ref for the positioned element (dnd-kit `setNodeRef`). */
  nodeRef?: Ref<HTMLDivElement>;
  /** True while editing — adds grab cursor + disables touch scrolling. */
  draggable?: boolean;
  /** Drag listeners + a11y attributes from `useDraggable`, spread onto the node. */
  dragHandleProps?: Record<string, unknown>;
  /** True while this node is the active drag item — hide it so only the
   *  `<DragOverlay>` copy is visible. */
  isActiveDrag?: boolean;
}

export function RackNode({
  positionU,
  sizeU,
  heightU,
  children,
  className,
  nodeRef,
  draggable = false,
  dragHandleProps,
  isActiveDrag = false,
}: RackNodeProps) {
  const topInSlotColumn = (heightU - positionU - sizeU + 1) * UNIT_HEIGHT_PX;

  const style: CSSProperties = {
    top: topInSlotColumn,
    left: 0,
    right: 0,
    height: sizeU * UNIT_HEIGHT_PX,
  };

  return (
    <div
      ref={nodeRef}
      data-rack-node
      data-position-u={positionU}
      data-size-u={sizeU}
      style={style}
      className={[
        "pointer-events-auto absolute overflow-visible",
        draggable ? "cursor-grab touch-none active:cursor-grabbing" : "hover:z-30",
        isActiveDrag ? "opacity-0" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...dragHandleProps}
    >
      {children}
    </div>
  );
}
