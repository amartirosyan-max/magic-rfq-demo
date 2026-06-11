import { useMemo, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { RotateCcw } from "lucide-react";
import { cn } from "~/lib/utils";
import { useHardwareProject } from "./HardwareProjectContext";
import { useSelection } from "./SelectionContext";
import { useSubsystemEdits } from "./SubsystemEditsContext";
import { useRackEdits } from "./RackEditsContext";
import { useRackDnd } from "./RackDndProvider";
import { DraggableRackNode } from "./DraggableRackNode";
import type { Rack as RackType, RackUnit } from "./types";
import { CHASSIS_IMAGE_URLS } from "~/features/hardware/chassis-assets";
import {
  hardwareSpring,
  RACK_SCALE_FLANK,
  RACK_SCALE_SELECTED,
} from "./motion";
import { UNIT_HEIGHT_PX } from "./config";
import { RackFrame, StandaloneNode } from "./rack-constructor";

/* ============================================================
 *  RACK UNIT — HOVER STYLES
 * ------------------------------------------------------------
 *  Active only in normal (non-edit) mode when the rack is selected.
 * ============================================================ */
const UNIT_HOVER_RING_INSET_X = "-inset-x-[5px]";
const UNIT_HOVER_RING_INSET_Y = "-inset-y-[2px]";
const UNIT_HOVER_RING_RADIUS = "rounded-[5px]";
const UNIT_HOVER_RING_BORDER = "border-2 border-white";
const UNIT_HOVER_SCALE = 1.08;

const HOVER_SPRING = { type: "spring" as const, stiffness: 380, damping: 28 };

export interface RackColumnLabel {
  line1: string;
  line2: string;
}

interface RackProps {
  rack: RackType;
  columnLabel?: RackColumnLabel;
}

/* ── component ──────────────────────────────────────────────────────── */

export function Rack({ rack, columnLabel }: RackProps) {
  const project = useHardwareProject();
  const {
    selectedRackId,
    selectRack,
    selectedUnitId,
    selectUnit,
    selectSubsystem,
  } = useSelection();
  const { isDeleted: isSubsystemDeleted } = useSubsystemEdits();
  const { unitsForRack, resetRack, hasPendingEdits } = useRackEdits();
  const { activeRackId, ghost, isDragging, consumeDragClick } = useRackDnd();

  /* Framed racks are drop targets whenever some rack is selected (a drag can
   * only start from a selected rack). */
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: rack.id,
    disabled: rack.kind === "standalone" || selectedRackId === null,
  });

  /* The rack body is a drag handle for reordering racks: press-hold to drag it
   * left/right, quick-click still selects. Nodes stop pointer propagation
   * (see `DraggableRackNode`) so pressing a node moves the node instead. */
  const {
    setNodeRef: setRackDragRef,
    listeners: rackDragListeners,
    attributes: rackDragAttributes,
    isDragging: isReordering,
  } = useDraggable({
    id: `rack:${rack.id}`,
    data: { type: "rack", rackId: rack.id },
    disabled: rack.kind === "standalone",
  });

  /* Effective members of THIS rack (after cross-rack moves), minus units of
   * deleted subsystems. */
  const placedUnits = useMemo(
    () =>
      unitsForRack(rack.id).filter(
        (p) => !isSubsystemDeleted(p.unit.subsystemId),
      ),
    [unitsForRack, rack.id, isSubsystemDeleted],
  );

  const isSelected = selectedRackId === rack.id;
  const isActive = activeRackId === rack.id;
  /* During a drag, emphasis is the hovered (active) rack ONLY: the source stays
   * focused on pickup until the pointer leaves it, then whichever rack the
   * pointer enters zooms in, and when the pointer is in the gap (no active rack)
   * EVERY rack dims to a "disabled" look. Idle, emphasis is the selection.
   * `selectedRackId` is untouched mid-drag so drag/drop gating stays stable —
   * focus is committed to the landing rack on settle. */
  const isFocused = isDragging ? isActive : isSelected;
  const dragInFlight = isDragging;

  let baseScale = 1;
  let baseOpacity = 1;
  if (isDragging) {
    baseScale = isActive ? RACK_SCALE_SELECTED : RACK_SCALE_FLANK;
    baseOpacity = isActive ? 1 : 0.4;
  } else if (isSelected) {
    baseScale = RACK_SCALE_SELECTED;
  } else if (selectedRackId !== null) {
    baseScale = RACK_SCALE_FLANK;
    baseOpacity = 0.45;
  } else if (rack.isEmpty) {
    baseOpacity = 0.7;
  }
  const isClickable = !rack.isEmpty;
  /* A non-focused rack while something else is focused (selected or being
   * dragged over) — used to fade its column label. */
  const isOther = !isFocused && (isDragging || selectedRackId !== null);

  /* ── click handlers ─────────────────────────────────────────────── */

  const handleRackClick = (e: MouseEvent) => {
    if (!isClickable) return;
    /* Swallow the stray click the browser fires right after a drag. */
    if (consumeDragClick()) {
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    if (!isSelected) {
      selectRack(rack.id);
      return;
    }
    if (selectedUnitId) {
      selectUnit(null);
    } else {
      selectRack(null);
    }
  };

  const handleUnitClick = (
    e: MouseEvent,
    unitId: string,
    subsystemId: string,
  ) => {
    /* A quick click navigates; a press-and-hold drags. Swallow the click that
     * fires right after a drag so dragging never navigates. */
    if (consumeDragClick()) {
      e.stopPropagation();
      return;
    }
    if (!isSelected) return;
    e.stopPropagation();
    const nextUnit = selectedUnitId === unitId ? null : unitId;
    selectUnit(nextUnit);
    selectSubsystem(nextUnit ? subsystemId : null);
  };

  /* ── render ─────────────────────────────────────────────────────── */

  return (
    <motion.div
      ref={setRackDragRef}
      layout
      onClick={handleRackClick}
      animate={{
        scale: isReordering ? baseScale * 1.05 : baseScale,
        opacity: baseOpacity,
        zIndex: isReordering ? 50 : 0,
      }}
      whileHover={
        isClickable && !isFocused && !dragInFlight && !isReordering
          ? { scale: baseScale * 1.04 }
          : undefined
      }
      transition={hardwareSpring}
      className={cn(
        "relative",
        rack.kind === "standalone"
          ? "cursor-default"
          : "cursor-grab active:cursor-grabbing",
        isReordering &&
          "cursor-grabbing drop-shadow-[0_10px_28px_rgba(0,0,0,0.35)]",
      )}
      {...rackDragListeners}
      {...rackDragAttributes}
    >
      {/* Column label */}
      {columnLabel ? (
        <div
          className={cn(
            "pointer-events-none absolute -top-[3.35rem] left-1/2 flex -translate-x-1/2 flex-col items-center gap-0.5 text-center text-white drop-shadow-sm transition-opacity",
            isOther && "opacity-50",
          )}
        >
          <span className="max-w-[14rem] text-[15px] font-semibold leading-snug">
            {columnLabel.line1}
          </span>
        </div>
      ) : null}

      {/* Reset — visible when this rack is selected, idle, and has edits */}
      <AnimatePresence>
        {isSelected && !dragInFlight && hasPendingEdits(rack.id) ? (
          <motion.div
            key="rack-chrome"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto absolute -top-5 right-0 flex items-center gap-1.5"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation();
                resetRack(rack.id);
              }}
              className="flex items-center text-white/60 hover:text-white"
              aria-label="Reset rack layout"
            >
              <RotateCcw className="size-3" />
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {rack.kind === "standalone" ? renderStandalone() : renderFramedRack()}
    </motion.div>
  );

  function renderFramedRack() {
    const showGhost = ghost?.rackId === rack.id;

    return (
      <div ref={setDroppableRef} data-rack-id={rack.id}>
        <RackFrame heightU={rack.heightU}>
          {/* Ghost landing slot */}
          {showGhost ? (
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute left-0 right-0 rounded-[2px] border transition-colors duration-100",
                ghost.valid
                  ? "border-white/50 bg-white/15"
                  : "border-red-400/70 bg-red-400/20",
              )}
              style={{
                top:
                  (rack.heightU - ghost.positionU - ghost.sizeU + 1) *
                  UNIT_HEIGHT_PX,
                height: ghost.sizeU * UNIT_HEIGHT_PX,
                zIndex: 25,
              }}
            />
          ) : null}

          {placedUnits.map(({ unit, positionU }) => {
            const subsystem = project.subsystems.find(
              (s) => s.id === unit.subsystemId,
            );
            if (!subsystem) return null;

            return (
              <DraggableRackNode
                key={unit.id}
                unit={unit}
                rackId={rack.id}
                positionU={positionU}
                heightU={rack.heightU}
                draggable={isSelected}
                imageUrl={CHASSIS_IMAGE_URLS[subsystem.chassis.image]}
                alt={subsystem.chassis.name}
              >
                {renderUnitBody(unit, subsystem.chassis.image, subsystem.chassis.name)}
              </DraggableRackNode>
            );
          })}
        </RackFrame>
      </div>
    );
  }

  function renderStandalone() {
    return (
      <div className="flex flex-col items-center gap-1">
        {placedUnits.map(({ unit }) => {
          const subsystem = project.subsystems.find(
            (s) => s.id === unit.subsystemId,
          );
          if (!subsystem) return null;
          return (
            <StandaloneNode key={unit.id} sizeU={unit.sizeU}>
              {renderUnitBody(unit, subsystem.chassis.image, subsystem.chassis.name)}
            </StandaloneNode>
          );
        })}
      </div>
    );
  }

  function renderUnitBody(unit: RackUnit, imageKey: string, alt: string) {
    const image = CHASSIS_IMAGE_URLS[imageKey];
    return (
      <motion.div
        onClick={(e) => handleUnitClick(e, unit.id, unit.subsystemId)}
        whileHover={isSelected ? { scale: UNIT_HOVER_SCALE } : undefined}
        transition={HOVER_SPRING}
        className={cn(
          "group relative h-full w-full origin-center",
          isSelected && "hover:z-10",
        )}
      >
        <img
          src={image}
          alt={alt}
          draggable={false}
          className="relative z-0 block h-full w-full object-fill"
        />
        {isSelected ? (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute z-10 box-border bg-transparent opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100",
              UNIT_HOVER_RING_INSET_X,
              UNIT_HOVER_RING_INSET_Y,
              UNIT_HOVER_RING_RADIUS,
              UNIT_HOVER_RING_BORDER,
            )}
          />
        ) : null}
      </motion.div>
    );
  }
}
