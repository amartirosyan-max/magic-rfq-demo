import { motion } from "framer-motion";
import { hardwareProject } from "./fake-data";
import { Rack } from "./Rack";
import { TopChrome } from "./TopChrome";

/**
 * Screen A — multi-rack overview.
 *
 * Renders the 4 racks `[empty][Rack 01][Rack 02][empty]` in a row,
 * inside a blueprint-grid canvas.
 */
export function ScreenA() {
  return (
    <section className="flex h-full flex-col overflow-hidden bg-[#3b6bb1]">
      <TopChrome />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="relative flex-1 overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "22px 22px",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-end gap-12">
            {hardwareProject.racks.map((rack, idx) => (
              <Rack
                key={rack.id}
                rack={rack}
                columnLabel={rack.isEmpty ? "" : labelFor(idx)}
              />
            ))}
          </div>
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
  if (idx === 1) return "Infrastructure\nRack 01";
  if (idx === 2) return "Infrastructure\nRack 02";
  return "";
}
