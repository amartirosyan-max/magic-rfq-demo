import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { hardwareProject } from "./fake-data";
import logoUrl from "~/assets/hardware/verstka/Logo_text.png";

/**
 * Left sidebar in hardware mode.
 *
 * Layout:
 *  1. Magic logo
 *  2. Project header (name + lead score)
 *  3. Grand Total
 *  4. Preview Proposal button
 *  5. Subsystem navigation tree (project + 6 children)
 */
export function SidebarLeft() {
  const project = hardwareProject;

  return (
    <aside className="flex h-full w-full flex-col gap-6 border-r border-slate-200 bg-white px-5 py-6">
      <img src={logoUrl} alt="Magic" className="h-7 w-auto" />

      <header>
        <h1 className="text-[15px] font-semibold leading-tight text-slate-900">
          {project.name}
        </h1>
        <p className="mt-2 text-xs text-slate-500">
          Lead score:{" "}
          <span className="text-base font-semibold text-emerald-600">
            {project.leadScore.split("/")[0]}
          </span>
        </p>
      </header>

      <section>
        <p className="text-xs text-slate-500">Grand Total:</p>
        <p className="text-xl font-semibold text-blue-600">
          ${project.grandTotalUSD.toLocaleString("en-US")}
        </p>
      </section>

      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
      >
        Preview Proposal
      </motion.button>

      <nav className="flex flex-col gap-2">
        <SubsystemNavItem label={project.name} selected highlight />
        {project.subsystems.map((s) => (
          <SubsystemNavItem key={s.id} label={s.name} />
        ))}
      </nav>
    </aside>
  );
}

function SubsystemNavItem({
  label,
  selected,
  highlight,
}: {
  label: string;
  selected?: boolean;
  highlight?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "w-full rounded-md border px-4 py-3 text-sm transition-colors",
        highlight
          ? "border-2 border-slate-300 bg-white font-semibold text-slate-900"
          : selected
            ? "border-blue-300 bg-blue-100 text-blue-900"
            : "border-blue-100 bg-blue-50 font-medium text-slate-700 hover:bg-blue-100",
      )}
    >
      {label}
    </motion.button>
  );
}
