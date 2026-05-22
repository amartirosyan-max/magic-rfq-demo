/**
 * RackNode — a chassis card occupying `sizeU` rows of a rack.
 *
 * Positioned absolutely inside the center column's node layer.
 *
 * Drag flow (when `draggable` is true):
 *   1. User pointer-down + drags → framer-motion mutates the `y`
 *      motion value within the slot column bounds.
 *   2. On release we ALWAYS spring `y` toward the current `animateY`
 *      target (`animate(y, animateY, …)`).
 *      • Valid drop  → parent calls `moveUnit` → `animateY` updates →
 *        the `useEffect` below re-targets the spring to the new slot.
 *        The animation starts FROM the drop position, not from origin.
 *      • Rejected drop → `animateY` unchanged → the manual animate in
 *        `onDragEnd` springs the node back to its original slot.
 *
 * We deliberately avoid framer-motion's `dragSnapToOrigin` because it
 * snaps to origin BEFORE React re-renders with the new override —
 * producing a visible "jump back then forward" artefact.
 */
import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useState,
} from "react";
import { animate, motion, useMotionValue } from "framer-motion";

import { UNIT_HEIGHT_PX } from "../config";

const SNAP_SPRING = { type: "spring" as const, stiffness: 380, damping: 28 };

interface RackNodeProps {
  positionU: number;
  sizeU: number;
  heightU: number;
  children?: ReactNode;
  className?: string;

  /** True when the rack is in edit mode — enables drag along Y axis. */
  draggable?: boolean;
  /** Slot column ref used as framer-motion dragConstraints boundary. */
  dragConstraintsRef?: RefObject<HTMLElement | null>;
  /** Called every animation frame with the raw Y drag offset in px. */
  onDragY?: (offsetPx: number) => void;
  /** Called on release with the final Y offset in px. */
  onDropY?: (offsetPx: number) => void;
  /**
   * Pixel offset to animate the node from its natural layout position.
   * 0 = original slot. Drives the spring-to-snap after a move or reset.
   */
  animateY?: number;
}

export function RackNode({
  positionU,
  sizeU,
  heightU,
  children,
  className,
  draggable = false,
  dragConstraintsRef,
  onDragY,
  onDropY,
  animateY = 0,
}: RackNodeProps) {
  const topInSlotColumn =
    (heightU - positionU - sizeU + 1) * UNIT_HEIGHT_PX;

  /* Manually controlled motion value — see file header for rationale. */
  const y = useMotionValue(animateY);
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Re-animate to the current target whenever it changes (a successful
   * move or an external reset). framer-motion will cancel any in-flight
   * animation on this motion value and start a fresh spring from the
   * current `y` — which is exactly the visual continuity we want.
   */
  useEffect(() => {
    const controls = animate(y, animateY, SNAP_SPRING);
    return () => controls.stop();
  }, [animateY, y]);

  const style: CSSProperties = {
    top: topInSlotColumn,
    left: 0,
    right: 0,
    height: sizeU * UNIT_HEIGHT_PX,
  };

  return (
    <motion.div
      data-rack-node
      data-position-u={positionU}
      data-size-u={sizeU}
      style={{ ...style, y }}
      /**
       * `zIndex` is animated via `animate` so a dragging node sits above
       * its peers (z=30), and `whileHover` lifts a hovered node above
       * neighbours (z=20) so the chassis hover ring's negative-inset
       * border is never clipped by an adjacent node's stacking layer.
       */
      animate={{ zIndex: isDragging ? 30 : 1 }}
      whileHover={!isDragging ? { zIndex: 20 } : undefined}
      transition={SNAP_SPRING}
      className={[
        "pointer-events-auto absolute overflow-visible",
        draggable ? "cursor-grab active:cursor-grabbing" : "",
        className ?? "",
      ].join(" ")}
      drag={draggable ? "y" : false}
      dragConstraints={draggable ? dragConstraintsRef : undefined}
      dragElastic={0}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDrag={(_, info) => onDragY?.(info.offset.y)}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        onDropY?.(info.offset.y);
        /**
         * Always spring `y` to the current `animateY` target. If the
         * parent commits the move (`moveUnit`), the next render will
         * change `animateY` and the `useEffect` above re-targets to
         * the new slot — picking up from the drop position seamlessly.
         */
        animate(y, animateY, SNAP_SPRING);
      }}
    >
      {/* Lift effect while dragging */}
      <motion.div
        className="h-full w-full"
        animate={
          isDragging
            ? {
                scale: 1.04,
                filter: "drop-shadow(0 0 7px rgba(255,255,255,0.6))",
              }
            : {
                scale: 1,
                filter: "drop-shadow(0 0 0px rgba(255,255,255,0))",
              }
        }
        transition={SNAP_SPRING}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
