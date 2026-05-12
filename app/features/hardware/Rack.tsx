import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { hardwareProject } from "./fake-data";
import type { Rack as RackType } from "./types";
import rackFrameUrl from "~/assets/hardware/verstka/Server_BG.png";
import serverImg01 from "~/assets/hardware/verstka/Server_Dell_01.png";
import serverImg02 from "~/assets/hardware/verstka/Server_Dell_02.png";
import serverImg03 from "~/assets/hardware/verstka/Server_Dell_03.png";
import serverImg04 from "~/assets/hardware/verstka/Server_Dell_04.png";

const SERVER_IMAGES: Record<string, string> = {
  "Server_Dell_01.png": serverImg01,
  "Server_Dell_02.png": serverImg02,
  "Server_Dell_03.png": serverImg03,
  "Server_Dell_04.png": serverImg04,
};

/**
 * Aspect ratio + inset constants are derived from the actual `Server_BG.png`
 * (342×912). The container matches the image so `object-contain` no longer
 * letterboxes — that's what was making units spill out the top.
 *
 * Insets are measured against the FULL rack height. They cover the visual
 * top cap and the feet, leaving 42 RU of usable interior.
 */
const RACK_ASPECT = "342 / 912";
const TOP_INSET_PCT = 10;
const BOTTOM_INSET_PCT = 9;
const USABLE_PCT = 100 - TOP_INSET_PCT - BOTTOM_INSET_PCT;

interface RackProps {
  rack: RackType;
  /** Optional column header shown above the rack on Screen A. */
  columnLabel?: string;
}

export function Rack({ rack, columnLabel }: RackProps) {
  const project = hardwareProject;

  return (
    <div className="flex h-full flex-col items-center gap-3">
      {columnLabel ? (
        <span className="text-center text-[13px] font-semibold leading-tight text-white drop-shadow-sm">
          {columnLabel}
        </span>
      ) : (
        <span className="h-[13px]" />
      )}

      <motion.div
        whileHover={rack.isEmpty ? undefined : { scale: 1.03 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className={cn(
          "relative h-full cursor-pointer",
          rack.isEmpty && "cursor-default opacity-70",
        )}
        style={{ aspectRatio: RACK_ASPECT }}
      >
        <img
          src={rackFrameUrl}
          alt={rack.isEmpty ? "Empty rack" : rack.name}
          className="absolute inset-0 h-full w-full object-fill"
          draggable={false}
        />

        {/* Unit overlay band — the inside of the rack where servers live. */}
        <div
          className="absolute left-[7%] right-[7%]"
          style={{
            top: `${TOP_INSET_PCT}%`,
            bottom: `${BOTTOM_INSET_PCT}%`,
          }}
        >
          {rack.units.map((unit) => {
            const subsystem = project.subsystems.find(
              (s) => s.id === unit.subsystemId,
            );
            if (!subsystem) return null;

            /* Slot height as a % of the inner band (not the whole rack). */
            const slotHeight = 100 / rack.heightU;
            const heightPct = unit.sizeU * slotHeight;
            /* U numbering: U1 = bottom, U42 = top. positionU = bottom U. */
            const bottomPct = (unit.positionU - 1) * slotHeight;

            const image = SERVER_IMAGES[subsystem.chassis.image];

            return (
              <img
                key={unit.id}
                src={image}
                alt={subsystem.chassis.name}
                className="absolute left-0 right-0 object-fill"
                style={{
                  bottom: `${bottomPct}%`,
                  height: `${heightPct}%`,
                }}
                draggable={false}
              />
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
