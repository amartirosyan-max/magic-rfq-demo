import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "~/lib/utils";
import { hardwareProject } from "./fake-data";

type DesignTab = "design" | "questions" | "price";

const TABS: { id: DesignTab; label: string }[] = [
  { id: "design", label: "Design" },
  { id: "questions", label: "Questions" },
  { id: "price", label: "Price" },
];

/**
 * Top chrome that floats OVER the blueprint canvas:
 *  - left:   navy breadcrumb pill
 *  - left:   Design / Questions / Price tabs pill (Design active = blue)
 *  - centre: rack-carousel control (decorative for now)
 *
 * Background is transparent so the grid behind it is visible.
 */
export function TopChrome() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start gap-4 px-6 pt-4">
      <div className="pointer-events-auto flex flex-col items-start gap-2">
        <Breadcrumb />
        <Tabs />
      </div>

      <div className="flex flex-1 items-center justify-center pt-1">
        <CarouselControl />
      </div>

      {/* right slot intentionally empty — no "+" button */}
      <div className="w-[120px]" />
    </div>
  );
}

function Breadcrumb() {
  return (
    <div className="pointer-events-auto inline-flex w-fit items-center gap-2 rounded-md bg-[#3a4a5f] px-3 py-1.5 text-[13px] shadow-sm">
      <span className="text-slate-300">Project</span>
      <span className="text-slate-400">›</span>
      <span className="font-medium text-white">{hardwareProject.name}</span>
    </div>
  );
}

function Tabs() {
  /* Design active by default — Step 5 will wire Questions / Price. */
  return (
    <div className="pointer-events-auto inline-flex gap-1 rounded-md bg-white p-1 shadow-sm">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          disabled={t.id !== "design"}
          className={cn(
            "rounded-md px-5 py-1.5 text-sm font-medium transition-colors",
            t.id === "design"
              ? "bg-[#2f7be5] text-white shadow-sm"
              : "bg-transparent text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed",
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
    <div className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 shadow-sm">
      <CarouselArrow direction="left" />
      <div className="flex h-5 items-center gap-1 px-2">
        {[10, 14, 14, 10].map((h, i) => (
          <span
            key={i}
            className={cn(
              "w-[3px] rounded-full",
              i === 1 || i === 2 ? "bg-[#2f4a73]" : "bg-[#a8b5c4]",
            )}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
      <CarouselArrow direction="right" />
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
      className="flex h-6 w-6 items-center justify-center rounded-full text-[#2f7be5] hover:text-[#1f5cc2]"
      aria-label={`${direction} rack`}
    >
      <Icon className="h-4 w-4" />
    </motion.button>
  );
}
