import { useState } from "react";
import { cn } from "~/lib/utils";
import { CatalogEntryCard } from "./CatalogEntryCard";
import { hardwareProject } from "./fake-data";

type RightTab = "advisor" | "team" | "catalog";

const TABS: { id: RightTab; label: string }[] = [
  { id: "advisor", label: "Magic AI Advisor" },
  { id: "team", label: "Team" },
  { id: "catalog", label: "Catalog" },
];

/**
 * Right sidebar — currently shows the subsystem-category catalog
 * (Screen A / B context). On Screen C this body will be swapped for
 * product alternatives (Step 6).
 */
export function SidebarRight() {
  const [active, setActive] = useState<RightTab>("catalog");

  return (
    <aside className="flex h-full flex-col border-l border-slate-200 bg-white">
      <nav className="flex items-center gap-2 border-b border-slate-200 p-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={cn(
              "flex-1 rounded-md px-2 py-2 text-xs font-medium transition-colors",
              active === t.id
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {active === "catalog" &&
          hardwareProject.subsystemCategories.map((entry) => (
            <CatalogEntryCard key={entry.id} entry={entry} />
          ))}

        {active !== "catalog" && (
          <p className="px-4 py-8 text-center text-xs text-slate-400">
            {TABS.find((t) => t.id === active)?.label} — coming later.
          </p>
        )}
      </div>
    </aside>
  );
}
