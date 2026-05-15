import { HardwareCanvas } from "~/features/hardware/HardwareCanvas";
import { HardwareLayout } from "~/features/hardware/HardwareLayout";
import { avayaProject } from "~/features/hardware/projects/avaya";

/**
 * Hardware configurator — Avaya demo entry.
 *
 * `HardwareCanvas` switches between Screen A (rack carousel) and Screen C
 * (component detail) based on the current selection state. See
 * `app/docs/features/hardware-configurator/PROGRESS.md` step 5.
 *
 * The `project` prop selects which `HardwareProject` populates the
 * canvas; sister routes (`/adgsa-ai`, future projects) pass their own
 * project from `app/features/hardware/projects/*`.
 *
 * Asset preloading lives in `app/root.tsx` rather than on this route,
 * because react-router is configured for SPA mode (`ssr: false`) and
 * only the root's `<Links />` output is baked into the statically-
 * generated `build/client/index.html`. See the matching comment in
 * `root.tsx` for the full rationale.
 */
export default function AvayaDemoEntry() {
  return (
    <HardwareLayout project={avayaProject}>
      <HardwareCanvas />
    </HardwareLayout>
  );
}
