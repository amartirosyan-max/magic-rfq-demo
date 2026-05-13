import { motion } from "framer-motion";
import { useMemo } from "react";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "~/lib/utils";
import { hardwareProject } from "./fake-data";
import { useSelection } from "./SelectionContext";
import { useActiveSubsystem } from "./useActiveSubsystem";

type DesignTab = "design" | "questions" | "price";

const TABS: { id: DesignTab; label: string }[] = [
  { id: "design", label: "Design" },
  { id: "questions", label: "Questions" },
  { id: "price", label: "Price" },
];

/**
 * Top chrome that floats OVER the blueprint canvas. Two rows:
 *
 *  Row 1 — translucent navy breadcrumb bar, indented from the canvas
 *          edges so it visually matches the padding of the tabs/carousel
 *          row below it.
 *  Row 2 — Design/Questions/Price tabs on the LEFT and the rack carousel
 *          control CENTRED horizontally.
 *
 * The whole chrome wraps with `pointer-events-none` so the grid clicks
 * through, and re-enables pointer-events on each interactive pill.
 */
export function TopChrome() {
  /* The carousel is only meaningful on Screen A (rack overview). On
   * Screen C we hide it — there's nothing to carousel between when the
   * canvas is showing a single subsystem's components. */
  const activeSubsystem = useActiveSubsystem();
  const inScreenC = activeSubsystem !== null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 px-6 pt-4">
      <BreadcrumbBar />
      <div className="grid grid-cols-[1fr_auto_1fr] items-center mt-3">
        <div className="flex">
          <Tabs />
        </div>
        {inScreenC ? (
          /* Same grid slot as the carousel — must still capture clicks.
           * Parent row is `pointer-events-none`; an empty `<div />` has no
           * `pointer-events-auto` and often zero width, so clicks fell through
           * to Screen C and triggered backdrop → "jumped" back to racks. */
          <div
            aria-hidden
            className="pointer-events-auto flex min-h-9 min-w-[200px] items-center justify-center"
          />
        ) : (
          <CarouselControl />
        )}
        <div
          aria-hidden
          className={cn(inScreenC && "pointer-events-auto min-h-9")}
        />
      </div>
    </div>
  );
}

function BreadcrumbBar() {
  /* Append "› {subsystem}" when Screen C is active so the breadcrumb
   * reflects the navigation depth — e.g.
   *   Project › Avaya POD Cluster – IPO200 › Hyper-v Cluster
   */
  const activeSubsystem = useActiveSubsystem();
  const { selectSubsystem, selectUnit } = useSelection();

  const goToProject = () => {
    // Leave rack selection intact, but exit Screen C context.
    selectUnit(null);
    selectSubsystem(null);
  };

  const goToSubsystem = (subsystemId: string) => {
    selectUnit(null);
    selectSubsystem(subsystemId);
  };

  return (
    <div className="pointer-events-auto w-full rounded-md border border-white/10 bg-[rgba(31,49,79,0.38)] px-5 py-2.5 shadow-sm backdrop-blur-md">
      <button
        type="button"
        onClick={goToProject}
        className="text-[12px] font-medium tracking-wide text-slate-300 hover:text-white"
      >
        Project
      </button>
      <span className="mx-2 text-slate-300">›</span>
      <button
        type="button"
        onClick={goToProject}
        className="text-[13px] font-semibold text-white hover:text-slate-100"
      >
        {hardwareProject.name}
      </button>
      {activeSubsystem ? (
        <>
          <span className="mx-2 text-slate-300">›</span>
          <details className="group relative inline-block">
            <summary className="inline-flex list-none items-center gap-1 text-[13px] font-semibold text-white marker:content-none hover:text-slate-100">
              {activeSubsystem.titleSuffix}
              <ChevronDown className="h-3.5 w-3.5 opacity-80 transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute left-0 top-[120%] z-30 min-w-[220px] rounded-md border border-slate-200 bg-white p-1 shadow-lg">
              {hardwareProject.subsystems.map((subsystem) => (
                <button
                  key={subsystem.id}
                  type="button"
                  onClick={() => goToSubsystem(subsystem.id)}
                  className={cn(
                    "block w-full rounded px-2.5 py-1.5 text-left text-[13px] text-slate-700",
                    subsystem.id === activeSubsystem.id
                      ? "bg-slate-100 font-semibold text-slate-900"
                      : "hover:bg-slate-50",
                  )}
                >
                  {subsystem.titleSuffix}
                </button>
              ))}
            </div>
          </details>
        </>
      ) : null}
    </div>
  );
}

function Tabs() {
  /* Design active by default — Step 5 will wire Questions / Price.
   * Tray #f7f2ee + bordered white pills match design kit Nav_bar_BG / long tabs. */
  return (
    <div className="pointer-events-auto inline-flex gap-1 rounded-[10px] bg-[#f7f2ee] p-1 shadow-sm">
      {TABS.map((t) => {
        const selected = t.id === "design";
        return (
          <button
            key={t.id}
            type="button"
            disabled={t.id !== "design"}
            className={cn(
              "rounded-lg border border-[#dbdbdb] px-5 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "bg-[#004986] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Rack carousel control.
 *
 * When at least one rack is selected, the `←` / `→` arrows cycle through
 * the project's non-empty racks. When no rack is selected the control
 * is decorative and the arrows are subtly dimmed.
 */
function CarouselControl() {
  const { selectedRackId, selectRack } = useSelection();

  const selectableRacks = useMemo(
    () => hardwareProject.racks.filter((r) => !r.isEmpty),
    [],
  );

  const activeIndex = selectedRackId
    ? selectableRacks.findIndex((r) => r.id === selectedRackId)
    : -1;
  const hasSelection = activeIndex >= 0;

  const go = (delta: number) => {
    if (selectableRacks.length === 0) return;
    if (activeIndex < 0) {
      /* Nothing selected yet — first arrow click selects the first rack. */
      selectRack(selectableRacks[0].id);
      return;
    }
    const next =
      (activeIndex + delta + selectableRacks.length) % selectableRacks.length;
    selectRack(selectableRacks[next].id);
  };

  return (
    <div className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 shadow-sm">
      <CarouselArrow direction="left" onClick={() => go(-1)} />
      <div className="flex h-5 items-center gap-1 px-2">
        {selectableRacks.map((rack, i) => (
          <span
            key={rack.id}
            className={cn(
              "w-[3px] rounded-full transition-colors",
              hasSelection && i === activeIndex
                ? "bg-[#2f7be5]"
                : "bg-[#2f4a73]",
            )}
            style={{ height: hasSelection && i === activeIndex ? "16px" : "12px" }}
          />
        ))}
      </div>
      <CarouselArrow direction="right" onClick={() => go(1)} />
    </div>
  );
}

function CarouselArrow({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  const Icon = direction === "left" ? ArrowLeft : ArrowRight;
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded-full text-[#2f7be5] hover:text-[#1f5cc2]"
      aria-label={`${direction} rack`}
    >
      <Icon className="h-4 w-4" />
    </motion.button>
  );
}
