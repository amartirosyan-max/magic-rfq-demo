import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, RotateCcw, X } from "lucide-react";
import { cn } from "~/lib/utils";
import { useHardwareProject } from "./HardwareProjectContext";
import { useSelection } from "./SelectionContext";
import { useSubsystemEdits } from "./SubsystemEditsContext";
import { useRackEdits } from "./RackEditsContext";
import type { Rack as RackType, RackUnit } from "./types";
import { CHASSIS_IMAGE_URLS } from "~/features/hardware/chassis-assets";
import {
  hardwareSpring,
  RACK_SCALE_FLANK,
  RACK_SCALE_SELECTED,
} from "./motion";
import { UNIT_HEIGHT_PX } from "./config";
import { RackFrame, RackNode, StandaloneNode } from "./rack-constructor";

/* ============================================================
 *  RACK UNIT — HOVER STYLES
 * ------------------------------------------------------------
 *  Active only in normal (non-edit) mode when the rack is selected.
 *
 *    UNIT_HOVER_RING_INSET_X – horizontal stick-out (-inset-x-[Npx])
 *    UNIT_HOVER_RING_INSET_Y – top/bottom stick-out (-inset-y-[Npx])
 *    UNIT_HOVER_RING_RADIUS  – corner radius on the ring
 *    UNIT_HOVER_RING_BORDER  – Tailwind border classes for the ring
 *    UNIT_HOVER_SCALE        – scale multiplier (1 = no bump)
 * ============================================================ */
const UNIT_HOVER_RING_INSET_X = "-inset-x-[5px]";
const UNIT_HOVER_RING_INSET_Y = "-inset-y-[2px]";
const UNIT_HOVER_RING_RADIUS = "rounded-[5px]";
const UNIT_HOVER_RING_BORDER = "border-2 border-white";
const UNIT_HOVER_SCALE = 1.08;

const SNAP_SPRING = { type: "spring" as const, stiffness: 380, damping: 28 };

export interface RackColumnLabel {
  line1: string;
  line2: string;
}

interface RackProps {
  rack: RackType;
  columnLabel?: RackColumnLabel;
}

/* ── snap & collision helpers ───────────────────────────────────────── */

function snapPositionU(
  positionU: number,
  sizeU: number,
  heightU: number,
  offsetY: number,
): number {
  const topInSlotColumn = (heightU - positionU - sizeU + 1) * UNIT_HEIGHT_PX;
  const draggedTopY = topInSlotColumn + offsetY;
  const rawRow = Math.round(draggedTopY / UNIT_HEIGHT_PX);
  const unclamped = heightU - rawRow - sizeU + 1;
  return Math.max(1, Math.min(heightU - sizeU + 1, unclamped));
}

