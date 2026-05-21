import { useMemo, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { useHardwareProject } from "./HardwareProjectContext";
import { useSelection } from "./SelectionContext";
import { useSubsystemEdits } from "./SubsystemEditsContext";
import type { Rack as RackType, RackUnit } from "./types";
/* Shared filename → URL map for every chassis image used by the demo. */
import { CHASSIS_IMAGE_URLS } from "~/features/hardware/chassis-assets";
import {
  hardwareSpring,
  RACK_SCALE_FLANK,
  RACK_SCALE_SELECTED,
} from "./motion";
import { RackFrame, RackNode, StandaloneNode } from "./rack-constructor";

/* ============================================================
 *  RACK UNIT — HOVER STYLES   ← edit these to tweak the look
 * ------------------------------------------------------------
 *  Hover visuals for a unit *inside an already-selected rack*.
 *
 *  The hover frame is an outer border that sits on top and scales
 *  with the chassis so it stays visible when UNIT_HOVER_SCALE bumps.
 *  Negative inset values make the frame stick out past the slot edges.
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

export interface RackColumnLabel {
  /** First line (e.g. subsystem / role name). */
  line1: string;
  /** Second line — rack id, e.g. "RACK 01". */
  line2: string;
}

interface RackProps {
  rack: RackType;
  /** Optional two-line column header above the rack on Screen A. */
  columnLabel?: RackColumnLabel;
}

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

  /* Units whose parent subsystem was removed from the project disappear
   * from the canvas — this keeps the racks visually consistent with the
   * left-sidebar nav and the catalog. Restored subsystems re-populate
   * automatically because `useSubsystemEdits` is reactive. */
  const visibleUnits = useMemo<RackUnit[]>(
    () => rack.units.filter((u) => !isSubsystemDeleted(u.subsystemId)),
    [rack.units, isSubsystemDeleted],
  );

  const hasSelection = selectedRackId !== null;
  const isSelected = selectedRackId === rack.id;
  const isOther = hasSelection && !isSelected;

  /* Scale + opacity logic:
   *   • no selection      → all racks at 1.0 (non-empty hover bumps)
   *   • selected rack     → 1.15  (centre stage)
   *   • non-selected racks → 0.75 + 50% opacity (carousel flanks)
   *   • empty racks       → always 70% opacity in overview mode
   */
  const baseScale = isSelected
    ? RACK_SCALE_SELECTED
    : isOther
      ? RACK_SCALE_FLANK
      : 1;
  const baseOpacity = isOther ? 0.45 : rack.isEmpty && !hasSelection ? 0.7 : 1;

  const isClickable = !rack.isEmpty;

  /* Click priority inside a selected rack:
   *   1. click on a unit          → toggle that unit's selection
   *   2. click on rack background → clear unit selection if any
   *   3. otherwise (no unit set)  → deselect the rack
   * In overview mode (rack not yet selected) any click promotes the
   * rack to "selected".
   *
   * We stop propagation for *interactive* (non-empty) racks so the
   * canvas-level "click outside any rack → deselect" handler (in
   * ScreenA.tsx) doesn't immediately undo the selection we just made.
   * Empty/decorative racks intentionally do not stop propagation —
   * clicking on them behaves like clicking on blank canvas. */
  const handleRackClick = (e: MouseEvent) => {
    if (!isClickable) return;
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
    if (!isSelected) return;
    e.stopPropagation();
    const nextUnit = selectedUnitId === unitId ? null : unitId;
    selectUnit(nextUnit);
    /* Keep left sidebar in sync with rack-level unit selection so the
     * corresponding subsystem row becomes selected too. */
    selectSubsystem(nextUnit ? subsystemId : null);
  };

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
      {/* Title — absolutely positioned above the rack frame and inside the
          scaled motion.div so it tracks the rack's visual top at every
          scale (1.15 selected, 0.75 flanking, 1.0 idle). */}
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
          {/* <span className="text-[18px] font-bold leading-none tracking-wide">
            {columnLabel.line2}
          </span> */}
        </div>
      ) : null}

      {rack.kind === "standalone"
        ? renderStandalone()
        : renderFramedRack()}
    </motion.div>
  );

  /**
   * Framed-rack body: top SVG + N × slot + bottom SVG, with each unit
   * absolute-positioned by `(positionU, sizeU)`. Empty/decorative racks
   * still hit this path — they just render no `<RackNode>` children.
   */
  function renderFramedRack() {
    return (
      <RackFrame heightU={rack.heightU}>
        {visibleUnits.map((unit) => {
          const subsystem = project.subsystems.find(
            (s) => s.id === unit.subsystemId,
          );
          if (!subsystem) return null;
          return (
            <RackNode
              key={unit.id}
              positionU={unit.positionU}
              sizeU={unit.sizeU}
              heightU={rack.heightU}
            >
              {renderUnitBody(unit, subsystem.chassis.image, subsystem.chassis.name)}
            </RackNode>
          );
        })}
      </RackFrame>
    );
  }

  /**
   * Standalone-rack body: a single bare chassis at its own intrinsic
   * size, no frame, no rails. Multiple units in a standalone rack
   * stack vertically in the order they appear in `visibleUnits` — the
   * primary use case is exactly one solo node, but the implementation
   * doesn't enforce a hard cardinality.
   */
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

  /**
   * Inner click/hover/image body shared by framed and standalone racks.
   * Kept identical across paths so the hover-ring + selection-bump
   * tokens at the top of this file apply uniformly.
   */
  function renderUnitBody(unit: RackUnit, imageKey: string, alt: string) {
    const image = CHASSIS_IMAGE_URLS[imageKey];
    return (
      <motion.div
        onClick={(e) => handleUnitClick(e, unit.id, unit.subsystemId)}
        whileHover={isSelected ? { scale: UNIT_HOVER_SCALE } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className={cn(
          "group relative h-full w-full origin-center",
          isSelected && "cursor-pointer hover:z-10",
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
