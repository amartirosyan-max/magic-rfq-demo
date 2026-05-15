import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X as XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { useSubsystemEdits } from "./SubsystemEditsContext";
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
    <div className="flex h-full min-h-0 flex-col">
      <CatalogBreadcrumb
        scope={scope}
        activeCategory={selectedCategoryId}
        onUp={onUp}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-4 pt-3">
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
    <div className="sticky top-0 z-10 -mx-[10px] -mt-[10px] flex items-center gap-2 border-b border-slate-200 bg-[] px-3 py-2.5 backdrop-blur-sm">
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
 *
 * Reads `SubsystemEditsContext` so renamed labels appear and deleted
 * subsystems move to a "Removed" section at the bottom with a Restore
 * action (the only place users can bring a deleted subsystem back).
 */
function ProjectCatalog({
  onPickSubsystem,
}: {
  onPickSubsystem: (id: string) => void;
}) {
  const { applyEdits, isDeleted, restoreSubsystem } = useSubsystemEdits();

  const activeEntries = useMemo(
    () =>
      hardwareProject.subsystems
        .filter((s) => !isDeleted(s.id))
        .map((s) => subsystemToCatalogEntry(applyEdits(s))),
    [applyEdits, isDeleted],
  );

  /* Deleted entries get status="removed" so the existing `StatusBadge`
   * picks up the "Removed" treatment and `CatalogEntryCard` skips the
   * teal "In proposal" ring. No new styles introduced — same visual
   * language as the rest of the catalog. */
  const deletedEntries = useMemo<CatalogEntry[]>(
    () =>
      hardwareProject.subsystems
        .filter((s) => isDeleted(s.id))
        .map((s) => ({
          ...subsystemToCatalogEntry(applyEdits(s)),
          status: "removed" as const,
        })),
    [applyEdits, isDeleted],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col gap-3"
    >
      {/* Removed subsystems are surfaced AT THE TOP when there are any
          — otherwise users have to scroll past the active list to find
          the Restore affordance. Hidden entirely when nothing's deleted
          so the active list reads as the default project. */}
      {deletedEntries.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <SectionHint
            body={`${deletedEntries.length} subsystem${deletedEntries.length === 1 ? "" : "s"} removed from the project. Click Restore to bring ${deletedEntries.length === 1 ? "it" : "them"} back to the canvas.`}
          />
          {deletedEntries.map((entry) => (
            <CatalogEntryCard
              key={entry.id}
              entry={entry}
              bare
              actionLabel="Restore"
              onAction={() => restoreSubsystem(entry.id)}
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        {deletedEntries.length > 0 ? (
          <SectionHint body="In the project right now — click any subsystem to edit it." />
        ) : null}
        {activeEntries.map((entry) => (
          <CatalogEntryCard
            key={entry.id}
            entry={entry}
            bare
            onClick={() => onPickSubsystem(entry.id)}
          />
        ))}
      </div>
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
  const { alternatives, selectedId, subsystem } = scope;
  const { swapChassis, resetChassis, getActiveChassisCatalogId } =
    useSubsystemEdits();

  /* When the user has swapped, the "in proposal" highlight follows the
   * swap target (not the static `selectedId` from fake-data). This keeps
   * the L1 view consistent with the chassis name shown in Screen C. */
  const activeSwapId = getActiveChassisCatalogId(subsystem.id);
  const activeId = activeSwapId ?? selectedId;

  /* Re-tag entries so exactly one card carries `status="in-proposal"` —
   * the currently-active SKU after applying any swap. All other entries
   * fall back to `"not-in-proposal"` so we don't paint two teal rings. */
  const tagged = useMemo<CatalogEntry[]>(
    () =>
      alternatives.map((entry) => ({
        ...entry,
        status:
          entry.id === activeId
            ? ("in-proposal" as const)
            : ("not-in-proposal" as const),
      })),
    [alternatives, activeId],
  );

  const ordered = useMemo(
    () => sortBySelectedFirst(tagged, activeId),
    [tagged, activeId],
  );

  const swappedAwayFromOriginal =
    activeSwapId !== null && activeSwapId !== selectedId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col gap-3"
    >
      {/* Subsystem edit card pinned at the top — rename / qty / delete.
          This is the only place where the user can rename a subsystem or
          remove it from the project (clicks in the left sidebar are a
          pure selector). */}
      <SubsystemEditCard subsystem={subsystem} />

      {alternatives.length === 0 ? (
        <EmptyHint
          title="No catalog yet"
          body={`We don't have alternative platforms loaded for "${subsystem.name}" — coming soon.`}
        />
      ) : (
        <>
          <SectionHint
            body={
              swappedAwayFromOriginal
                ? `Swapped to a different platform — click "Reset" to restore the original SKU, or "Swap" on another card to pick a different one.`
                : `Swap chassis — ${alternatives.length} platforms compatible with this subsystem. The one in the proposal is highlighted at the top.`
            }
          />
          <div className="flex flex-col gap-1.5">
            {ordered.map((entry) => {
              const isActive = entry.id === activeId;
              /* Active card: show "Reset" only when the active entry is
               * a user swap (so the user can undo it). The original
               * factory-default entry has no action — it's already in
               * proposal. Non-active cards always get a "Swap" action. */
              if (isActive) {
                if (!swappedAwayFromOriginal) {
                  return <CatalogEntryCard key={entry.id} entry={entry} />;
                }
                return (
                  <CatalogEntryCard
                    key={entry.id}
                    entry={entry}
                    actionLabel="Reset to original"
                    onAction={() => resetChassis(subsystem.id)}
                  />
                );
              }
              return (
                <CatalogEntryCard
                  key={entry.id}
                  entry={entry}
                  actionLabel="Swap to this"
                  onAction={() =>
                    swapChassis(subsystem.id, {
                      catalogEntryId: entry.id,
                      name: entry.name,
                      description: entry.description,
                    })
                  }
                />
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  SubsystemEditCard — rename + qty stepper + delete                          */
/* -------------------------------------------------------------------------- */

function SubsystemEditCard({ subsystem }: { subsystem: Subsystem }) {
  const { setName, setQty, deleteSubsystem } = useSubsystemEdits();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(subsystem.name);

  /* Keep the inline editor's draft in sync when the live name changes
   * from outside the local input (e.g. another rename committed, restore
   * from L0, …). The `editing` guard avoids fighting the user's typing. */
  useEffect(() => {
    if (!editing) setDraftName(subsystem.name);
  }, [editing, subsystem.name]);

  const commitName = () => {
    const trimmed = draftName.trim();
    if (trimmed.length > 0 && trimmed !== subsystem.name) {
      setName(subsystem.id, trimmed);
    } else {
      setDraftName(subsystem.name);
    }
    setEditing(false);
  };

  const cancelName = () => {
    setDraftName(subsystem.name);
    setEditing(false);
  };

  return (
    <article className="border bg-white px-4 py-3 ring-1 ring-[#3744a6]/30">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Edit subsystem
      </p>

      {/* Name editor — read-only label that flips to an inline input on the
          pencil click. Enter commits, Escape cancels, blur commits. */}
      <div className="mt-1 flex items-center gap-2">
        {editing ? (
          <>
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitName();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelName();
                }
              }}
              onBlur={commitName}
              className={cn(
                "min-w-0 flex-1 rounded-md border border-[#3744a6] bg-white px-2 py-1 text-[14px] font-semibold text-slate-900",
                "focus:outline-none focus:ring-2 focus:ring-[#3744a6]/50",
              )}
            />
            <IconPill
              onClick={(e) => {
                e.stopPropagation();
                commitName();
              }}
              label="Save name"
              tone="teal"
            >
              <Check className="h-3.5 w-3.5" />
            </IconPill>
            <IconPill
              onClick={(e) => {
                e.stopPropagation();
                cancelName();
              }}
              label="Cancel rename"
              tone="slate"
            >
              <XIcon className="h-3.5 w-3.5" />
            </IconPill>
          </>
        ) : (
          <>
            <h3 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-slate-900">
              {subsystem.name}
            </h3>
            <IconPill
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              label="Rename subsystem"
              tone="slate"
            >
              <Pencil className="h-3.5 w-3.5" />
            </IconPill>
          </>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Chassis qty
          </span>
          <div className="flex items-center gap-1.5">
            <StepperPill
              onClick={() => setQty(subsystem.id, subsystem.qty - 1)}
              disabled={subsystem.qty <= 1}
              label="Decrease chassis count"
            >
              <Minus className="h-3.5 w-3.5" />
            </StepperPill>
            <span className="min-w-[26px] text-center text-[16px] font-bold leading-none tabular-nums text-slate-900">
              {subsystem.qty}
            </span>
            <StepperPill
              onClick={() => setQty(subsystem.id, subsystem.qty + 1)}
              label="Increase chassis count"
            >
              <Plus className="h-3.5 w-3.5" />
            </StepperPill>
          </div>
        </div>

        <button
          type="button"
          onClick={() => deleteSubsystem(subsystem.id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[12px] font-medium text-rose-600",
            "hover:border-rose-300 hover:bg-rose-100",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300",
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </article>
  );
}

function IconPill({
  onClick,
  label,
  tone,
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  label: string;
  tone: "teal" | "slate";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md border transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3744a6]/50",
        tone === "teal"
          ? "border-[#3744a6]/60 bg-[#3744a6]/10 text-[#3744a6] hover:border-[#3744a6] hover:bg-[#3744a6]/20"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}

function StepperPill({
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
        "border-slate-200 bg-white hover:border-[#3744a6] hover:bg-[#3744a6]/5 hover:text-[#3744a6]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3744a6]/50",
        disabled &&
          "cursor-not-allowed opacity-40 hover:border-slate-200 hover:bg-white hover:text-slate-700",
      )}
    >
      {children}
    </button>
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
                  ? "border-[#3744a6]/60 hover:border-[#3744a6]"
                  : "border-slate-200 hover:border-slate-300",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  installed ? "bg-[#3744a6]/[0.06]" : "bg-slate-50",
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
        "border bg-white px-4 py-3 transition-colors",
        deleted
          ? "border-slate-200 ring-1 ring-slate-100 opacity-75"
          : "bg-white ring-1 ring-[#3744a6]/30",
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
        "border-slate-200 bg-white hover:border-[#3744a6] hover:bg-[#3744a6]/5 hover:text-[#3744a6]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3744a6]/50",
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
