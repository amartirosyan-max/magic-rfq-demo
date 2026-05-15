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

/* Width budget reserved around the canvas-centred carousel.
 * The carousel pill measures ~110 px at its widest (3 dots + arrows
 * + padding). We reserve a slightly larger half-width on each side so
 * the tab tray on the left can never overlap with the centred pill,
 * no matter how narrow the middle column gets.
 *
 * 7rem = 112 px on each side  →  carousel ≤ 224 px corridor in the middle.
 */
const CAROUSEL_CORRIDOR = "7rem";

/**
 * Top chrome that floats OVER the blueprint canvas. Two rows:
 *
 *  Row 1 — translucent navy breadcrumb bar.
 *  Row 2 — Design / Questions / Price tabs on the LEFT and the rack
 *          carousel control CENTRED on the canvas. The tab tray is
 *          width-capped so it can never reach the centred carousel.
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
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 px-3 pt-3 sm:px-6 sm:pt-4">
      <BreadcrumbBar />
      {/* One row: tabs left (absolute, capped width), carousel centred via
          `flex justify-center`. Using flex-justify here (instead of
          absolute + `translate-x-1/2`) makes the carousel share the SAME
          sub-pixel rounding as ScreenA's centred rack row, so the pill
          stays exactly above the centred rack across Chrome/Safari/etc. */}
      <div className="relative mt-2 flex min-h-9 w-full min-w-0 items-center justify-center sm:mt-3">
        <div
          className="pointer-events-auto absolute inset-y-0 left-0 flex min-w-0 items-center"
          style={{
            maxWidth: inScreenC
              ? "100%"
              : `calc(50% - ${CAROUSEL_CORRIDOR})`,
          }}
        >
          <Tabs />
        </div>

        {!inScreenC ? <CarouselControl /> : null}
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
    selectUnit(null);
    selectSubsystem(null);
  };

  const goToSubsystem = (subsystemId: string) => {
    selectUnit(null);
    selectSubsystem(subsystemId);
  };

  return (
    <div className="pointer-events-auto w-full rounded-md border border-white/10 bg-[rgba(31,49,79,0.60)] px-3 py-2 shadow-sm sm:px-5 sm:py-2.5">
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
  /* Tabs scale with available width:
   *   – very narrow:   compact (px-2 py-1, 11 px text)
   *   – `sm` (≥640):  slightly more padding, xs text
   *   – `xl` (≥1280): full pills (px-5, sm text)
   * Buttons share width via `flex-1 basis-0 truncate` so all three labels
   * stay inside the beige tray and ellipsise only if there's truly no
   * room (very rare with these breakpoints). */
  return (
    <motion.div
      role="tablist"
      aria-label="Canvas sections"
      className="pointer-events-auto inline-flex w-full min-w-0 gap-1 overflow-hidden rounded-[8px] bg-[#f7f2ee] p-1.5 shadow-sm sm:gap-1.5 sm:rounded-[10px] sm:p-2"
    >
      {TABS.map((t) => {
        const selected = t.id === "design";
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={t.id !== "design"}
            className={cn(
              "min-w-0 flex-1 basis-0 truncate rounded-md border border-[#dbdbdb] px-2 py-1 text-[11px] font-medium leading-tight transition-colors sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs xl:px-5 xl:text-sm",
              selected
                ? "bg-[#004986] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </motion.div>
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
      selectRack(selectableRacks[0].id);
      return;
    }
    const next =
      (activeIndex + delta + selectableRacks.length) % selectableRacks.length;
    selectRack(selectableRacks[next].id);
  };

  return (
    <div className="pointer-events-auto inline-flex shrink-0 items-center gap-1 rounded-sm bg-white px-1.5 py-1 shadow-sm sm:gap-1.5 sm:px-3 sm:py-1.5">
      <CarouselArrow direction="left" onClick={() => go(-1)} />
      <div className="flex h-5 items-center gap-1 px-1.5 sm:px-2">
        {selectableRacks.map((rack, i) => (
          <span
            key={rack.id}
            className={cn(
              "h-4 w-[5px] rounded-xss transition-colors",
              hasSelection && i === activeIndex
                ? "bg-[#014881]"
                : "bg-[#cfcfd1]",
            )}
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
