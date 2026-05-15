import { useMemo, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { useHardwareProject } from "./HardwareProjectContext";
import { useSelection } from "./SelectionContext";
import { useSubsystemEdits } from "./SubsystemEditsContext";
import type { Rack as RackType, RackUnit } from "./types";
import rackFrameUrl from "~/assets/hardware/verstka/Server_BG.png";
/* Shared filename → URL map for every chassis image used by the demo. */
import { CHASSIS_IMAGE_URLS } from "~/features/hardware/chassis-assets";

/**
 * Aspect ratio + inset constants are derived from the actual `Server_BG.png`
 * file (342×912 px). The constants below describe the interior slot region
 * inside the rack frame — the bounding box where rack units actually live:
 *
 *   ┌──────────────────┐   ◀── 342 px wide
 *   │   ╭──top cap──╮  │   ◀──  40 px top cap (≈ 4.4 %)
 *   │   │  42 U …   │  │
 *   │   │  …        │  │   ◀── 825 px usable interior (42 U slots)
 *   │   │  …  1 U   │  │
 *   │   ╰──feet─────╯  │   ◀──  47 px bottom feet (≈ 5.2 %)
 *   └──────────────────┘
 *      ▲             ▲
 *   22 px         22 px  ◀── side rails (≈ 6.5 %)
 *
 * The unit overlay box (`<div>` below) is sized to that interior, and every
 * rack unit `<img>` inside it stretches the full width (`left-0 right-0` +
 * `object-fill`) — 1 U = (100 / heightU) % of the inner box height.
 */
const RACK_ASPECT = "342 / 912";
const TOP_INSET_PCT = 4.4;
const BOTTOM_INSET_PCT = 7.2;
const LEFT_SIDE_INSET_PCT = 18.5;
const RIGHT_SIDE_INSET_PCT = 19.8;

/* ============================================================
 *  RACK UNIT — HOVER STYLES   ← edit these to tweak the look
 * ------------------------------------------------------------
 *  Hover visuals for a unit *inside an already-selected rack*.
 *
 *  Implementation note: the "outline" is rendered as a thin
 *  coloured plate BEHIND the unit image, so each side can have
 *  its own thickness (different on left/right vs top/bottom).
 *  A uniform CSS `outline` / `ring` can't do that.
 *
 *    UNIT_HOVER_RING_INSET_X – how far the plate sticks out on
 *                              the LEFT and RIGHT sides
 *                              (`-inset-x-[Npx]` — bigger N =
 *                              thicker horizontal stroke).
 *    UNIT_HOVER_RING_INSET_Y – how far it sticks out on TOP and
 *                              BOTTOM (`-inset-y-[Npx]`).
 *    UNIT_HOVER_RING_RADIUS  – corner radius on the plate.
 *    UNIT_HOVER_RING_COLOR   – plate colour (any Tailwind `bg-*`
 *                              utility, e.g. `bg-white`,
 *                              `bg-sky-400`, …).
 *    UNIT_HOVER_SCALE        – framer-motion scale multiplier
 *                              for the smooth hover bump
 *                              (set to `1` to disable the bump).
 * ============================================================ */
const UNIT_HOVER_RING_INSET_X = "-inset-x-[5px]";
const UNIT_HOVER_RING_INSET_Y = "-inset-y-[2px]";
const UNIT_HOVER_RING_RADIUS = "rounded-[5px]";
const UNIT_HOVER_RING_COLOR = "bg-white";
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
  const baseScale = isSelected ? 1.15 : isOther ? 0.75 : 1;
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
    // Only meaningful inside a selected rack; otherwise let the click
    // bubble up so the rack itself gets selected first.
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
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className={cn(
        "relative h-full",
        isClickable ? "cursor-pointer" : "cursor-default",
      )}
      style={{ aspectRatio: RACK_ASPECT }}
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

      <img
        src={rackFrameUrl}
        alt={rack.isEmpty ? "Empty rack" : rack.name}
        className="absolute inset-0 h-full w-full object-fill"
        draggable={false}
      />

      {/* Interior slot region — sized to the actual usable inside of the
          rack frame. Each unit is positioned ABSOLUTELY by its `positionU`
          inside this box, so `positionU` in `fake-data.ts` is the single
          source of truth for vertical placement. The interior holds
          `rack.heightU` slots (42 for v1); 1 U = (100 / heightU)%.
          U-numbering convention: U1 = bottom-most slot, U42 = top-most. */}
      <div
        className="absolute"
        style={{
          top: `${TOP_INSET_PCT}%`,
          bottom: `${BOTTOM_INSET_PCT}%`,
          left: `${LEFT_SIDE_INSET_PCT}%`,
          right: `${RIGHT_SIDE_INSET_PCT}%`,
        }}
      >
        {visibleUnits.map((unit) => {
          const subsystem = project.subsystems.find(
            (s) => s.id === unit.subsystemId,
          );
          if (!subsystem) return null;

          const image = CHASSIS_IMAGE_URLS[subsystem.chassis.image];

          /* Convert (positionU, sizeU) → CSS top/height percentages of the
           * interior box. A `sizeU`-tall unit anchored at the bottom edge
           * of U=`positionU` occupies U=positionU .. U=positionU+sizeU-1. */
          const topU = unit.positionU + unit.sizeU - 1;
          const topPct = ((rack.heightU - topU) / rack.heightU) * 100;
          const heightPct = (unit.sizeU / rack.heightU) * 100;

          /* Hover visuals (ring + scale) are only enabled when the parent
           * rack is selected — otherwise the racks are too small in
           * carousel view for per-unit hover feedback to read well. Click
           * still updates `selectedUnitId` in the context (drives Screen
           * C / detail). The wrapper is `group` so the inner ring plate
           * listens to `group-hover:` and fades in. */
          return (
            <motion.div
              key={unit.id}
              onClick={(e) => handleUnitClick(e, unit.id, unit.subsystemId)}
              whileHover={
                isSelected ? { scale: UNIT_HOVER_SCALE } : undefined
              }
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              style={{
                top: `${topPct}%`,
                height: `${heightPct}%`,
              }}
              className={cn(
                "group absolute left-0 right-0 origin-center",
                isSelected && "cursor-pointer hover:z-10",
              )}
            >
              {/* Hover "ring" — coloured plate behind the image. Edit the
                  UNIT_HOVER_RING_* constants near the top of this file. */}
              {isSelected ? (
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100",
                    UNIT_HOVER_RING_INSET_X,
                    UNIT_HOVER_RING_INSET_Y,
                    UNIT_HOVER_RING_RADIUS,
                    UNIT_HOVER_RING_COLOR,
                  )}
                />
              ) : null}

              <img
                src={image}
                alt={subsystem.chassis.name}
                draggable={false}
                className="relative block h-full w-full object-fill"
              />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
