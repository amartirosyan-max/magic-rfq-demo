import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { cn } from "~/lib/utils";

import {
  componentCatalog,
  componentCategoryLabel,
  componentCategoryOrder,
} from "./catalog-data";
import { CatalogEntryCard } from "./CatalogEntryCard";
import { hardwareProject } from "./fake-data";
import { useSelection } from "./SelectionContext";
import { useCatalogScope } from "./useCatalogScope";
import type {
  CatalogEntry,
  ComponentCategory,
  HardwareComponent,
} from "./types";

import componentCpuPng from "~/assets/hardware/PNG+SVG/Component_CPU.png";
import componentRamPng from "~/assets/hardware/PNG+SVG/Component_RAM.png";
import componentHddPng from "~/assets/hardware/PNG+SVG/Component_HDD.png";
import componentNetworkPng from "~/assets/hardware/PNG+SVG/Component_Network.png";
import componentPowerPng from "~/assets/hardware/PNG+SVG/Component_Power.png";

const COMPONENT_ICON: Record<ComponentCategory, string> = {
  cpu: componentCpuPng,
  memory: componentRamPng,
  storage: componentHddPng,
  network: componentNetworkPng,
  power: componentPowerPng,
};

/* -------------------------------------------------------------------------- */
/*  Component-category → in-proposal SKU lookup                                */
/* -------------------------------------------------------------------------- */

