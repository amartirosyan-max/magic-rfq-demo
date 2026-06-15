import { HardwareCanvas } from "~/features/hardware/HardwareCanvas";
import { HardwareLayout } from "~/features/hardware/HardwareLayout";
import { adgsaIbmProject } from "~/features/hardware/projects/adgsa-ibm";

/**
 * Hardware configurator — ADGSA-AI (IBM / Lenovo) demo entry.
 *
 * Sister route to `/adgsa-ai` and `/avaya`. Renders the same shell + canvas
 * with the IBM/Lenovo re-bid of the ADGSA-AI tender
 * (`projects/adgsa-ibm.ts`): 5 racks, 5 subsystems (AI GPU Cluster, NAS
 * Storage, Management Nodes, AI Fabric Switches, OOB Management Switches),
 * grand total $5,455,600.
 *
 * Asset preloading lives in `app/root.tsx` (SPA build, see comments there
 * and on the `/avaya` route).
 */
export default function AdgsaIbmDemoEntry() {
  return (
    <HardwareLayout project={adgsaIbmProject}>
      <HardwareCanvas />
    </HardwareLayout>
  );
}
