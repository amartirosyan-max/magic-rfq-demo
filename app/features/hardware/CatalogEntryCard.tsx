import { motion } from "framer-motion";
import { Plus, Square, X } from "lucide-react";
import { cn } from "~/lib/utils";
import { StatusBadge } from "./StatusBadge";
import type { CatalogEntry, CatalogStatus } from "./types";

/**
 * One card in the right-sidebar Catalog list.
 * Used for both contexts:
 *  - subsystem categories (Screen A/B)
 *  - product alternatives (Screen C)
 *
 * Action buttons are visual only for the demo.
 */
export function CatalogEntryCard({ entry }: { entry: CatalogEntry }) {
  return (
    <article className="px-4 py-4">
      <h3 className="text-[15px] font-semibold text-slate-900">{entry.name}</h3>
      <StatusBadge status={entry.status} className="mt-1 block" />

      <div className="mt-3 flex gap-2">
        <ActionButton kind="add" status={entry.status} />
        <ActionButton kind="edit" status={entry.status} />
        <ActionButton kind="remove" status={entry.status} />
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
        {entry.description}
      </p>
    </article>
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
