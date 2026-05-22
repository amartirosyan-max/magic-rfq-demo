# Rack Node Position Editor — Implementation Plan

> Context file for the AI agent. Read this before touching any rack code.
>
> Companion: `RACK-CONSTRUCTOR-PLAN.md` (rack frame + primitives, already done).
> Current branch: `feat/rack-constructor`.

---

## 1. Feature goal

Users can **drag chassis nodes up and down inside a rack** to re-arrange them,
and **reset** any rack back to its original layout with one click. The experience
must feel fluid and playful — the interaction is the feature.

No new top-level UI components are added. Everything reuses Magic's existing
colours, motion tokens (`hardwareSpring`, `motion.ts`), and layout primitives.

---

## 2. Interaction design

### When editing is available
Drag handles are only active when a rack is **selected** (the existing
`isSelected` state in `Rack.tsx`). Overview mode (no rack selected) never
enters drag mode — keeps the default click-to-select flow intact.

### Drag behaviour
1. User clicks a rack → it scales up (existing behaviour).
2. Inside the selected rack, any chassis node becomes **draggable** along the
   Y axis.
3. While dragging:
   - The lifted node renders at full opacity with a subtle `scale(1.04)` lift
     and a white glow `drop-shadow`.
   - A **ghost landing slot** — a translucent white rectangle — is drawn at
     the nearest valid (non-colliding) U position, updating live as the user
     moves.
   - Other nodes stay in place; they do **not** shuffle (this is position
     assignment, not list reordering).
4. On drop:
   - The node springs to the snapped U position.
   - The ghost disappears.
   - The override is saved to `RackEditsContext`.
5. If the target slot is **occupied**, the node springs back to its original
   position (the ghost turns red for 200 ms then vanishes).

### Reset affordance
When the selected rack has **any** position overrides a `RotateCcw` icon
button fades in just above the rack frame (inside the rack's own `motion.div`
coordinate space, so it scales with the rack). Clicking it:
- Calls `resetRack(rackId)` on `RackEditsContext`.
- Springs all nodes back to their original positions via an `animate` prop
  update on each `RackNode`.
- The icon fades back out.

---

## 3. Data & state architecture

Follows the same **overlay-only** pattern used by `SubsystemEditsContext`:
edits never mutate the source `hardwareProject`; they sit on top as
session-only state.

### New context — `RackEditsContext`

```ts
// Shape stored in the provider
type UnitPositionOverrides = Record<string, number>;   // unitId → positionU
type RackOverrides = Record<string, UnitPositionOverrides>; // rackId → overrides

interface RackEditsContextValue {
  /** Effective positionU for a unit (override if present, original otherwise). */
  getPositionU(rackId: string, unitId: string, original: number): number;
  /** Set a new position override for one unit. */
  moveUnit(rackId: string, unitId: string, positionU: number): void;
  /** Clear all overrides for one rack. */
  resetRack(rackId: string): void;
  /** True if any override exists for this rack — drives reset button visibility. */
  hasPendingEdits(rackId: string): boolean;
}
```

### Files
```
app/features/hardware/
├─ RackEditsContext.tsx    ← context shape + hook (no React component)
└─ RackEditsProvider.tsx   ← state implementation (Fast-Refresh boundary)
```

### Provider placement
`RackEditsProvider` wraps the existing provider stack in `HardwareLayout.tsx`,
keyed by `project.id` (same pattern as `SubsystemEditsProvider`):

```tsx
<SubsystemEditsProvider key={project.id}>
  <RackEditsProvider key={project.id}>   {/* ← new */}
    <ComponentEditsProvider>
      ...
    </ComponentEditsProvider>
  </RackEditsProvider>
</SubsystemEditsProvider>
```

---

## 4. Drag mechanics — framer-motion only (no new deps)

We **do not** add `@dnd-kit` or any drag library. Framer-motion's `drag` prop
is already bundled.

### Key framer-motion APIs used
| API | Purpose |
|---|---|
| `drag="y"` on `motion.div` | Restrict movement to vertical axis |
| `dragConstraints` | Bound the drag within the slot column |
| `dragElastic={0}` | No rubber-banding outside constraints |
| `dragMomentum={false}` | Instant settle (we handle snap ourselves) |
| `onDrag` | Update preview position live |
| `onDragEnd` | Compute final positionU, call `moveUnit` or reject |
| `animate={{ y }}` | Snap back to slot when released or rejected |
| `useMotionValue` / `useTransform` | Derive ghost position from drag offset |

### Snap calculation (inside `RackNode`)
```
topInSlotColumn  = (heightU − positionU − sizeU + 1) × UNIT_HEIGHT_PX
draggedTopY      = topInSlotColumn + dragOffsetY
rawRow (0-based) = Math.round(draggedTopY / UNIT_HEIGHT_PX)
newTopU (1-based) = heightU − rawRow − sizeU + 1
clamp            = Math.max(1, Math.min(heightU − sizeU + 1, newTopU))
```

