import { motion } from "framer-motion";
import { Plus, Square, X } from "lucide-react";
import { cn } from "~/lib/utils";
import { StatusBadge } from "./StatusBadge";
import type { CatalogEntry, CatalogStatus } from "./types";

/**
 * One card in the right-sidebar Catalog list.
 *
 * Used for every catalog context:
 *   - L0 — subsystem categories (Screen A / B)
 *   - L1 — platform alternatives for a subsystem (Screen C from sidebar)
 *   - L2 — chassis context + component SKUs (Screen C from rack click)
 *
 * The card shape is intentionally the same at every level so the visual
 * language stays consistent. Optional fields on `CatalogEntry`
 * (`price`, `bestFor`, `spec`) light up extra rows when populated:
 *
 *   ┌────────────────────────────────────────────┬────────────┐
 *   │  Name                                       │   ~$4,500  │   ← title row
 *   │  ● In proposal                              │            │
 *   │  Best for: Dense compute nodes              │            │
 *   │                                             │            │
 *   │  [ + ] [ □ ] [ × ]                          │            │   ← actions
 *   │                                             │            │
 *   │  32C / 64T · 300W · 60MB L3                 │            │   ← spec
 *   │  Long product description that wraps …      │            │   ← description
 *   └─────────────────────────────────────────────┴────────────┘
 *
 * Action buttons are visual-only for the demo.
 */
export function CatalogEntryCard({
  entry,
  selected,
  onClick,
  className,
}: {
  entry: CatalogEntry;
  /** Visual override: forces the "currently in proposal" ring even when
   *  the entry's status field is `not-in-proposal`. Used for the L2
   *  context card pinned at the top of the chassis catalog. */
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const inProposal = selected ?? entry.status === "in-proposal";

  return (
    <motion.article
      onClick={onClick}
      whileHover={onClick ? { y: -1 } : undefined}
      className={cn(
        "relative px-4 py-4 transition-colors",
        inProposal &&
          "rounded-xl border border-teal-300/80 bg-teal-50/30 ring-1 ring-teal-200/60",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <header className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-slate-900">
            {entry.name}
          </h3>
          <StatusBadge status={entry.status} className="mt-1 block" />
          {entry.bestFor ? (
            <p className="mt-1 text-[12.5px] text-slate-600">
              <span className="font-medium text-slate-500">Best for:</span>{" "}
              {entry.bestFor}
            </p>
          ) : null}
        </div>
        {entry.price ? (
          <span className="shrink-0 text-[13px] font-semibold text-slate-900">
            {entry.price}
          </span>
        ) : null}
      </header>

      <div className="mt-3 flex gap-2">
        <ActionButton kind="add" status={entry.status} />
        <ActionButton kind="edit" status={entry.status} />
        <ActionButton kind="remove" status={entry.status} />
      </div>

      {entry.spec ? (
        <p className="mt-3 text-[12.5px] leading-snug text-slate-500">
          {entry.spec}
        </p>
      ) : null}

      <p
        className={cn(
          "text-[13px] leading-relaxed text-slate-600",
          entry.spec ? "mt-1" : "mt-3",
        )}
      >
        {entry.description}
      </p>
    </motion.article>
  );
}

type ActionKind = "add" | "edit" | "remove";

function ActionButton({
  kind,
  status,
}: {
  kind: ActionKind;
  status: CatalogStatus;
}) {
  /* The "Remove" action is rendered filled-red when this entry is already
   * in the "removed" state; otherwise it's a subtle outlined red. */
  const removeActive = kind === "remove" && status === "removed";

  const colour =
    kind === "remove"
      ? removeActive
        ? "bg-red-500 text-white border-red-500"
        : "bg-red-50 text-red-500 border-red-200"
      : "bg-sky-50 text-sky-600 border-sky-200";

  const Icon = kind === "add" ? Plus : kind === "edit" ? Square : X;

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
        colour,
      )}
      aria-label={kind}
    >
      <Icon className="h-4 w-4" strokeWidth={2.2} />
    </motion.button>
  );
}
