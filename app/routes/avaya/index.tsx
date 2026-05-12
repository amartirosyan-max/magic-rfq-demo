import { HardwareLayout } from "~/features/hardware/HardwareLayout";
import { ScreenA } from "~/features/hardware/ScreenA";

/**
 * Hardware configurator demo entry.
 * Currently lands on Screen A (multi-rack overview).
 * See app/docs/features/hardware-configurator/PROGRESS.md.
 */
export default function AvayaDemoEntry() {
  return (
    <HardwareLayout>
      <ScreenA />
    </HardwareLayout>
  );
}
