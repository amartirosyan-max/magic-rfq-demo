import { useMemo } from "react";
import { hardwareProject } from "./fake-data";
import { useSelection } from "./SelectionContext";
import { useSubsystemEdits } from "./SubsystemEditsContext";
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
 *
 * Subsystem-level edits (rename / qty / delete) from
 * `SubsystemEditsContext` are projected onto the returned subsystem so
 * downstream views (Screen C `PageTitle`, catalog breadcrumb, etc.) see
 * the edited label and qty without having to re-resolve the overlay.
 * A deleted subsystem returns `null` here so Screen C unmounts the moment
 * the user deletes the row from the catalog.
 */
export function useActiveSubsystem(): Subsystem | null {
  const { selectedUnitId, selectedSubsystemId } = useSelection();
  const { applyEdits, isDeleted } = useSubsystemEdits();

  return useMemo(() => {
    const resolve = (): Subsystem | null => {
      if (selectedUnitId) {
        for (const rack of hardwareProject.racks) {
          const unit = rack.units.find((u) => u.id === selectedUnitId);
          if (unit) {
            return (
              hardwareProject.subsystems.find(
                (s) => s.id === unit.subsystemId,
              ) ?? null
            );
          }
        }
      }
      if (selectedSubsystemId) {
        return (
          hardwareProject.subsystems.find(
            (s) => s.id === selectedSubsystemId,
          ) ?? null
        );
      }
      return null;
    };

    const raw = resolve();
    if (!raw) return null;
    if (isDeleted(raw.id)) return null;
    return applyEdits(raw);
  }, [selectedUnitId, selectedSubsystemId, applyEdits, isDeleted]);
}
