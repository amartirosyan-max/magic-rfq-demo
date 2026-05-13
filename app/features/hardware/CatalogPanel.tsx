import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Minus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { cn } from "~/lib/utils";

import {
  componentCatalog,
  componentCategoryLabel,
  componentCategoryOrder,
} from "./catalog-data";
import { CatalogEntryCard } from "./CatalogEntryCard";
import { useComponentEdits } from "./ComponentEditsContext";
import { hardwareProject } from "./fake-data";
import { useSelection } from "./SelectionContext";
import { useCatalogScope } from "./useCatalogScope";
import type {
  CatalogEntry,
  ComponentCategory,
  HardwareComponent,
  Subsystem,
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
          {scope.kind === "project" && (
            <ProjectCatalog
              key="project"
              onPickSubsystem={selectSubsystem}
            />
          )}

          {scope.kind !== "project" && selectedCategoryId && (
            <ComponentCategoryView
              key={`cat-${selectedCategoryId}-${scope.subsystem.id}`}
              category={selectedCategoryId}
              subsystem={scope.subsystem}
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
/*  L0 — project catalog: mirrors the left-sidebar subsystem list              */
/* -------------------------------------------------------------------------- */

/**
 * Render the project's actual subsystems (same source as the left
 * sidebar) — NOT the generic `subsystemCategories` blurbs. Each card
 * acts as a deep-link: clicking it selects that subsystem and the
 * panel transitions into L1 (platform alternatives).
 */
function ProjectCatalog({
  onPickSubsystem,
}: {
  onPickSubsystem: (id: string) => void;
}) {
  const entries = useMemo(
    () => hardwareProject.subsystems.map(subsystemToCatalogEntry),
    [],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col gap-1.5"
    >
      {entries.map((entry) => (
        <CatalogEntryCard
          key={entry.id}
          entry={entry}
          onClick={() => onPickSubsystem(entry.id)}
        />
      ))}
    </motion.div>
  );
}

/**
 * Project a `Subsystem` (left-sidebar item) onto the shared
 * `CatalogEntry` shape so the same `CatalogEntryCard` can render it.
 * Pulls a marketing-friendly summary out of the chassis spec —
 * description doubles as the card body, `bestFor` carries the "N × …"
 * count, and `spec` carries the rack-form / vendor / power one-liner.
 */
function subsystemToCatalogEntry(subsystem: Subsystem): CatalogEntry {
  const c = subsystem.chassis;
  const watts = c.watts ? ` · ${c.watts}W` : "";
  return {
    id: subsystem.id,
    name: subsystem.name,
    status: "in-proposal",
    bestFor: `${subsystem.qty} × ${c.name}`,
    spec: `${c.sizeU}U · ${c.vendor}${watts}`,
    description: c.description || subsystem.titleSuffix,
  };
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

/* -------------------------------------------------------------------------- */
/*  L3 — component category view (where the real edit controls live)           */
/* -------------------------------------------------------------------------- */

/**
 * Renders edit controls for ONE component category of the active chassis:
 *   - "Currently installed" card with qty stepper + delete (or "Restore"
 *     if the row was deleted earlier this session).
 *   - "Swap to a different SKU" list below — clicking the action button on
 *     an alternative rewrites the row's description (and reinstates it if
 *     it had been deleted).
 *
 * This is the single place where component edits happen. Screen C rows
 * are read-only labels driven by the same `ComponentEditsContext`.
 */
function ComponentCategoryView({
  category,
  subsystem,
  installedId,
}: {
  category: ComponentCategory;
  subsystem: Subsystem;
  installedId: string | null;
}) {
  const list = componentCatalog[category];
  const {
    effectiveComponents,
    setQty,
    setDescription,
    deleteComponent,
    restoreComponent,
    isDeleted,
  } = useComponentEdits();

  /* Find the matching component row in the chassis (static BoQ has at
   * most one row per category). We look it up in the *unedited* list so
   * we can also surface deleted rows with a "Restore" action. */
  const installedRow = useMemo<HardwareComponent | null>(() => {
    return subsystem.components.find((c) => c.category === category) ?? null;
  }, [subsystem.components, category]);

  /* Apply overlays to get the live qty + description for the row. */
  const liveRow = useMemo<HardwareComponent | null>(() => {
    if (!installedRow) return null;
    const live = effectiveComponents(subsystem).find(
      (c) => c.id === installedRow.id,
    );
    return live ?? installedRow;
  }, [installedRow, effectiveComponents, subsystem]);

  const deleted = installedRow ? isDeleted(installedRow.id) : false;

  /* New description text used when the user picks an alternative SKU.
   * Keeps the row scannable — name + spec line if available. */
  const composeDescription = (entry: CatalogEntry) =>
    entry.spec ? `${entry.name} — ${entry.spec}` : entry.name;

  const handleSwap = (entry: CatalogEntry) => {
    if (!installedRow) return;
    setDescription(installedRow.id, composeDescription(entry));
    if (deleted) restoreComponent(installedRow.id);
  };

  const ordered = useMemo(
    () => sortBySelectedFirst(list, installedId),
    [list, installedId],
  );

  /* Alternatives = everything except the currently-installed SKU, so the
   * action list never repeats what the "Currently installed" card shows. */
  const alternatives = useMemo(
    () => ordered.filter((e) => e.id !== installedId),
    [ordered, installedId],
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-3"
    >
      {installedRow && liveRow ? (
        <InstalledComponentCard
          row={liveRow}
          deleted={deleted}
          onDec={() => setQty(liveRow.id, liveRow.qty - 1)}
          onInc={() => setQty(liveRow.id, liveRow.qty + 1)}
          onDelete={() => deleteComponent(liveRow.id)}
          onRestore={() => restoreComponent(liveRow.id)}
        />
      ) : (
        <SectionHint
          body={`No ${componentCategoryLabel[category]} row in this chassis yet — pick one below to add it.`}
        />
      )}

      <SectionHint
        body={
          installedRow
            ? `Swap to a different SKU — ${alternatives.length} compatible ${componentCategoryLabel[category]} options.`
            : `${alternatives.length} ${componentCategoryLabel[category]} SKUs available.`
        }
      />
      <div className="flex flex-col gap-1.5">
        {alternatives.map((entry) => (
          <CatalogEntryCard
            key={entry.id}
            entry={entry}
            actionLabel={deleted ? "Add" : "Swap"}
            onAction={() => handleSwap(entry)}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  InstalledComponentCard — qty stepper + delete / restore                    */
/* -------------------------------------------------------------------------- */

function InstalledComponentCard({
  row,
  deleted,
  onDec,
  onInc,
  onDelete,
  onRestore,
}: {
  row: HardwareComponent;
  deleted: boolean;
  onDec: () => void;
  onInc: () => void;
  onDelete: () => void;
  onRestore: () => void;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border bg-white px-4 py-3 transition-colors",
        deleted
          ? "border-slate-200 ring-1 ring-slate-100 opacity-75"
          : "border-teal-300/80 bg-teal-50/30 ring-1 ring-teal-200/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {deleted ? "Removed from chassis" : "Currently installed"}
          </p>
          <h3 className="mt-0.5 text-[14px] font-semibold leading-snug text-slate-900">
            {row.categoryLabel}
          </h3>
          <p className="mt-0.5 break-words text-[12.5px] leading-snug text-slate-600">
            {row.description}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        {/* Qty stepper — disabled when the row is deleted (qty has no
            meaning until the row is restored). */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Per chassis
          </span>
          <div className="flex items-center gap-1.5">
            <StepperButton
              onClick={onDec}
              disabled={deleted || row.qty <= 1}
              label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </StepperButton>
            <span className="min-w-[26px] text-center text-[16px] font-bold leading-none tabular-nums text-slate-900">
              {row.qty}
            </span>
            <StepperButton
              onClick={onInc}
              disabled={deleted}
              label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </StepperButton>
          </div>
        </div>

        {/* Delete / restore button — clicking again toggles state. */}
        {deleted ? (
          <button
            type="button"
            onClick={onRestore}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[12px] font-medium text-sky-700",
              "hover:border-sky-300 hover:bg-sky-100",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
            )}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restore
          </button>
        ) : (
          <button
            type="button"
            onClick={onDelete}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[12px] font-medium text-rose-600",
              "hover:border-rose-300 hover:bg-rose-100",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        )}
      </div>
    </article>
  );
}

function StepperButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md border text-slate-700 transition-colors",
        "border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300",
        disabled &&
          "cursor-not-allowed opacity-40 hover:border-slate-200 hover:bg-white hover:text-slate-700",
      )}
    >
      {children}
    </button>
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
