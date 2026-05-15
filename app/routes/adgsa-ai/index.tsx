import { HardwareCanvas } from "~/features/hardware/HardwareCanvas";
import { HardwareLayout } from "~/features/hardware/HardwareLayout";
import { adgsaProject } from "~/features/hardware/projects/adgsa-ai";

/**
 * Hardware configurator — ADGSA-AI demo entry.
 *
 * Sister route to `/avaya`. Renders the same shell + canvas with the
 * ADGSA-AI POD project tree (`projects/adgsa-ai.ts`): 5 racks, 6
 * subsystems (AI GPU Cluster, NAS Storage, Management Nodes, Storage
 * Switches, ToR Switches, AI Fabric Switches), grand total $8,033,365.
 *
 * Asset preloading lives in `app/root.tsx` (SPA build, see comments
 * there and on the `/avaya` route).
 */
export default function AdgsaAiDemoEntry() {
  return (
    <HardwareLayout project={adgsaProject}>
      <HardwareCanvas />
    </HardwareLayout>
  );
}
