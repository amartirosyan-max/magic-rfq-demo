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
import { useComponentEdits } from "./ComponentEditsContext";
import { useSelection } from "./SelectionContext";
import type {
  ComponentCategory,
  HardwareComponent,
  Subsystem,
} from "./types";
/* Real product photos shipped with the demo. Filenames mirror the
 * vendor SKU so it's obvious which image belongs to which chassis at
 * a glance. */
import productR660 from "~/assets/hardware/products/Dell-PowerEdge-R660.png";
import productR760 from "~/assets/hardware/products/Dell-PowerEdge-R760.png";
import productUnity380F from "~/assets/hardware/products/DELL-UNITY-XT-380F.png";
import productDS6610B from "~/assets/hardware/products/Dell-Connectrix-DS-6610B.png";
import productS5224F from "~/assets/hardware/products/Dell-EMC-S5224F-ON.png";
import productN3248 from "~/assets/hardware/products/Dell-EMC-N3248TE-ON.png";
/* Component row icons — MUST be static imports so Vite rewrites URLs in
 * production builds. String paths like `/app/assets/...` are not emitted
 * to `dist` and always 404 after `npm run build`. */
import componentCpuPng from "~/assets/hardware/PNG+SVG/Component_CPU.png";
import componentHddPng from "~/assets/hardware/PNG+SVG/Component_HDD.png";
import componentNetworkPng from "~/assets/hardware/PNG+SVG/Component_Network.png";
import componentPowerPng from "~/assets/hardware/PNG+SVG/Component_Power.png";
import componentRamPng from "~/assets/hardware/PNG+SVG/Component_RAM.png";
import componentCpuVerstka from "~/assets/hardware/verstka/Component_CPU.png";
import componentHddVerstka from "~/assets/hardware/verstka/Component_HDD.png";
import componentNetworkVerstka from "~/assets/hardware/verstka/Component_Network.png";
import componentPowerVerstka from "~/assets/hardware/verstka/Component_Power.png";
import componentRamVerstka from "~/assets/hardware/verstka/Component_RAM.png";

