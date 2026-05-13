import { HardwareCanvas } from "~/features/hardware/HardwareCanvas";
import { HardwareLayout } from "~/features/hardware/HardwareLayout";

/**
 * Hardware configurator demo entry.
 *
 * `HardwareCanvas` switches between Screen A (rack carousel) and Screen C
 * (component detail) based on the current selection state. See
 * `app/docs/features/hardware-configurator/PROGRESS.md` step 5.
 *
 * Asset preloading lives in `app/root.tsx` rather than on this route,
 * because react-router is configured for SPA mode (`ssr: false`) and
 * only the root's `<Links />` output is baked into the statically-
 * generated `build/client/index.html`. See the matching comment in
 * `root.tsx` for the full rationale.
 */
export default function AvayaDemoEntry() {
  return (
    <HardwareLayout>
      <HardwareCanvas />
    </HardwareLayout>
  );
}
