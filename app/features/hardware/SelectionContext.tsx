import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { ComponentCategory } from "./types";

/**
 * Hardware demo selection state.
 *
 * Tracks four independent selections:
 *   - `selectedSubsystemId`     — driven by left-sidebar nav clicks.
 *   - `selectedRackId`          — driven by clicking a rack on the canvas.
 *   - `selectedUnitId`          — driven by clicking a server/switch inside
 *                                  the selected rack (Screen C detail).
 *   - `selectedCategoryId`      — driven by clicking a component row on
 *                                  Screen C OR a chip in the Catalog tab.
 *                                  Drives the right-sidebar catalog into
 *                                  a category-SKU view + paints a teal
 *                                  ring on the active Screen C row.
 *
 * Switching racks always clears the unit selection so we never carry
 * orphaned state across racks. Switching subsystems or units also
 * clears the category drill, otherwise the Catalog would keep showing
 * "CPU" while the user looks at a new chassis.
 *
 * Selection is pure client state — the URL never changes.
 */
interface SelectionContextValue {
  selectedSubsystemId: string | null;
  selectSubsystem: (id: string | null) => void;
  selectedRackId: string | null;
  selectRack: (id: string | null) => void;
  selectedUnitId: string | null;
  selectUnit: (id: string | null) => void;
  selectedCategoryId: ComponentCategory | null;
  selectCategory: (id: ComponentCategory | null) => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(
    null,
  );
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitIdRaw] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<ComponentCategory | null>(null);

  /* Picking a different rack (or deselecting) must drop the unit selection
   * — otherwise we'd render a "selected" ring on a unit that no longer has
   * a visible parent rack. */
  const selectRack = useCallback((id: string | null) => {
    setSelectedRackId(id);
    setSelectedUnitIdRaw(null);
    setSelectedCategoryId(null);
  }, []);

  /* A sidebar subsystem pick is meant to deterministically jump to that
   * subsystem on Screen C; any pre-existing unit / category selection
   * would otherwise win the "which subsystem is active?" tiebreaker. */
  const selectSubsystem = useCallback((id: string | null) => {
    setSelectedSubsystemId(id);
    setSelectedUnitIdRaw(null);
    setSelectedCategoryId(null);
  }, []);

  /* Changing the focused rack unit invalidates any drilled-into category
   * (we're now looking at a different chassis). */
  const selectUnit = useCallback((id: string | null) => {
    setSelectedUnitIdRaw(id);
    setSelectedCategoryId(null);
  }, []);

  const selectCategory = useCallback((id: ComponentCategory | null) => {
    setSelectedCategoryId(id);
  }, []);

  return (
    <SelectionContext.Provider
      value={{
        selectedSubsystemId,
        selectSubsystem,
        selectedRackId,
        selectRack,
        selectedUnitId,
        selectUnit,
        selectedCategoryId,
        selectCategory,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection(): SelectionContextValue {
  const ctx = useContext(SelectionContext);
  if (!ctx) {
    throw new Error("useSelection must be used inside <SelectionProvider>");
  }
  return ctx;
}
