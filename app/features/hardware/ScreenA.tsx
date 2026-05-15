import { useMemo } from "react";
import { motion } from "framer-motion";
import { hardwareProject } from "./fake-data";
import { Rack, type RackColumnLabel } from "./Rack";
import { useSelection } from "./SelectionContext";

/**
 * Screen A — multi-rack overview (carousel body only).
 *
 * The section wrapper, blueprint-grid background and `TopChrome` overlay
 * (which owns the breadcrumb, Design tabs and rack-carousel pill) live in
 * `HardwareCanvas.tsx` / `TopChrome.tsx`. This component is responsible
 * for the 4-rack row only and its interactions:
 *   - row translation so the selected rack centres on the canvas
 *   - canvas-backdrop click → deselect rack
 *
 * `HardwareCanvas` keys this component with `screen-a` so swapping in/out
 * of Screen C goes through `AnimatePresence`.
 */
export function ScreenA() {
  const { selectedRackId, selectRack } = useSelection();

  /**
   * Translate the row by % of its own width so the selected rack lands
   * in the horizontal centre. For an N-rack row the centre index is
   * `(N - 1) / 2` and each rack occupies `100 / N` % of the row width.
   *
   * Example with N=4 racks:
   *   centre index = 1.5
   *   select rack 1 → +12.5% (shift right)
   *   select rack 2 → -12.5% (shift left)
   */
  const rowOffsetPercent = useMemo(() => {
    if (!selectedRackId) return 0;
    const idx = hardwareProject.racks.findIndex(
      (r) => r.id === selectedRackId,
    );
    if (idx < 0) return 0;
    const n = hardwareProject.racks.length;
    const centreIdx = (n - 1) / 2;
    return ((centreIdx - idx) * 100) / n;
  }, [selectedRackId]);

  const hasSelection = selectedRackId !== null;

  return (
    /* Canvas body — clicking anywhere that *isn't* a rack clears the
     * rack selection. Interactive racks stop propagation in their own
     * onClick (Rack.tsx#handleRackClick), so this only fires for clicks
     * on the blueprint canvas, the row gaps, the surrounding padding,
     * or empty/decorative racks. */
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      onClick={() => {
        if (hasSelection) selectRack(null);
      }}
      className="relative flex flex-1 items-center justify-center overflow-hidden px-12 pb-12 pt-28"
    >
      {/* IMPORTANT — equal-width rack slots.
       *
       * The carousel pill above is centred on the canvas chrome.  For the
       * pill to sit exactly above the FOCUSED rack, the row's translate
       * percentage has to map cleanly to a per-rack shift.  With `gap-10`
       * the gaps are counted as part of the row width but not as part of
       * the per-rack stride — so `((centreIdx - i) * 100) / n` left the
       * focused rack a few pixels short of centre.
       *
       * Replacing the gap with symmetric `mx-5` on every rack makes each
       * rack live in an equal-width slot (`rackWidth + 40 px`), so the
       * formula now lands the focused rack at the exact row centre, and
       * the centred carousel sits exactly above it. */}
      <motion.div
        className="flex h-[55vh] items-end justify-center"
        animate={{ x: `${rowOffsetPercent}%` }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
      >
        {hardwareProject.racks.map((rack, idx) => (
          <div key={rack.id} className="flex h-full items-end mx-5">
            <Rack
              rack={rack}
              columnLabel={rack.isEmpty ? undefined : labelFor(idx)}
            />
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/**
 * Column labels shown above each rack on Screen A (two lines: title + RACK nn).
 * Index map: 0 = empty-left, 1 = Rack 01, 2 = Rack 02, 3 = empty-right.
 */
function labelFor(idx: number): RackColumnLabel | undefined {
  if (idx === 1) return { line1: "Infrastructure", line2: "Rack 01" };
  if (idx === 2) return { line1: "Infrastructure", line2: "Rack 02" };
  return undefined;
}
