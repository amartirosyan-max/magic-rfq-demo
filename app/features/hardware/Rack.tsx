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
 * The rack frame image (`Server_BG.png`) has visual margins above
 * (top cap) and below (feet). The 42 RU slots only span the inner band,
 * so we inset the unit area as a percentage of the total height.
 *
 * Tune these two constants visually if the assets need finer fit.
 */
const TOP_INSET_PCT = 5;
const BOTTOM_INSET_PCT = 8;
const USABLE_PCT = 100 - TOP_INSET_PCT - BOTTOM_INSET_PCT;

interface RackProps {
  rack: RackType;
  /** Optional column header shown above the rack on Screen A. */
  columnLabel?: string;
}

export function Rack({ rack, columnLabel }: RackProps) {
  const project = hardwareProject;

  return (
    <div className="flex flex-col items-center gap-3">
      {columnLabel ? (
        <span className="text-center text-sm font-semibold leading-tight text-white drop-shadow-sm">
          {columnLabel}
        </span>
      ) : null}

      <motion.div
        whileHover={rack.isEmpty ? undefined : { scale: 1.03 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className={cn(
          "relative w-[140px] cursor-pointer",
          rack.isEmpty && "cursor-default opacity-60",
        )}
        style={{ aspectRatio: "140 / 480" }}
      >
        <img
          src={rackFrameUrl}
          alt={rack.isEmpty ? "Empty rack" : rack.name}
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />

        {/* Unit overlay band — the area where servers actually live */}
        <div
          className="absolute left-[10%] right-[10%]"
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

            const slotHeight = USABLE_PCT / rack.heightU;
            const heightPct = unit.sizeU * slotHeight;
            // U numbering: U1 is bottom, U42 is top. positionU = bottom U of this unit.
            const bottomPct = (unit.positionU - 1) * slotHeight;

            const image = SERVER_IMAGES[subsystem.chassis.image];

            return (
              <img
                key={unit.id}
                src={image}
                alt={subsystem.chassis.name}
                className="absolute left-0 right-0 object-cover"
                style={{
                  bottom: `${bottomPct * (100 / USABLE_PCT)}%`,
                  height: `${heightPct * (100 / USABLE_PCT)}%`,
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
