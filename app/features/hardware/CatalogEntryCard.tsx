import { motion } from "framer-motion";
import { ArrowLeftRight } from "lucide-react";
import { cn } from "~/lib/utils";
import { StatusBadge } from "./StatusBadge";
import type { CatalogEntry } from "./types";

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
 * (`price`, `bestFor`, `spec`) light up extra rows when populated.
 *
 * Action area:
 *   - When `actionLabel + onAction` are passed, a single primary action
 *     button is rendered (Swap / Add / Restore). This is the *only* way
 *     to get a clickable button on a card — the previous decorative
 *     `+ □ ×` trio was visual noise that did nothing, so it's gone (per
 *     Dr. Artemy's 2026-05-13 feedback: "this buttons on catalog didn't
 *     do anything"). Callers that want a clickable-card-only behaviour
 *     should pass `onClick` and skip the action props.
 */
export function CatalogEntryCard({
  entry,
  selected,
  onClick,
  className,
  actionLabel,
  onAction,
  bare,
}: {
  entry: CatalogEntry;
  /** Visual override: forces the "currently in proposal" ring even when
   *  the entry's status field is `not-in-proposal`. Used for the L2
   *  context card pinned at the top of the chassis catalog. */
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  /** When set, the decorative `+ □ ×` trio is replaced by a single
   *  primary action button (e.g. "Swap", "Add"). The button fires
   *  `onAction` and stops propagation so the surrounding `onClick`
   *  selector behaviour stays intact. Used by the component-category
   *  view in the right sidebar to drive real edits. */
  actionLabel?: string;
  onAction?: () => void;
  /** L0-only override (per Dr. Artemy's 2026-05-13 review): at the
   *  Project level every subsystem card is "in proposal" by definition,
   *  so painting them all with the teal ring is redundant noise. When
   *  `bare` is true we skip the in-proposal ring/border/tint and use
   *  a calm white card with a subtle shadow instead. L1/L3 keep the
   *  ring because there the highlight actually signals "this is the
   *  chosen SKU among alternatives". */
  bare?: boolean;
}) {
  const inProposal = selected ?? entry.status === "in-proposal";

  return (
    <motion.article
      onClick={onClick}
      whileHover={onClick ? { y: -1 } : undefined}
      className={cn(
        "relative w-full min-w-0 max-w-full overflow-hidden px-4 py-4 transition-colors",
        "bg-white",
        // !bare &&
        //   inProposal &&
        //   "rounded-xl border border-[#3744a6]/60 bg-[#3744a6]/[0.05] ring-1 ring-[#3744a6]/30",
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
            <p className="mt-1 break-words text-[12.5px] text-slate-600">
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

      {actionLabel && onAction ? (
        <div className="mt-3">
          <PrimaryActionButton
            label={actionLabel}
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
          />
        </div>
      ) : null}

      {entry.spec ? (
        <p className="mt-3 break-words text-[12.5px] leading-snug text-slate-500">
          {entry.spec}
        </p>
      ) : null}

      <p
        className={cn(
          "break-words text-[13px] leading-relaxed text-slate-600",
          entry.spec ? "mt-1" : "mt-3",
        )}
      >
        {entry.description}
      </p>
    </motion.article>
  );
}

function PrimaryActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[#3744a6]/60 bg-[#3744a6]/[0.06] px-3 py-1.5 text-[12px] font-semibold text-[#3744a6] transition-colors",
        "hover:border-[#3744a6] hover:bg-[#3744a6]/10",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3744a6]/50",
      )}
    >
      <ArrowLeftRight className="h-3.5 w-3.5" />
      {label}
    </motion.button>
  );
}
