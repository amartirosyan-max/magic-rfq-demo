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
 * Tracks three independent selections:
 *   - `selectedSubsystemId` — driven by left-sidebar nav clicks.
 *   - `selectedRackId`      — driven by clicking a rack on the canvas
 *                              (turns Screen A into rack-detail mode).
 *   - `selectedUnitId`      — driven by clicking a server/switch inside
 *                              the selected rack (Screen B detail).
 *
 * Switching racks always clears the unit selection so we never carry
 * orphaned state across racks. The URL never changes — selection is
 * pure client state and lives only for the duration of the demo session.
 */
interface SelectionContextValue {
  selectedSubsystemId: string | null;
  selectSubsystem: (id: string | null) => void;
  selectedRackId: string | null;
  selectRack: (id: string | null) => void;
  selectedUnitId: string | null;
  selectUnit: (id: string | null) => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(
    null,
  );
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  /* Picking a different rack (or deselecting) must drop the unit selection
   * — otherwise we'd render a "selected" ring on a unit that no longer has
   * a visible parent rack. */
  const selectRack = useCallback((id: string | null) => {
    setSelectedRackId(id);
    setSelectedUnitId(null);
  }, []);

  /* A sidebar subsystem pick is meant to deterministically jump to that
   * subsystem on Screen C; any pre-existing unit selection would otherwise
   * win the "which subsystem is active?" tiebreaker. */
  const selectSubsystem = useCallback((id: string | null) => {
    setSelectedSubsystemId(id);
    setSelectedUnitId(null);
  }, []);

  return (
    <SelectionContext.Provider
      value={{
        selectedSubsystemId,
        selectSubsystem,
        selectedRackId,
        selectRack,
        selectedUnitId,
        selectUnit: setSelectedUnitId,
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