/** Chassis image filename → bundled URL. Mirrors `Rack.tsx`. */
const SERVER_IMAGES: Record<string, string> = {
  "Dell-PowerEdge-R660.png": productR660,
  "Dell-PowerEdge-R760.png": productR760,
  "DELL-UNITY-XT-380F.png": productUnity380F,
  "Dell-Connectrix-DS-6610B.png": productDS6610B,
  "Dell-EMC-S5224F-ON.png": productS5224F,
  "Dell-EMC-N3248TE-ON.png": productN3248,
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

/* Resolved asset URLs (try PNG+SVG first, then verstka copy). */
const CATEGORY_ICON_URLS: Record<ComponentCategory, readonly string[]> = {
  cpu: [componentCpuPng, componentCpuVerstka],
  memory: [componentRamPng, componentRamVerstka],
  storage: [componentHddPng, componentHddVerstka],
  network: [componentNetworkPng, componentNetworkVerstka],
  power: [componentPowerPng, componentPowerVerstka],
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
  const { selectedCategoryId, selectCategory, selectUnit } = useSelection();
  const { effectiveComponents } = useComponentEdits();
  /* `subsystem.components` is the static BoQ; `editedComponents` overlays
   * the user's qty / description / delete tweaks from `ComponentEditsContext`.
   * Screen C reads from the overlay so edits survive subsystem navigation
   * without ever mutating `hardwareProject`. */
  const editedComponents = effectiveComponents(subsystem);

  /* The "Screen C focus" model:
   *   - selectedCategoryId === null  → the chassis hero is the active focus
   *     (mirrors the right-sidebar showing chassis alternatives or the
   *     component chip row).
   *   - selectedCategoryId set       → that component row is the active
   *     focus, sidebar drills into its SKU list.
   * Clicking a row toggles its category. Clicking the chassis hero clears
   * both the category drill AND any unit pin, so we land on the
   * subsystem-level catalog view (alternatives).
   */
  const handlePickCategory = (category: ComponentCategory) => {
    selectCategory(category === selectedCategoryId ? null : category);
  };

  const handlePickChassis = () => {
    /* Drop unit pin so the catalog returns to L1 (alternatives) — useful
     * when the user came in via a rack-unit click and now wants to see
     * what else could go in this slot. */
    selectUnit(null);
    selectCategory(null);
  };

  return (
    <motion.div
      key={`screen-c-${subsystem.id}`}
      className="relative z-0 flex h-full min-h-0 flex-1 flex-col px-6 pb-6 pt-40 sm:px-8 lg:px-12 lg:pb-8 lg:pt-42"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >

      {/* === Cards + chassis hero =================================
          The title stays below the floating chrome. The cards + chassis form
          one centred stack while they fit; when they don't, only the cards
          list shrinks into a scroll region and the chassis stays visible at
          the bottom of the available canvas. */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        {/* === Page title ========================================= */}
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 overflow-hidden lg:gap-4">
        <PageTitle subsystem={subsystem} />

          <div className="flex min-h-0 max-h-full shrink flex-col gap-2.5 overflow-y-auto overscroll-contain px-0 py-2 sm:px-8 xl:px-28">
            {editedComponents.length === 0 ? (
              <EmptyState />
            ) : (
              editedComponents.map((component, idx) => (
                <ComponentCard
                  key={component.id}
                  component={component}
                  index={idx}
                  selected={selectedCategoryId === component.category}
                  onSelect={() => handlePickCategory(component.category)}
                />
              ))
            )}
          </div>

          {/* === Chassis hero ====================================== */}
          <ChassisHero
            subsystem={subsystem}
            chassisImg={chassisImg}
            selected={selectedCategoryId === null}
            onSelect={handlePickChassis}
          />
        </div>
      </div>
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
      className="flex w-full shrink-0 items-baseline justify-center gap-3 px-1 text-white drop-shadow-sm"
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
  selected,
  onSelect,
}: {
  component: HardwareComponent;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = CATEGORY_ICON[component.category];
  /* Read-only row per Dr. Artemy's 2026-05-13 review: every edit
   * (qty +/-, swap SKU, delete, restore) is performed in the right-sidebar
   * Catalog. Clicking the row selects its category, which opens the
   * Catalog into the SKU list for this category. The hint pill on the
   * right ("Edit in catalog →") makes the affordance discoverable. */
  const enterFromY = 520;
  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={selected}
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
      className={cn(
        "group flex w-full cursor-pointer items-stretch gap-3 text-left",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#70CDFF]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#3b6bb1]",
      )}
    >
      {/* Icon sits OUTSIDE the white card, as in the reference UI. */}
      <div className="flex w-[52px] shrink-0 items-center justify-center">
        <ComponentIcon
          category={component.category}
          fallbackIcon={Icon}
          alt={component.categoryLabel}
        />
      </div>

      {/* White card: static qty pill + divider + title/description. */}
      <div
        className={cn(
          "relative flex min-h-[62px] flex-1 items-center bg-white px-2.5 py-2.5",
          "shadow-[0_1px_2px_rgba(15,23,42,0.06),0_3px_10px_rgba(15,23,42,0.08)]",
          "ring-2 ring-inset transition-[box-shadow,background-color] duration-150",
          selected
            ? "ring-[#70CDFF]"
            : "ring-transparent group-hover:shadow-[0_2px_4px_rgba(15,23,42,0.10),0_6px_18px_rgba(15,23,42,0.14)]",
        )}
      >
        {/* Static count pill — qty edits live in the Catalog. Size matches
            the pre-edit-feature pill (text-[20px] number, text-[15px] "x"). */}
        <div className="flex h-full min-w-[58px] items-center justify-center pr-3 leading-none text-slate-900">
          <span className="text-[20px] font-bold tabular-nums">
            {component.qty}
          </span>
          <span className="ml-1 text-[15px] font-semibold text-slate-400">
            x
          </span>
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
  const candidates = CATEGORY_ICON_URLS[category];
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
  selected,
  onSelect,
}: {
  subsystem: Subsystem;
  chassisImg: string | undefined;
  selected: boolean;
  onSelect: () => void;
}) {
  const watts = subsystem.chassis.watts;
  /* Computed inline so the chassis data stays the source of truth — no
   * stale numbers to keep in sync when we tweak `watts`. */
  const btu = watts ? Math.round(watts * 3.412 * 10) / 10 : undefined;
  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={selected}
      initial={{ y: 220, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 220, opacity: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
      className={cn(
        "flex w-full shrink-0 cursor-pointer items-start gap-5 text-left",
        /* The canvas becomes narrow before the whole viewport is "mobile"
         * because both sidebars stay visible. Stack the chassis media/card
         * at this breakpoint so the description card keeps readable width
         * and the hero becomes shorter instead of one very tall side card. */
        "max-[1200px]:flex-col max-[1200px]:items-center max-[1200px]:gap-2",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#70CDFF]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#3b6bb1]",
      )}
    >
      {/* Chassis image — sits DIRECTLY on the blueprint (no card behind
          it). Width is fixed-ish so the description card can fill the
          remaining space. */}
      {chassisImg ? (
        <img
          src={chassisImg}
          alt={subsystem.chassis.name}
          draggable={false}
          className="h-auto w-[clamp(180px,28vw,300px)] shrink-0 object-contain drop-shadow-lg max-[1200px]:w-[min(260px,72%)]"
        />
      ) : null}

      {/* Description card — white card with title, description, and the
          power/heat badges at the bottom. */}
      <div
        className={cn(
          "mx-2 flex min-w-0 flex-1 flex-col gap-2 bg-white/95 px-5 py-4",
          "shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_14px_rgba(15,23,42,0.10)]",
          "ring-2 ring-inset transition-colors duration-150",
          "max-[1200px]:w-full max-[1200px]:max-w-[420px] max-[1200px]:flex-none max-[1200px]:px-4 max-[1200px]:py-3",
          selected
            ? "ring-[#70CDFF]"
            : "ring-slate-200/80 hover:ring-slate-300",
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
      className="bg-white/90 px-5 py-6 text-center text-[13px] text-slate-500 ring-1 ring-slate-200"
    >
      No serviceable parts in this proposal — switches are sold as a single
      unit.
    </motion.div>
  );
}
