/**
 * RackDndProvider — the cross-rack drag-and-drop engine.
 *
 * Wraps the rack row (mounted in `ScreenA`) with a dnd-kit `<DndContext>` and a
 * single body-level `<DragOverlay>`. The overlay is the reason we use dnd-kit:
 * it renders the lifted chassis in a portal at the document root, so a node
 * dragged from one rack to another is NEVER clipped by ScreenA's
 * `overflow-x-auto overflow-y-hidden` scroller.
 *
 * Interaction model (no edit button): a node is draggable whenever its rack is
 * selected (zoomed). Press-and-hold lifts it (`PointerSensor` delay) — a quick
 * click still selects / navigates.
 *
 * Drop targeting is **column-based** (`columnCollision`): the active rack is the
 * one whose horizontal column the pointer is in, with vertical slack, so
 * dragging to a rack's very top/bottom never drops it. Between rack columns
 * nothing matches → no active rack (every rack reads dimmed/"disabled").
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Collision,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { motion } from "framer-motion";

import { useRackEdits, type PlacedUnit } from "./RackEditsContext";
import { useSelection } from "./SelectionContext";
import { useSubsystemEdits } from "./SubsystemEditsContext";

/* ── shared drag-session state (read by every Rack) ─────────────────────── */

interface GhostState {
  rackId: string;
  positionU: number;
  sizeU: number;
  valid: boolean;
}

interface RackDndContextValue {
  /** Rack the pointer is currently over (the drop target), or null. */
  activeRackId: string | null;
  /** Live landing slot for the active rack, or null. */
  ghost: GhostState | null;
  /** True while a drag is in progress. */
  isDragging: boolean;
  /**
   * Returns true exactly once if a click is the stray click that fires right
   * after a drag — callers use it to skip navigation / deselection.
   */
  consumeDragClick: () => boolean;
}

const RackDndContext = createContext<RackDndContextValue>({
  activeRackId: null,
  ghost: null,
  isDragging: false,
  consumeDragClick: () => false,
});

export function useRackDnd(): RackDndContextValue {
  return useContext(RackDndContext);
}

/* Spring-like glide of the lifted node into its landing slot on drop. */
const DROP_ANIMATION = {
  duration: 230,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
};
/* Settle (clear overlay + apply the follow-the-node reselect) just after the
 * glide finishes, so the landing reads as one motion. */
const DROP_SETTLE_MS = 260;

/* How far above/below a rack the pointer may stray and still count as inside
 * that rack's column — keeps the rack active when dragging to its top/bottom. */
const COLUMN_VERTICAL_SLACK = 160;

/**
 * Column-based drop targeting. The active rack is the one whose horizontal
 * extent contains the pointer (plus vertical slack so top/bottom edges never
 * drop out). In the gap between rack columns nothing matches → no active rack.
 */
const columnCollision: CollisionDetection = ({
  droppableContainers,
  droppableRects,
  pointerCoordinates,
}) => {
  if (!pointerCoordinates) return [];
  const { x, y } = pointerCoordinates;
  const collisions: Collision[] = [];
  for (const container of droppableContainers) {
    if (container.disabled) continue;
    const rect = droppableRects.get(container.id);
    if (!rect) continue;
    const inColumn = x >= rect.left && x <= rect.right;
    const inHeight =
      y >= rect.top - COLUMN_VERTICAL_SLACK &&
      y <= rect.bottom + COLUMN_VERTICAL_SLACK;
    if (inColumn && inHeight) collisions.push({ id: container.id });
  }
  return collisions;
};

/* ── geometry helpers ───────────────────────────────────────────────────── */

/**
 * Map an absolute pointer Y to a 1-based bottom U position inside a rack,
 * centring the dragged unit on the cursor. `slotRect` is the LIVE
 * `getBoundingClientRect()` of the hovered rack's slot column, so its height
 * already encodes any CSS scale — no scale factor needed here.
 */
function pointerToPositionU(
  pointerY: number,
  slotRect: DOMRect,
  heightU: number,
  sizeU: number,
): number {
  const unitPx = slotRect.height / heightU;
  const pointerRow = (pointerY - slotRect.top) / unitPx;
  const topRow = Math.round(pointerRow - (sizeU - 1) / 2);
  const positionU = heightU - topRow - sizeU + 1;
  return Math.max(1, Math.min(heightU - sizeU + 1, positionU));
}

function isSlotOccupied(
  positionU: number,
  sizeU: number,
  placed: PlacedUnit[],
  excludeUnitId: string,
): boolean {
  const lo = positionU;
  const hi = positionU + sizeU - 1;
  for (const { unit, positionU: p } of placed) {
    if (unit.id === excludeUnitId) continue;
    const uLo = p;
    const uHi = p + unit.sizeU - 1;
    if (lo <= uHi && hi >= uLo) return true;
  }
  return false;
}