function isSlotOccupied(
  targetPositionU: number,
  targetSizeU: number,
  units: RackUnit[],
  excludeId: string,
  getPos: (unitId: string, original: number) => number,
): boolean {
  const lo = targetPositionU;
  const hi = targetPositionU + targetSizeU - 1;
  for (const u of units) {
    if (u.id === excludeId) continue;
    const uLo = getPos(u.id, u.positionU);
    const uHi = uLo + u.sizeU - 1;
    if (lo <= uHi && hi >= uLo) return true;
  }
  return false;
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
  const { getPositionU, moveUnit, resetRack, hasPendingEdits } = useRackEdits();

  const slotColumnRef = useRef<HTMLDivElement>(null);

  /* Edit mode — when true nodes are draggable and click doesn't navigate */
  const [isEditMode, setIsEditMode] = useState(false);

  /* Ghost landing slot */
  const [ghost, setGhost] = useState<{
    positionU: number;
    sizeU: number;
    valid: boolean;
  } | null>(null);

  const visibleUnits = useMemo<RackUnit[]>(
    () => rack.units.filter((u) => !isSubsystemDeleted(u.subsystemId)),
    [rack.units, isSubsystemDeleted],
  );

  const hasSelection = selectedRackId !== null;
  const isSelected = selectedRackId === rack.id;
  const isOther = hasSelection && !isSelected;

  /* Exit edit mode whenever this rack loses selection */
  useEffect(() => {
    if (!isSelected) setIsEditMode(false);
  }, [isSelected]);

  const baseScale = isSelected
    ? RACK_SCALE_SELECTED
    : isOther
      ? RACK_SCALE_FLANK
      : 1;
  const baseOpacity = isOther ? 0.45 : rack.isEmpty && !hasSelection ? 0.7 : 1;
  const isClickable = !rack.isEmpty;

  /* ── click handlers ─────────────────────────────────────────────── */

  const handleRackClick = (e: MouseEvent) => {
    if (!isClickable) return;
    e.stopPropagation();
    if (!isSelected) {
      selectRack(rack.id);
      return;
    }
    /* In edit mode background click does nothing special */
    if (isEditMode) return;
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
    /* In edit mode the whole node is a drag target; clicks don't navigate */
    if (isEditMode) return;
    if (!isSelected) return;
    e.stopPropagation();
    const nextUnit = selectedUnitId === unitId ? null : unitId;
    selectUnit(nextUnit);
    selectSubsystem(nextUnit ? subsystemId : null);
  };

  /* ── drag callbacks ─────────────────────────────────────────────── */

  const handleDragY = useCallback(
    (unit: RackUnit, effectivePos: number, offsetY: number) => {
      const snapped = snapPositionU(
        effectivePos,
        unit.sizeU,
        rack.heightU,
        offsetY,
      );
      const valid = !isSlotOccupied(
        snapped,
        unit.sizeU,
        visibleUnits,
        unit.id,
        (uid, orig) => getPositionU(rack.id, uid, orig),
      );
      setGhost({ positionU: snapped, sizeU: unit.sizeU, valid });
    },
    [rack.heightU, rack.id, visibleUnits, getPositionU],
  );

  const handleDropY = useCallback(
    (unit: RackUnit, effectivePos: number, offsetY: number) => {
      const snapped = snapPositionU(
        effectivePos,
        unit.sizeU,
        rack.heightU,
        offsetY,
      );
      const occupied = isSlotOccupied(
        snapped,
        unit.sizeU,
        visibleUnits,
        unit.id,
        (uid, orig) => getPositionU(rack.id, uid, orig),
      );

      if (!occupied && snapped !== effectivePos) {
        moveUnit(rack.id, unit.id, snapped);
      }

      if (occupied) {
        /* Red flash for 220ms so the user sees the rejection, then clear. */
        setGhost((g) => (g ? { ...g, valid: false } : null));
        window.setTimeout(() => setGhost(null), 220);
      } else {
        setGhost(null);
      }
    },
    [rack.heightU, rack.id, visibleUnits, getPositionU, moveUnit],
  );

  const animateYForUnit = useCallback(
    (unit: RackUnit): number => {
      const effective = getPositionU(rack.id, unit.id, unit.positionU);
      return (unit.positionU - effective) * UNIT_HEIGHT_PX;
    },
    [rack.id, getPositionU],
  );

  /* ── render ─────────────────────────────────────────────────────── */

  return (
    <motion.div
      layout
      onClick={handleRackClick}
      animate={{ scale: baseScale, opacity: baseOpacity }}
      whileHover={
        isClickable && !isSelected ? { scale: baseScale * 1.04 } : undefined
      }
      transition={hardwareSpring}
      className={cn(
        "relative",
        isClickable ? "cursor-pointer" : "cursor-default",
      )}
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

      {/* Rack chrome buttons — visible when this rack is selected */}
      <AnimatePresence>
        {isSelected ? (
          <motion.div
            key="rack-chrome"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto absolute -top-5 right-0 flex items-center gap-1.5"
          >
            {/* Reset — only when edits exist */}
            {hasPendingEdits(rack.id) ? (
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
            ) : null}

            {/* Edit / Done toggle */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditMode((v) => !v);
              }}
              className={cn(
                "flex items-center transition-colors",
                isEditMode
                  ? "text-white"
                  : "text-white/60 hover:text-white",
              )}
              aria-label={isEditMode ? "Done editing" : "Edit node positions"}
            >
              {isEditMode ? (
                <X className="size-3.5" />
              ) : (
                <Pencil className="size-3" />
              )}
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {rack.kind === "standalone" ? renderStandalone() : renderFramedRack()}
    </motion.div>
  );

  function renderFramedRack() {
    return (
      <RackFrame heightU={rack.heightU} slotColumnRef={slotColumnRef}>
        {/* Ghost landing slot */}
        {isEditMode && ghost ? (
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

        {visibleUnits.map((unit) => {
          const subsystem = project.subsystems.find(
            (s) => s.id === unit.subsystemId,
          );
          if (!subsystem) return null;

          const effectivePos = getPositionU(rack.id, unit.id, unit.positionU);

          return (
            <RackNode
              key={unit.id}
              positionU={unit.positionU}
              sizeU={unit.sizeU}
              heightU={rack.heightU}
              draggable={isEditMode}
              dragConstraintsRef={slotColumnRef}
              onDragY={(offsetY) => handleDragY(unit, effectivePos, offsetY)}
              onDropY={(offsetY) => handleDropY(unit, effectivePos, offsetY)}
              animateY={animateYForUnit(unit)}
            >
              {renderUnitBody(unit, subsystem.chassis.image, subsystem.chassis.name)}
            </RackNode>
          );
        })}
      </RackFrame>
    );
  }

  function renderStandalone() {
    return (
      <div className="flex flex-col items-center gap-1">
        {visibleUnits.map((unit) => {
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
        whileHover={
          isSelected && !isEditMode ? { scale: UNIT_HOVER_SCALE } : undefined
        }
        transition={SNAP_SPRING}
        className={cn(
          "group relative h-full w-full origin-center",
          isSelected && !isEditMode && "cursor-pointer hover:z-10",
          isEditMode && "cursor-inherit",
        )}
      >
        <img
          src={image}
          alt={alt}
          draggable={false}
          className="relative z-0 block h-full w-full object-fill"
        />
        {isSelected && !isEditMode ? (
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