### Collision check (inside `Rack.tsx`)
Before calling `moveUnit`, check whether `[clamp … clamp + sizeU − 1]`
overlaps any other unit's effective range. If it does, reject the move.

---

## 5. Ghost landing slot

The ghost is a pure-visual element rendered inside `data-rack-node-layer`
(the absolute overlay div in `RackFrame`). `Rack.tsx` owns its state:

```tsx
// inside Rack.tsx
const [ghostPositionU, setGhostPositionU] = useState<number | null>(null);
const [ghostRejected, setGhostRejected] = useState(false);
```

The ghost `<div>` is drawn only when `ghostPositionU !== null` and the rack
is selected. Style: `bg-white/20 border border-white/40 rounded-[2px]`.
When rejected: `bg-red-400/30 border-red-400/60`, auto-clears after 200 ms.

---

## 6. Visual design tokens (no new CSS — reuse existing)

| Element | Tailwind classes |
|---|---|
| Lifted node | `drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] scale-[1.04]` via framer-motion `animate` |
| Ghost (valid) | `bg-white/20 border border-white/40 rounded-[2px]` |
| Ghost (rejected) | `bg-red-400/30 border-red-400/60` |
| Reset button | `RotateCcw` lucide icon, `text-white/70 hover:text-white`, `size-3.5`, wrapped in a `motion.button` with `whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }}` |
| Reset button container | Absolute, `right-0 -top-5`, AnimatePresence fade in/out |

All colours are from the existing Magic blue palette.

---

## 7. Component changes — file map

### New files
```
app/features/hardware/
├─ RackEditsContext.tsx
└─ RackEditsProvider.tsx
```

### Changed files

| File | Change |
|---|---|
| `HardwareLayout.tsx` | Add `<RackEditsProvider>` to provider stack |
| `rack-constructor/RackNode.tsx` | Add `draggable`, `dragConstraintsRef`, `onDragStart`, `onDrag`, `onDragEnd`, `animateY` props |
| `app/features/hardware/Rack.tsx` | Read `RackEditsContext`; compute `effectivePositionU`; pass drag callbacks + ghost state to `RackNode`; render ghost element; render reset button |

### Unchanged files
`ScreenA.tsx`, `HardwareCanvas.tsx`, `RackFrame.tsx`, `RackUnitSlot.tsx`,
`RackSideRail.tsx`, `StandaloneNode.tsx`, `SelectionContext.tsx`,
`SubsystemEditsContext.tsx`, `motion.ts`, `config.ts`, `types.ts`,
all project data files, all catalog/screen-C files.

---

## 8. Implementation steps

Each step is independently verifiable. TypeScript must stay clean after each.

### Step 1 — RackEditsContext + RackEditsProvider
- Create `RackEditsContext.tsx` with the interface and hook.
- Create `RackEditsProvider.tsx` with `useState` overlay map.
- Add `<RackEditsProvider key={project.id}>` in `HardwareLayout.tsx`.
- ✅ Checkpoint: `tsc` clean, no visual change.

### Step 2 — RackNode drag primitives
- Extend `RackNode` props: `draggable?`, `dragConstraintsRef?`,
  `onDragStart?`, `onDrag?(offsetY: number)`, `onDragEnd?(offsetY: number)`,
  `animateY?`.
- Wrap the existing `<div>` in a `motion.div` with `drag="y"` when
  `draggable` is true.
- Apply `dragElastic={0}`, `dragMomentum={false}`.
- The top-level position (`style.top`) is derived from `animateY` when
  provided, falling back to the original `topInSlotColumn`.
- ✅ Checkpoint: nodes drag freely (no snap yet) when `draggable` is passed.

### Step 3 — Snap + collision + override wiring in Rack.tsx
- Read `getPositionU`, `moveUnit`, `hasPendingEdits` from `useRackEdits()`.
- Build `effectivePositionU` for each unit by calling `getPositionU`.
- In `handleNodeDragEnd(unit, offsetY)`:
  - Compute `clampedPositionU` via snap formula.
  - Run collision check against all other units' effective ranges.
  - If valid → call `moveUnit(rack.id, unit.id, clampedPositionU)`.
  - If collision → do nothing (node springs back via framer-motion `animate`).
- Pass `animateY` = `(effectivePositionU - original.positionU) * -UNIT_HEIGHT_PX`
  (negative because `top` increases downward; moving the node up in U
  means a smaller `top` value, i.e. a negative Y offset from original).
- ✅ Checkpoint: drag + snap works; node stays at new position after release.

### Step 4 — Ghost landing slot
- Add `ghostPositionU` and `ghostRejected` state in `Rack.tsx`.
- In `handleNodeDrag(unit, offsetY)`:
  - Compute preview `clampedPositionU` (same formula, no side-effects).
  - Set `ghostPositionU` + check collision → set validity flag.
