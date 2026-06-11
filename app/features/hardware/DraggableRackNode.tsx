/**
 * DraggableRackNode — binds dnd-kit `useDraggable` to a presentational
 * `RackNode`.
 *
 * Kept in the feature folder (not in `rack-constructor/`) so the primitive
 * stays drag-free and migration-safe. The dragged unit's identity is the
 * `RackUnit.id`; the `data` payload carries everything the DnD provider needs
 * to render the drag overlay and commit the move.
 */
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useDraggable } from "@dnd-kit/core";

import { RackNode } from "./rack-constructor";
import type { RackUnit } from "./types";

interface DraggableRackNodeProps {
  unit: RackUnit;
  /** Rack this node currently lives in (effective placement). */
  rackId: string;
  /** Effective U position inside `rackId`. */
  positionU: number;
  /** Height of the host rack in U. */
  heightU: number;
  /** True when this node may be dragged (its rack is selected). */
  draggable: boolean;
  /** Chassis image URL — handed to the drag overlay. */
  imageUrl?: string;
  alt: string;
  children: ReactNode;
}

export function DraggableRackNode({
  unit,
  rackId,
  positionU,
  heightU,
  draggable,
  imageUrl,
  alt,
  children,
}: DraggableRackNodeProps) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: unit.id,
    disabled: !draggable,
    data: { unit, rackId, imageUrl, alt },
  });

  /* Merge dnd-kit's node listeners but stop the press from bubbling to the rack
   * body's reorder handle — so pressing a node moves the node, not the rack. */
  const dragHandleProps = draggable
    ? {
        ...attributes,
        ...listeners,
        onPointerDown: (event: ReactPointerEvent) => {
          (
            listeners as
              | { onPointerDown?: (e: ReactPointerEvent) => void }
              | undefined
          )?.onPointerDown?.(event);
          event.stopPropagation();
        },
      }
    : undefined;

  return (
    <RackNode
      nodeRef={setNodeRef}
      positionU={positionU}
      sizeU={unit.sizeU}
      heightU={heightU}
      draggable={draggable}
      isActiveDrag={isDragging}
      dragHandleProps={dragHandleProps}
    >
      {children}
    </RackNode>
  );
}
