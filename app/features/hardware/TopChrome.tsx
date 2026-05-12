import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { cn } from "~/lib/utils";
import { hardwareProject } from "./fake-data";

type DesignTab = "design" | "questions" | "price";

const TABS: { id: DesignTab; label: string }[] = [
  { id: "design", label: "Design" },
  { id: "questions", label: "Questions" },
  { id: "price", label: "Price" },
];

/**
 * Top chrome above the canvas:
 *  - breadcrumb,
 *  - Design / Questions / Price tabs,
 *  - rack-carousel control (decorative for now),
 *  - "+" placeholder (decorative).
 *
 * No brand pill — confirmed removed.
 */
export function TopChrome() {
  return (
    <div className="flex flex-col gap-3 px-6 pt-4">
      <Breadcrumb />
      <div className="flex items-center justify-between">
        <Tabs />
        <CarouselControl />
        <div className="w-[140px]" />
      </div>
    </div>
  );
}

function Breadcrumb() {
  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-md border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-[13px] text-slate-700">
      <span className="text-slate-500">Project</span>
      <span className="text-slate-400">›</span>
      <span className="font-medium text-slate-900">
        {hardwareProject.name}
      </span>
    </div>
  );
}

function Tabs() {
  /* Design active by default — Step 5 will wire Questions / Price. */
  return (
    <div className="inline-flex gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          disabled={t.id !== "design"}
          className={cn(
            "rounded-sm px-4 py-1.5 text-sm font-medium transition-colors",
            t.id === "design"
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function CarouselControl() {
  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
        <CarouselArrow direction="left" />
        <div className="flex h-5 items-center gap-1 px-1">
          {[2, 3, 4, 3, 2].map((h, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-slate-400"
              style={{ height: `${h * 4}px` }}
            />
          ))}
        </div>
        <CarouselArrow direction="right" />
      </div>

      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-700"
        aria-label="Add"
      >
        <Plus className="h-4 w-4" />
      </motion.button>
    </div>
  );
}

function CarouselArrow({ direction }: { direction: "left" | "right" }) {
  const Icon = direction === "left" ? ArrowLeft : ArrowRight;
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:text-slate-700"
      aria-label={`${direction} rack`}
    >
      <Icon className="h-4 w-4" />
    </motion.button>
  );
}
