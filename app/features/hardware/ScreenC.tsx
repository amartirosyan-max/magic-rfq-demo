import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Cpu,
  Flame,
  HardDrive,
  MemoryStick,
  Network,
  Plug,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";
import type {
  ComponentCategory,
  HardwareComponent,
  Subsystem,
} from "./types";
import serverImg01 from "~/assets/hardware/verstka/Server_Dell_01.png";
import serverImg02 from "~/assets/hardware/verstka/Server_Dell_02.png";
import serverImg03 from "~/assets/hardware/verstka/Server_Dell_03.png";
import serverImg04 from "~/assets/hardware/verstka/Server_Dell_04.png";

/** Chassis image filename → bundled URL. Mirrors `Rack.tsx`. */
const SERVER_IMAGES: Record<string, string> = {
  "Server_Dell_01.png": serverImg01,
  "Server_Dell_02.png": serverImg02,
  "Server_Dell_03.png": serverImg03,
  "Server_Dell_04.png": serverImg04,
};

/* Lucide icons for the five surviving component categories (cpu / memory /
 * storage / network / power). The mapping is intentionally simple so a
 * future swap to dedicated `Component_*.png` icons is a one-line change. */
const CATEGORY_ICON: Record<ComponentCategory, LucideIcon> = {
  cpu: Cpu,
  memory: MemoryStick,
  storage: HardDrive,
  network: Network,
  power: Plug,
};

/* Expected component icon files under `app/assets/hardware/verstka/`.
 * If a file doesn't exist yet, `ComponentIcon` falls back to a Lucide icon.
 * When you add real icons later, keep these names and no code change is needed.
 */
const CATEGORY_ICON_CANDIDATES: Record<ComponentCategory, string[]> = {
  cpu: [
    "/app/assets/hardware/PNG+SVG/Component_CPU.png",
    "/app/assets/hardware/PNG+SVG/Component_CPU.svg",
    "/app/assets/hardware/verstka/Component_CPU.png",
    "/app/assets/hardware/verstka/Component_CPU.svg",
  ],
  memory: [
    "/app/assets/hardware/PNG+SVG/Component_RAM.png",
    "/app/assets/hardware/PNG+SVG/Component_Memory.png",
    "/app/assets/hardware/PNG+SVG/Component_Memory.svg",
    "/app/assets/hardware/verstka/Component_Memory.png",
    "/app/assets/hardware/verstka/Component_Memory.svg",
  ],
  storage: [
    "/app/assets/hardware/PNG+SVG/Component_HDD.png",
    "/app/assets/hardware/PNG+SVG/Component_SSD.png",
    "/app/assets/hardware/PNG+SVG/Component_Storage.png",
    "/app/assets/hardware/PNG+SVG/Component_Storage.svg",
    "/app/assets/hardware/verstka/Component_Storage.png",
    "/app/assets/hardware/verstka/Component_Storage.svg",
  ],
  network: [
    "/app/assets/hardware/PNG+SVG/Component_Network.png",
    "/app/assets/hardware/PNG+SVG/Component_Network.svg",
    "/app/assets/hardware/verstka/Component_Network.png",
    "/app/assets/hardware/verstka/Component_Network.svg",
  ],
  power: [
    "/app/assets/hardware/PNG+SVG/Component_Power.png",
    "/app/assets/hardware/PNG+SVG/Component_Power.svg",
    "/app/assets/hardware/verstka/Component_Power.png",
    "/app/assets/hardware/verstka/Component_Power.svg",
  ],
};

export interface ScreenCProps {
  subsystem: Subsystem;
}