- Render ghost `<div>` in the node layer when `isSelected && ghostPositionU !== null`.
  Position it with `top = (heightU - ghostPositionU - unit.sizeU + 1) * UNIT_HEIGHT_PX`.
- Clear ghost in `handleNodeDragEnd` (after a 0 ms setTimeout so it
  doesn't flicker during the animate-to-snap transition).
- ✅ Checkpoint: ghost follows the drag, turns red on collisions.

### Step 5 — Lift effect on dragging node
- In `RackNode`, add `isDragging` state (`onDragStart` → true, `onDragEnd` → false).
- While `isDragging`: apply `filter: drop-shadow(0 0 8px rgba(255,255,255,0.5))`
  and `scale: 1.04` via framer-motion `animate` on the inner `motion.div`.
- Also raise `zIndex` to 30 while dragging so the lifted node renders above
  sibling nodes.
- ✅ Checkpoint: visible lift cue while dragging.

### Step 6 — Reset button
- In `Rack.tsx` render a `<AnimatePresence>` block just above the `RackFrame`.
- Condition: `isSelected && hasPendingEdits(rack.id)`.
- Button: `motion.button` with `RotateCcw` icon (lucide-react, already
  installed). `initial={{ opacity: 0, y: 4 }}` / `animate={{ opacity: 1, y: 0 }}`
  / `exit={{ opacity: 0, y: 4 }}`.
- On click: `resetRack(rack.id)` — all `animateY` values return to 0 →
  nodes spring back automatically.
- ✅ Checkpoint: button appears when overrides exist, springs nodes back.

### Step 7 — Polish pass
- Tune spring stiffness for the snap animate so it feels snappy but not
  jarring (target: `stiffness: 380, damping: 28`).
- Ensure drag is disabled for `rack.isEmpty` racks (already gated by
  `isSelected`, which is false for empty racks).
- Verify reset button does not appear for standalone racks (no `RackFrame`,
  so no slot grid — no drag either).
- ✅ Checkpoint: full flow feels smooth and correct.

---

## 9. Collision detection algorithm

```ts
function isOccupied(
  targetPositionU: number,
  targetSizeU: number,
  units: RackUnit[],
  draggedUnitId: string,
  getPositionU: (unitId: string, original: number) => number,
): boolean {
  const lo = targetPositionU;
  const hi = targetPositionU + targetSizeU - 1;
  for (const u of units) {
    if (u.id === draggedUnitId) continue;
    const uLo = getPositionU(u.id, u.positionU);
    const uHi = uLo + u.sizeU - 1;
    if (lo <= uHi && hi >= uLo) return true; // overlap
  }
  return false;
}
```

---

## 10. `animateY` calculation explained

`RackNode.style.top = topInSlotColumn` (px from top of slot column).
`topInSlotColumn = (heightU − positionU − sizeU + 1) × UNIT_HEIGHT_PX`.

After a move, `effectivePositionU` changes. The node must render at:
`newTop = (heightU − effectivePositionU − sizeU + 1) × UNIT_HEIGHT_PX`.

Framer-motion `animate={{ y }}` offsets from the *initial* layout position,
so:
```
animateY = newTop − topInSlotColumn
         = (effectivePositionU − originalPositionU) × (−UNIT_HEIGHT_PX)
```

When `effectivePositionU === originalPositionU` → `animateY = 0` (no offset).

---

## 11. Deferred / out of scope

- **Cross-rack drag** (move a node from one rack to another) — deferred.
- **Undo / redo** — not in this pass.
- **Persisting edits to the backend** — covered by §7 / §10 in
  `RACK-CONSTRUCTOR-PLAN.md` (TanStack Query mutations).
- **Drag-to-swap** (two nodes swap positions) — deferred.
- **Touch / pointer-events** — basic touch works via framer-motion; no
  special-casing needed for this pass.
- **Standalone node drag** — standalone nodes have no slot grid to snap to;
  drag deferred.

---

## 12. Verification checklist

- [ ] `npm run typecheck` — exits 0 after every step.
- [ ] Rack click → selects rack as before (no regression).
- [ ] Unit click inside selected rack → Screen C opens (no regression).
- [ ] Node drag Y-constrained to slot column bounds.
- [ ] Ghost follows drag in real time; goes red on collision.
- [ ] On drop in valid slot: node springs to snapped U; ghost clears.
- [ ] On drop in occupied slot: node springs back to original; ghost red flash.
- [ ] Reset button invisible in overview mode.
- [ ] Reset button visible when rack is selected + has overrides.
- [ ] Reset button click → all nodes spring back, button fades out.
- [ ] Empty racks: no drag handles (they are never selected).
- [ ] Standalone racks: no drag handles.
- [ ] Switching projects (Avaya ↔ ADGSA-AI) clears all overrides (provider
  is keyed by `project.id`).
