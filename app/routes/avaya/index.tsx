import { HardwareCanvas } from "~/features/hardware/HardwareCanvas";
import { HardwareLayout } from "~/features/hardware/HardwareLayout";

/**
 * Hardware configurator demo entry.
 *
 * `HardwareCanvas` switches between Screen A (rack carousel) and Screen C
 * (component detail) based on the current selection state. See
 * `app/docs/features/hardware-configurator/PROGRESS.md` step 5.
 */
export default function AvayaDemoEntry() {
  return (
    <HardwareLayout>
      <HardwareCanvas />
    </HardwareLayout>
  );
}
