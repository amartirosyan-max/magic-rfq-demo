import { motion } from "framer-motion";
import { hardwareProject } from "./fake-data";
import { Rack } from "./Rack";
import { TopChrome } from "./TopChrome";

/**
 * Screen A — multi-rack overview.
 *
 * Renders the 4 racks `[empty][Rack 01][Rack 02][empty]` in a row,
 * on a full-height blueprint-grid canvas. `TopChrome` is positioned
 * absolutely on top of the grid so the grid fills the entire viewport.
 */
export function ScreenA() {
  return (
    <section
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#3b6bb1]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)
        `,
        backgroundSize: "24px 24px",
      }}
    >
      <TopChrome />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="relative flex flex-1 items-center justify-center overflow-hidden px-12 pb-12 pt-24"
      >
        <div className="flex h-[72vh] items-end gap-10">
          {hardwareProject.racks.map((rack, idx) => (
            <Rack
              key={rack.id}
              rack={rack}
              columnLabel={rack.isEmpty ? "" : labelFor(idx)}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/**
 * Column labels shown above each rack on Screen A.
 * Index map: 0 = empty-left, 1 = Rack 01, 2 = Rack 02, 3 = empty-right.
 */
function labelFor(idx: number): string {
  if (idx === 1) return "Infrastructure Rack 01";
  if (idx === 2) return "Infrastructure Rack 02";
  return "";
}