/** Extract clientY from the original pointer/touch activator event. */
function getPointerY(event: Event | null): number {
  if (!event) return 0;
  if ("clientY" in event) return (event as MouseEvent).clientY;
  const touchEvent = event as TouchEvent;
  const touch = touchEvent.touches?.[0] ?? touchEvent.changedTouches?.[0];
  return touch?.clientY ?? 0;
}

/** Extract clientX from the original pointer/touch activator event. */
function getPointerX(event: Event | null): number {
  if (!event) return 0;
  if ("clientX" in event) return (event as MouseEvent).clientX;
  const touchEvent = event as TouchEvent;
  const touch = touchEvent.touches?.[0] ?? touchEvent.changedTouches?.[0];
  return touch?.clientX ?? 0;
}

/**
 * Drop index for a reordered rack: how many OTHER racks sit to the left of the
 * pointer. Matches `moveRack`'s post-removal index semantics.
 */
function rackInsertIndex(draggedRackId: string, pointerX: number): number {
  const els = Array.from(
    document.querySelectorAll<HTMLElement>("[data-rack-id]"),
  );
  let index = 0;
  for (const el of els) {
    const id = el.getAttribute("data-rack-id");
    if (!id || id === draggedRackId) continue;
    const r = el.getBoundingClientRect();
    if (pointerX > r.left + r.width / 2) index += 1;
  }
  return index;
}

/* ── provider ───────────────────────────────────────────────────────────── */

