import { cn } from "~/lib/utils";
import type { CatalogStatus } from "./types";

const labels: Record<CatalogStatus, string> = {
  "in-proposal": "In proposal",
  removed: "Removed",
  "not-in-proposal": "Not in proposal",
};

const tones: Record<CatalogStatus, string> = {
  "in-proposal": "text-[#3744a6]",
  removed: "text-red-600",
  "not-in-proposal": "text-slate-500",
};

export function StatusBadge({
  status,
  className,
}: {
  status: CatalogStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[13px] font-semibold leading-tight",
        tones[status],
        className,
      )}
    >
      {labels[status]}
    </span>
  );
}
