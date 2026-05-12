import { useMemo } from "react";
import { hardwareProject } from "./fake-data";
import { useSelection } from "./SelectionContext";
import type { Subsystem } from "./types";

/**
 * Resolves which subsystem is currently "open" in Screen C.
 *
 *   - a selected unit (rack click) → that unit's parent subsystem
 *   - else a selected subsystem (sidebar click) → that subsystem
 *   - else → null (Screen A / overview is active)
 *
 * Single source of truth used by `HardwareCanvas` (decides which screen
 * to render) and `TopChrome` (hides the carousel + extends the
 * breadcrumb when Screen C is active).
 */
export function useActiveSubsystem(): Subsystem | null {
  const { selectedUnitId, selectedSubsystemId } = useSelection();

  return useMemo(() => {
    if (selectedUnitId) {
      for (const rack of hardwareProject.racks) {
        const unit = rack.units.find((u) => u.id === selectedUnitId);
        if (unit) {
          return (
            hardwareProject.subsystems.find((s) => s.id === unit.subsystemId) ??
            null
          );
        }
      }
    }
    if (selectedSubsystemId) {
      return (
        hardwareProject.subsystems.find((s) => s.id === selectedSubsystemId) ??
        null
      );
    }
    return null;
  }, [selectedUnitId, selectedSubsystemId]);
}