function matchInstalledSku(
  category: ComponentCategory,
  components: HardwareComponent[],
): string | null {
  const row = components.find((c) => c.category === category);
  if (!row) return null;

  const flagged = componentCatalog[category].find(
    (e) => e.status === "in-proposal",
  );
  if (flagged) return flagged.id;

  const desc = row.description.toLowerCase();
  for (const entry of componentCatalog[category]) {
    const key = entry.name.split(" ")[0].toLowerCase();
    if (key && desc.includes(key)) return entry.id;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Catalog panel — top-level switcher                                         */
/* -------------------------------------------------------------------------- */

export function CatalogPanel() {
  const scope = useCatalogScope();
  const {
    selectSubsystem,
    selectUnit,
    selectedCategoryId,
    selectCategory,
  } = useSelection();

  /* Single back-arrow logic, used by the breadcrumb. Walks the navigation
   * one step up:
   *   category SKU list → chip row / subsystem alternatives
   *   chassis (L2 chips)  → subsystem alternatives (L1)
   *   subsystem (L1)      → project (L0)
   */
  const onUp = () => {
    if (selectedCategoryId) {
      selectCategory(null);
      return;
    }
    if (scope.kind === "chassis") {
      selectUnit(null);
      return;
    }
    if (scope.kind === "subsystem") {
      selectSubsystem(null);
    }
  };

  return (
    <div className="flex flex-col">
      <CatalogBreadcrumb
        scope={scope}
        activeCategory={selectedCategoryId}
        onUp={onUp}
      />

      <div className="px-1 pb-4 pt-3">
        <AnimatePresence mode="wait">
          {scope.kind === "project" && <ProjectCatalog key="project" />}

          {scope.kind !== "project" && selectedCategoryId && (
            <ComponentCategoryView
              key={`cat-${selectedCategoryId}`}
              category={selectedCategoryId}
              installedId={matchInstalledSku(
                selectedCategoryId,
                scope.subsystem.components,
              )}
            />
          )}

          {scope.kind === "subsystem" && !selectedCategoryId && (
            <SubsystemCatalog
              key={`subsystem-${scope.subsystem.id}`}
              scope={scope}
            />
          )}

          {scope.kind === "chassis" && !selectedCategoryId && (
            <ChassisOverview
              key={`chassis-${scope.subsystem.id}`}
              scope={scope}
              onPickCategory={selectCategory}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Breadcrumb / header                                                        */
/* -------------------------------------------------------------------------- */

function CatalogBreadcrumb({
  scope,
  activeCategory,
  onUp,
}: {
  scope: ReturnType<typeof useCatalogScope>;
  activeCategory: ComponentCategory | null;
  onUp: () => void;
}) {
  const segments: string[] = ["Catalog"];
  if (scope.kind === "subsystem") segments.push(scope.subsystem.titleSuffix);
  if (scope.kind === "chassis") segments.push(scope.subsystem.titleSuffix);
  if (activeCategory) segments.push(componentCategoryLabel[activeCategory]);
  else if (scope.kind === "chassis") segments.push("Components");

  const canGoUp = scope.kind !== "project" || activeCategory !== null;

  return (
    <div className="sticky top-0 z-10 -mx-[10px] -mt-[10px] flex items-center gap-2 border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur-sm">
      {canGoUp ? (
        <button
          type="button"
          onClick={onUp}
          aria-label="Back"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
      ) : (
        <span className="h-7 w-7" aria-hidden />
      )}
      <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-[12px] text-slate-500">
        {segments.map((s, i) => (
          <span key={`${s}-${i}`} className="flex items-center gap-1">
            {i > 0 ? (
              <ChevronRight className="h-3 w-3 text-slate-400" />
            ) : null}
            <span
              className={cn(
                "truncate",
                i === segments.length - 1
                  ? "font-semibold text-slate-700"
                  : "text-slate-500",
              )}
            >
              {s}
            </span>
          </span>
        ))}
      </nav>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  L0 — project catalog (subsystem categories)                                */
/* -------------------------------------------------------------------------- */

function ProjectCatalog() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col gap-1.5"
    >
      {hardwareProject.subsystemCategories.map((entry) => (
        <CatalogEntryCard key={entry.id} entry={entry} />
      ))}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  L1 — subsystem catalog (platform alternatives)                             */
/* -------------------------------------------------------------------------- */

function SubsystemCatalog({
  scope,
}: {
  scope: Extract<ReturnType<typeof useCatalogScope>, { kind: "subsystem" }>;
}) {
  const { alternatives, selectedId } = scope;

  const ordered = useMemo(
    () => sortBySelectedFirst(alternatives, selectedId),
    [alternatives, selectedId],
  );

  if (alternatives.length === 0) {
    return (
      <EmptyHint
        title="No catalog yet"
        body={`We don't have alternative platforms loaded for "${scope.subsystem.name}" — coming soon.`}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col"
    >
      <SectionHint
        body={`${alternatives.length} platforms compatible with this subsystem. The one in the proposal is highlighted at the top.`}
      />
      <div className="mt-2 flex flex-col gap-1.5">
        {ordered.map((entry) => (
          <CatalogEntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  L2 — chassis overview: current chassis context card + chip row             */
/* -------------------------------------------------------------------------- */

function ChassisOverview({
  scope,
  onPickCategory,
}: {
  scope: Extract<ReturnType<typeof useCatalogScope>, { kind: "chassis" }>;
  onPickCategory: (cat: ComponentCategory) => void;
}) {
  const installedSet = useMemo(
    () => new Set(scope.subsystem.components.map((c) => c.category)),
    [scope.subsystem.components],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col gap-4"
    >
      <CatalogEntryCard entry={scope.contextEntry} selected />

      <SectionHint body="Pick a category to browse compatible SKUs. The one currently installed in this chassis will be highlighted." />

      <div className="grid grid-cols-2 gap-2 px-1">
        {componentCategoryOrder.map((cat) => {
          const installed = installedSet.has(cat);
          return (
            <motion.button
              key={cat}
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPickCategory(cat)}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-white p-3 text-left shadow-sm transition-colors",
                installed
                  ? "border-teal-300 hover:border-teal-400"
                  : "border-slate-200 hover:border-slate-300",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  installed ? "bg-teal-50" : "bg-slate-50",
                )}
              >
                <img
                  src={COMPONENT_ICON[cat]}
                  alt=""
                  aria-hidden
                  className="max-h-7 max-w-7 object-contain"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-semibold text-slate-900">
                  {componentCategoryLabel[cat]}
                </span>
                <span className="truncate text-[11px] text-slate-500">
                  {componentCatalog[cat].length} options
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function ComponentCategoryView({
  category,
  installedId,
}: {
  category: ComponentCategory;
  installedId: string | null;
}) {
  const list = componentCatalog[category];

  const ordered = useMemo(
    () => sortBySelectedFirst(list, installedId),
    [list, installedId],
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col"
    >
      <SectionHint
        body={`${list.length} ${componentCategoryLabel[category]} SKUs available. ${
          installedId
            ? "The one installed in this chassis is at the top, highlighted."
            : "None of these match the installed SKU yet."
        }`}
      />
      <div className="mt-2 flex flex-col gap-1.5">
        {ordered.map((entry) => (
          <CatalogEntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tiny presentational helpers                                                */
/* -------------------------------------------------------------------------- */

function SectionHint({ body }: { body: string }) {
  return (
    <p className="px-2 text-[12px] leading-relaxed text-slate-500">{body}</p>
  );
}

function EmptyHint({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white/70 p-6 text-center">
      <p className="text-[14px] font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
        {body}
      </p>
    </div>
  );
}

function sortBySelectedFirst(
  list: CatalogEntry[],
  selectedId: string | null,
): CatalogEntry[] {
  if (!selectedId) return list;
  const idx = list.findIndex((e) => e.id === selectedId);
  if (idx <= 0) return list;
  const head = list[idx];
  return [head, ...list.slice(0, idx), ...list.slice(idx + 1)];
}
