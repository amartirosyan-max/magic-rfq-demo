import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

/**
 * Hardware demo selection state.
 *
 * Tracks four independent selections:
 *   - `selectedSubsystemId`     — driven by left-sidebar nav clicks.
 *   - `selectedRackId`          — driven by clicking a rack on the canvas.
 *   - `selectedUnitId`          — driven by clicking a server/switch inside
 *                                  the selected rack (Screen C detail).
 *   - `selectedComponentId`     — driven by clicking a component row on
 *                                  Screen C OR a chip in the Catalog tab.
 *                                  Each BoQ row has its own id (e.g. two
 *                                  "Hard Drive / SSD" lines are distinct);
 *                                  the catalog drills into that row's
 *                                  category via a lookup, not by category
 *                                  alone — otherwise both storage rows
 *                                  would highlight together.
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
  selectedComponentId: string | null;
  selectComponent: (id: string | null) => void;
  /**
   * Clears every selection AND signals "re-centre the canvas view" via a
   * monotonically-increasing `resetViewToken`. Used by the left-sidebar
   * `Preview Proposal` button so it returns to a clean rack-overview
   * snapshot — distinct from a plain background-click deselect, which
   * keeps the current scroll position so the user can pan freely.
   */
  resetView: () => void;
  resetViewToken: number;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(
    null,
  );
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitIdRaw] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );
  const [resetViewToken, setResetViewToken] = useState(0);

  /* Picking a different rack (or deselecting) must drop the unit selection
   * — otherwise we'd render a "selected" ring on a unit that no longer has
   * a visible parent rack. */
  const selectRack = useCallback((id: string | null) => {
    setSelectedRackId(id);
    setSelectedUnitIdRaw(null);
    setSelectedComponentId(null);
  }, []);

  /* A sidebar subsystem pick is meant to deterministically jump to that
   * subsystem on Screen C; any pre-existing unit / component selection
   * would otherwise win the "which subsystem is active?" tiebreaker. */
  const selectSubsystem = useCallback((id: string | null) => {
    setSelectedSubsystemId(id);
    setSelectedUnitIdRaw(null);
    setSelectedComponentId(null);
  }, []);

  /* Changing the focused rack unit invalidates any drilled-into component
   * (we're now looking at a different chassis). */
  const selectUnit = useCallback((id: string | null) => {
    setSelectedUnitIdRaw(id);
    setSelectedComponentId(null);
  }, []);

  const selectComponent = useCallback((id: string | null) => {
    setSelectedComponentId(id);
  }, []);

  /* Hard reset — clears all four selection axes in a single render AND
   * bumps `resetViewToken` so views that care (Screen A's rack scroller)
   * can re-centre. Background clicks deliberately don't call this. */
  const resetView = useCallback(() => {
    setSelectedSubsystemId(null);
    setSelectedRackId(null);
    setSelectedUnitIdRaw(null);
    setSelectedComponentId(null);
    setResetViewToken((n) => n + 1);
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
        selectedComponentId,
        selectComponent,
        resetView,
        resetViewToken,
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