export function RackDndProvider({ children }: { children: ReactNode }) {
  const { unitsForRack, moveUnit, moveRack, racks } = useRackEdits();
  const { isDeleted } = useSubsystemEdits();
  const { selectRack, selectedRackId } = useSelection();

  const [activeRackId, setActiveRackId] = useState<string | null>(null);
  const [ghost, setGhost] = useState<GhostState | null>(null);
  const [overlay, setOverlay] = useState<{ imageUrl?: string; alt: string } | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  /* Latest ghost, read synchronously in onDragEnd (state may be stale there). */
  const ghostRef = useRef<GhostState | null>(null);
  /* Armed on drop so the stray post-drag click is swallowed (one-shot). */
  const suppressClickRef = useRef(false);
  /* Pending "settle after the drop glide" timer. */
  const settleTimerRef = useRef<number | null>(null);
  /* Cooldown so a live rack reorder steps one slot at a time (lets the row
   * layout settle between hops instead of jittering). */
  const reorderCooldownRef = useRef(false);

  useEffect(
    () => () => {
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
      }
      document.documentElement.classList.remove("is-reordering-rack");
    },
    [],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 140, tolerance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const consumeDragClick = useCallback((): boolean => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return true;
    }
    return false;
  }, []);

  const computeGhost = useCallback(
    (
      rackId: string,
      sizeU: number,
      excludeUnitId: string,
      pointerY: number,
    ): GhostState | null => {
      const rack = racks.find((r) => r.id === rackId);
      if (!rack || rack.kind === "standalone") return null;

      const slotEl = document.querySelector<HTMLElement>(
        `[data-rack-id="${CSS.escape(rackId)}"] [data-rack-slot-column]`,
      );
      if (!slotEl) return null;

      const positionU = pointerToPositionU(
        pointerY,
        slotEl.getBoundingClientRect(),
        rack.heightU,
        sizeU,
      );
      const placed = unitsForRack(rackId).filter(
        (p) => !isDeleted(p.unit.subsystemId),
      );
      const fits = rack.heightU >= sizeU;
      const valid = fits && !isSlotOccupied(positionU, sizeU, placed, excludeUnitId);
      return { rackId, positionU, sizeU, valid };
    },
    [racks, unitsForRack, isDeleted],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as
      | { type?: string; imageUrl?: string; alt?: string; rackId?: string }
      | undefined;
    /* Rack reorder drag — no node overlay / ghost; the rack lifts via its own
     * useDraggable `isDragging`. Force a global grabbing cursor for the drag. */
    if (data?.type === "rack") {
      document.documentElement.classList.add("is-reordering-rack");
      return;
    }
    suppressClickRef.current = false;
    setIsDragging(true);
    /* The source rack starts active so it stays focused on pickup until the
     * pointer leaves its container. */
    setActiveRackId(data?.rackId ?? null);
    setOverlay({ imageUrl: data?.imageUrl, alt: data?.alt ?? "" });
  }, []);

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      /* Rack reorder — live, one hop at a time as the pointer passes a
       * neighbour's far portion (60% in on the right / 40% on the left gives
       * hysteresis so it doesn't flip-flop). The row's `layout` animates each
       * swap; the final position is corrected on drop. */
      if (event.active.data.current?.type === "rack") {
        const rid = event.active.data.current.rackId as string | undefined;
        if (!rid || reorderCooldownRef.current) return;
        const pointerX = getPointerX(event.activatorEvent) + event.delta.x;
        const ordered = Array.from(
          document.querySelectorAll<HTMLElement>("[data-rack-id]"),
        )
          .map((el) => ({
            id: el.getAttribute("data-rack-id"),
            rect: el.getBoundingClientRect(),
          }))
          .filter((x): x is { id: string; rect: DOMRect } => x.id !== null);
        const idx = ordered.findIndex((x) => x.id === rid);
        if (idx < 0) return;
        const right = ordered[idx + 1];
        const left = ordered[idx - 1];
        let moved = false;
        if (right && pointerX > right.rect.left + right.rect.width * 0.6) {
          moveRack(rid, idx + 1);
          moved = true;
        } else if (left && pointerX < left.rect.left + left.rect.width * 0.4) {
          moveRack(rid, idx - 1);
          moved = true;
        }
        if (moved) {
          reorderCooldownRef.current = true;
          window.setTimeout(() => {
            reorderCooldownRef.current = false;
          }, 220);
        }
        return;
      }

      const rackId = (event.over?.id as string | undefined) ?? null;
      setActiveRackId(rackId);

      const unit = event.active.data.current?.unit as
        | { sizeU: number }
        | undefined;
      if (!rackId || !unit) {
        setGhost(null);
        ghostRef.current = null;
        return;
      }

      const pointerY = getPointerY(event.activatorEvent) + event.delta.y;
      const next = computeGhost(
        rackId,
        unit.sizeU,
        event.active.id as string,
        pointerY,
      );
      setGhost(next);
      ghostRef.current = next;
    },
    [computeGhost, moveRack],
  );

  /* Swallow the stray click the browser fires right after a drop. */
  const armClickGuard = useCallback(() => {
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 300);
  }, []);

  /**
   * Run AFTER the drop glide finishes: clear the overlay + active emphasis and,
   * for a committed cross-rack move, move selection onto the landing rack
   * (focus follows the node). Deferring this keeps the layout stable while the
   * node glides home — the reselect's rescale/re-centre no longer fights the
   * landing, so it reads as a single smooth motion.
   */
  const settleAfterDrop = useCallback(
    (landingRackId: string | null) => {
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
      }
      settleTimerRef.current = window.setTimeout(() => {
        settleTimerRef.current = null;
        setOverlay(null);
        setActiveRackId(null);
        setIsDragging(false);
        if (landingRackId && landingRackId !== selectedRackId) {
          selectRack(landingRackId);
        }
      }, DROP_SETTLE_MS);
    },
    [selectRack, selectedRackId],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const dragData = event.active.data.current as
        | { type?: string; rackId?: string }
        | undefined;
      /* Rack reorder — drop the rack at the index under the pointer. */
      if (dragData?.type === "rack" && dragData.rackId) {
        document.documentElement.classList.remove("is-reordering-rack");
        const pointerX = getPointerX(event.activatorEvent) + event.delta.x;
        moveRack(dragData.rackId, rackInsertIndex(dragData.rackId, pointerX));
        armClickGuard();
        return;
      }

      const rackId = (event.over?.id as string | undefined) ?? null;
      const landing = ghostRef.current;
      let landed: string | null = null;
      if (rackId && landing && landing.rackId === rackId && landing.valid) {
        moveUnit(event.active.id as string, rackId, landing.positionU);
        landed = rackId;
      } else {
        /* No valid drop — re-focus the source rack so the node snaps back into
         * a still-emphasized container instead of a dimmed one. */
        const sourceRackId = event.active.data.current?.rackId as
          | string
          | undefined;
        if (sourceRackId) setActiveRackId(sourceRackId);
      }
      /* Clear the ghost now, but keep the overlay + active emphasis so the node
       * glides into a still-emphasized, non-shifting target. */
      setGhost(null);
      ghostRef.current = null;
      armClickGuard();
      /* `isDragging` stays true through the glide so the landing rack keeps
       * focus; it is cleared in the settle step. */
      settleAfterDrop(landed);
    },
    [moveUnit, moveRack, armClickGuard, settleAfterDrop],
  );

  const handleDragCancel = useCallback(() => {
    document.documentElement.classList.remove("is-reordering-rack");
    setGhost(null);
    ghostRef.current = null;
    armClickGuard();
    settleAfterDrop(null);
  }, [armClickGuard, settleAfterDrop]);

  const value = useMemo<RackDndContextValue>(
    () => ({ activeRackId, ghost, isDragging, consumeDragClick }),
    [activeRackId, ghost, isDragging, consumeDragClick],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={columnCollision}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <RackDndContext.Provider value={value}>
        {children}
      </RackDndContext.Provider>

      <DragOverlay dropAnimation={DROP_ANIMATION}>
        {overlay ? (
          <motion.div
            className="h-full w-full cursor-grabbing"
            initial={{ scale: 1 }}
            animate={{
              scale: 1.06,
              filter: "drop-shadow(0 0 8px rgba(255,255,255,0.6))",
            }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          >
            <img
              src={overlay.imageUrl}
              alt={overlay.alt}
              draggable={false}
              className="block h-full w-full select-none object-fill"
            />
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