/**
 * Screen C — cluster component view.
 *
 * Layout (vertical):
 *   ┌──────────────────────────────────────────────┐
 *   │ 14 × Dell PowerEdge R660 Hyper-v Cluster     │   ◀── page title
 *   │                                              │
 *   │ [ component card #1 ]                        │   ◀── components list
 *   │ [ component card #2 ]                        │      (stagger-anim UP
 *   │   …                                          │       from under the
 *   │                                              │       chassis hero)
 *   │ ┌────────────┐  ┌─────────────────────────┐  │
 *   │ │ chassis img│  │ Title                   │  │   ◀── chassis hero
 *   │ │ (no bg)    │  │ Description …           │  │      (slides up from
 *   │ │            │  │ ⚡ Ws  🔥 BTU/hr        │  │       below; image has
 *   │ └────────────┘  └─────────────────────────┘  │       no plate)
 *   └──────────────────────────────────────────────┘
 *
 * The inner parts (CPU / RAM / SSD / NIC / PSU) animate as if they pop
 * out of the chassis at the bottom.
 *
 * Exit Screen C via breadcrumb (`Project` / project name) or left sidebar —
 * empty blueprint clicks do not leave this view.
 */
export function ScreenC({ subsystem }: ScreenCProps) {
  const chassisImg = SERVER_IMAGES[subsystem.chassis.image];

  return (
    <motion.div
      key={`screen-c-${subsystem.id}`}
      className="relative z-0 flex flex-1 flex-col gap-4 px-12 pb-12 pt-32"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* === Page title ========================================= */}
      <PageTitle subsystem={subsystem} />

      {/* === Component cards =====================================
          Rendered ABOVE the chassis hero in DOM order but animated
          IN from below it (initial y > 0). With staggered delays
          they cascade upward, reading as "popping out" of the
          chassis sitting at the bottom. */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-28">
        {subsystem.components.length === 0 ? (
          <EmptyState />
        ) : (
          subsystem.components.map((component, idx) => (
            <ComponentCard
              key={component.id}
              component={component}
              index={idx}
            />
          ))
        )}
      </div>

      {/* === Chassis hero ======================================== */}
      <ChassisHero subsystem={subsystem} chassisImg={chassisImg} />
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PageTitle — "14 × Dell PowerEdge R660 Hyper-v Cluster"                    */
/* -------------------------------------------------------------------------- */

function PageTitle({ subsystem }: { subsystem: Subsystem }) {
  return (
    <motion.div
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -16, opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex shrink-0 items-baseline gap-3 px-1 text-white drop-shadow-sm"
    >
      <span className="text-[26px] font-bold leading-none tracking-tight">
        {subsystem.qty} × {subsystem.chassis.name}
      </span>
      <span className="text-[16px] font-medium text-white/85">
        {subsystem.titleSuffix}
      </span>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ComponentCard — light card with dark icon strip + qty pill                */
/* -------------------------------------------------------------------------- */

function ComponentCard({
  component,
  index,
}: {
  component: HardwareComponent;
  index: number;
}) {
  const Icon = CATEGORY_ICON[component.category];
  /* All cards should emerge from the same lower origin area (under the
   * main chassis block), not from the list center. Keep one constant
   * starting Y for every row. */
  const enterFromY = 520;
  return (
    <motion.div
      initial={{ y: enterFromY, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: enterFromY, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 26,
        /* Stagger: hero gets 0ms, cards follow at ~70ms each.
         * The +0.18s base offset lets the hero settle first so it
         * really looks like the parts are emerging out of it. */
        delay: 0.18 + index * 0.07,
      }}
      className="flex w-full items-stretch gap-3"
    >
      {/* Icon sits OUTSIDE the white card, as in the reference UI. */}
      <div className="flex w-[52px] shrink-0 items-center justify-center">
        <ComponentIcon
          category={component.category}
          fallbackIcon={Icon}
          alt={component.categoryLabel}
        />
      </div>

      {/* White card: count + divider + title/description. */}
      <div
        className={cn(
          "flex min-h-[62px] flex-1 items-center rounded-[5px] bg-white px-2.5 py-2.5",
          "shadow-[0_1px_2px_rgba(15,23,42,0.06),0_3px_10px_rgba(15,23,42,0.08)]",
        )}
      >
        {/* Count has no background. */}
        <div className="flex h-full min-w-[58px] items-center justify-center pr-3 text-[34px] font-bold leading-none text-slate-900">
          <span className="text-[20px] tabular-nums">{component.qty}</span>
          <span className="ml-2 text-[15px] font-semibold text-slate-400">x</span>
        </div>

        {/* Title + description with a gray column divider beside count. */}
        <div className="flex min-w-0 flex-1 flex-col justify-center border-l border-slate-200 pl-4 pr-3">
          <div className="text-[16px] font-semibold leading-tight text-slate-900">
          {component.categoryLabel}
          </div>
          <div className="mt-0.5 whitespace-normal break-words text-[14px] leading-snug text-slate-700">
            {component.description}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ComponentIcon({
  category,
  fallbackIcon: FallbackIcon,
  alt,
}: {
  category: ComponentCategory;
  fallbackIcon: LucideIcon;
  alt: string;
}) {
  const candidates = CATEGORY_ICON_CANDIDATES[category];
  const [idx, setIdx] = useState(0);
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback || !candidates[idx]) {
    return (
      <div className="grid h-[46px] w-[46px] place-items-center rounded-[3px] border border-white/30 bg-slate-700/75 text-white shadow-sm">
        <FallbackIcon className="h-5 w-5" />
      </div>
    );
  }

  return (
    <img
      src={candidates[idx]}
      alt={alt}
      draggable={false}
      className="h-[46px] w-[46px] rounded-[3px] object-contain"
      onError={() => {
        if (idx < candidates.length - 1) {
          setIdx((v) => v + 1);
        } else {
          setUseFallback(true);
        }
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  ChassisHero — image floats on the blueprint, description is a card        */
/* -------------------------------------------------------------------------- */

function ChassisHero({
  subsystem,
  chassisImg,
}: {
  subsystem: Subsystem;
  chassisImg: string | undefined;
}) {
  const watts = subsystem.chassis.watts;
  /* Computed inline so the chassis data stays the source of truth — no
   * stale numbers to keep in sync when we tweak `watts`. */
  const btu = watts ? Math.round(watts * 3.412 * 10) / 10 : undefined;

  return (
    <motion.div
      initial={{ y: 220, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 220, opacity: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
      className="flex shrink-0 items-start gap-5"
    >
      {/* Chassis image — sits DIRECTLY on the blueprint (no card behind
          it). Width is fixed-ish so the description card can fill the
          remaining space. */}
      {chassisImg ? (
        <img
          src={chassisImg}
          alt={subsystem.chassis.name}
          draggable={false}
          className="h-auto w-[300px] shrink-0 object-contain drop-shadow-lg"
        />
      ) : null}

      {/* Description card — white card with title, description, and the
          power/heat badges at the bottom. */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-2 rounded-md bg-white/95 px-5 py-4",
          "shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_14px_rgba(15,23,42,0.10)]",
          "ring-1 ring-slate-200/80",
        )}
      >
        <h2 className="text-[16px] font-semibold leading-tight text-slate-900">
          {subsystem.chassis.name}
        </h2>
        <p className="text-[12px] leading-snug text-slate-600">
          {subsystem.chassis.description}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {watts !== undefined ? (
            <Badge icon={Zap}>
              <span className="font-semibold tabular-nums">{watts}</span>
              <span className="ml-1 text-slate-500">Watts</span>
            </Badge>
          ) : null}
          {btu !== undefined ? (
            <Badge icon={Flame}>
              <span className="font-semibold tabular-nums">{btu}</span>
              <span className="ml-1 text-slate-500">BTU/hr</span>
            </Badge>
          ) : null}
          <span className="ml-1 text-[12px] text-slate-500">
            {subsystem.chassis.sizeU}U · {subsystem.chassis.vendor}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function Badge({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[12px] text-slate-700 ring-1 ring-slate-200">
      <Icon className="h-3.5 w-3.5 text-slate-500" />
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  EmptyState — shown for subsystems without component rows (switches)        */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <motion.div
      initial={{ y: 240, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 240, opacity: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26, delay: 0.18 }}
      className="rounded-md bg-white/90 px-5 py-6 text-center text-[13px] text-slate-500 ring-1 ring-slate-200"
    >
      No serviceable parts in this proposal — switches are sold as a single
      unit.
    </motion.div>
  );
}
