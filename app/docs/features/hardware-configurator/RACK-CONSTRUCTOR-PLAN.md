# Rack Constructor — Implementation Plan

> Single source of truth for the next implementation pass.
> Scope: **rack constructor only** — composable, data-driven racks built from
> atomic SVG pieces. The broader Magic integration items (URL state, polling,
> proposal screenshot, brand theming, lead-score gate, mobile/a11y, …) are
> tracked in §10 below as TODOs and addressed in the **next phase** after this
> one lands.
>
> Companion docs: `PLAN.md`, `READY.md`, `IMPLEMENTATION-PLAYBOOK.md`,
> `PROGRESS.md`, `DATA-ANALYSIS.md`.

---

## 1. Goal in one paragraph

Today the rack is rendered as a **single static PNG** (`Server_BG.png`) with
units absolutely positioned inside hardcoded percentage insets. This locks us
to one rack height (42U), one width, one visual style, and makes any future
21U / 12U / standalone variants impossible.

The new rack is a **constructor**: it composes the rack from atomic SVG
pieces (top, bottom, left border, right border, center slot) and renders
`N` unit rows according to `rack.heightU` from data. The same code renders
42U, 21U, 12U, or any future rack size, plus standalone "no rack" items.
Sizes are exposed as named tokens so changing one value retunes the whole
rack.

---

## 2. In scope / Out of scope

### In scope for this pass
- New `RackFrame` constructor that draws **top + N×unit + bottom** from SVGs.
- New `RackUnitSlot` primitive: left SVG border + center area + right SVG border.
- `RackNode` overlay that absolutely positions a chassis spanning `sizeU` slots
  inside the constructed rack.
- Centralised geometry tokens in `app/features/hardware/config.ts`.
- Drop-in replacement for the current `Server_BG.png` usage inside `Rack.tsx`
  with **zero changes to the public API** of `Rack.tsx` (same props, same
  click semantics).
- Support for any `heightU` value coming from data (42 / 21 / 12 / custom).
- Support for **N racks** in a row (already works in `ScreenA`; we just stop
  hardcoding the frame).
- Fake data only — same `hardwareProject` source used today. No backend yet.

### Out of scope (handled in next phase)
Everything in §10 — URL state, polling, optimistic mutations, brand theming,
proposal screenshot, lead-score gate, mobile/a11y, drag-and-drop, etc.

---

## 3. Source assets

Folder: `app/assets/hardware/Rack_PNG/`

| File | Use | Native size |
|---|---|---|
| `Rack_Top.svg` | Rack top frame (used) | 254 × 24.5 |
| `Rack_bottom.svg` | Rack bottom frame + feet (used) | 254 × 48.44 |
| `Rack_Unit.png` | **NOT used** — combined borders in raster | — |
| `Rack_Unit.svg` | **Not used as a whole** — we recompose its parts | 253 × 23 |

For unit side borders we synthesise the left and right rails ourselves as
the user requested — initial size `~7px × ~7px` per unit, controlled by
`UNIT_HEIGHT_PX` and `SIDE_RAIL_WIDTH_PX` tokens (see §4) and add color how of 
the top and bottom svgs item color. When dedicated.
left-only / right-only SVGs are provided, swap them in by replacing the
two `RackSideRail` background tokens — no other code changes.

Note: `Shadow.png` and `Rack_Top.png` / `Rack_bottom.png` are kept on disk
for reference but only the two `.svg` files are imported by code.

---

## 4. Geometry & configuration tokens (the configurable knobs)

All numbers below live in **one file** — `app/features/hardware/config.ts` —
so we can retune the whole rack by editing one constant.

```ts
/* Rack frame */
export const RACK_WIDTH_PX        = 76;   // visible rack width (scaled from 254)
export const RACK_TOP_HEIGHT_PX   = 8;    // ≈ 24.5 × scale
export const RACK_BOTTOM_HEIGHT_PX = 15;  // ≈ 48.44 × scale
export const RACK_GAP_PX          = 24;   // gap between racks in a row

/* Unit row */
export const UNIT_HEIGHT_PX       = 7;    // 1U on screen — user-requested
export const SIDE_RAIL_WIDTH_PX   = 7;    // left + right border each

/* Derived helpers (NEVER edit these — they read from the above) */
export const rackInnerWidthPx = () => RACK_WIDTH_PX - SIDE_RAIL_WIDTH_PX * 2;
export const rackTotalHeightPx = (heightU: number) =>
  RACK_TOP_HEIGHT_PX + heightU * UNIT_HEIGHT_PX + RACK_BOTTOM_HEIGHT_PX;
export const unitTopOffsetPx = (positionU: number, heightU: number) =>
  RACK_TOP_HEIGHT_PX + (heightU - positionU) * UNIT_HEIGHT_PX;
```

Initial values match the user spec (1U ≈ 7×7). To make racks larger later we
edit `UNIT_HEIGHT_PX` (and proportionally `SIDE_RAIL_WIDTH_PX`,
`RACK_TOP_HEIGHT_PX`, `RACK_BOTTOM_HEIGHT_PX`) — nothing else changes.

We also expose these as CSS variables in `app/app.css` for parts of the
layout that read sizes from CSS (`--rack-unit-h`, `--rack-side-rail-w`,
`--rack-top-h`, `--rack-bottom-h`, `--rack-gap`) so future brand themes can
override them via the existing `:root[data-customer="..."]` pattern without
TS edits.

---

## 5. Component decomposition

New primitives, all under `app/features/hardware/rack-constructor/`:

```
rack-constructor/
├─ index.ts                ← barrel export
├─ RackFrame.tsx           ← top SVG + N × RackUnitSlot + bottom SVG
├─ RackUnitSlot.tsx        ← <RackSideRail/> + center area + <RackSideRail/>
├─ RackSideRail.tsx        ← left or right rail (token-driven)
├─ RackNode.tsx            ← absolutely positioned chassis spanning sizeU rows
└─ StandaloneNode.tsx      ← chassis with no rack frame (for "standalone" items)
```

Responsibilities:

| Component | Inputs | Renders |
|---|---|---|
| `RackFrame` | `heightU`, `children` (nodes), optional click handler | `<RackTopSvg/>` + `heightU` × `<RackUnitSlot/>` + `<RackBottomSvg/>`; absolutely positions `children` on top |
| `RackUnitSlot` | nothing (purely visual) | `<RackSideRail side="left"/>` + spacer (empty center) + `<RackSideRail side="right"/>` |
| `RackSideRail` | `side` | one rail-shaped div; backed by a token so we can swap in real left/right SVGs later |
| `RackNode` | `positionU`, `sizeU`, `heightU`, `imageUrl`, click handlers, hover state | absolutely positioned `<img>` over slots |
| `StandaloneNode` | `imageUrl`, click handlers | chassis with no frame around it |

All five components are **stateless / props-only**. No context reads inside
the primitives — selection and edits stay above them, in the existing
`Rack.tsx` wrapper.

### `Rack.tsx` becomes a thin orchestrator
Today `Rack.tsx` does three things:
1. Holds selection / edit logic (kept).
2. Hardcodes the rack frame as one PNG with magic insets (replaced).
3. Renders unit overlays (kept, but now uses `RackNode`).

After this pass it does **only #1 and #3**, delegating #2 to `RackFrame`.

```tsx
<RackFrame heightU={rack.heightU} onClick={handleRackClick}>
  {visibleUnits.map((unit) => (
    <RackNode
      key={unit.id}
      positionU={unit.positionU}
      sizeU={unit.sizeU}
      heightU={rack.heightU}
      imageUrl={CHASSIS_IMAGE_URLS[subsystem.chassis.image]}
      isSelected={selectedUnitId === unit.id}
      isParentSelected={isSelected}
      onClick={(e) => handleUnitClick(e, unit.id, unit.subsystemId)}
    />
  ))}
</RackFrame>
```

---

## 6. Data model (fake-data shape, mirrors target backend contract)

Today the fake data has `Rack.heightU` and `RackUnit.positionU/sizeU` —
that's already enough to drive the constructor. The only addition we make
in this pass is **kind discrimination** so the constructor can render
standalone items consistently with rack-mounted ones.

```ts
// app/features/hardware/types.ts

export type RackKind = "rack-42u" | "rack-21u" | "rack-12u" | "standalone";

export interface Rack {
  id: string;
  name: string;
  shortLabel: string;
  kind: RackKind;            // ← new (defaults to "rack-42u" for existing data)
  heightU: number;           // 42 / 21 / 12 / 0 (standalone)
  units: RackUnit[];
  isEmpty: boolean;
}
```

`StandaloneNode` is reached when `kind === "standalone"` — `RackFrame` is
skipped and the chassis is rendered alone. This matches the user's flow
("the components could also be without rack and we visualise it like this").

No backend contract is locked yet — we keep iterating on the fake shape, and
when backend work starts we hand them this exact shape as the contract.

---

## 7. State management decision

Confirmed: **no Redux, no Zustand**. Reasons in
`app/docs/05-state-and-data-fetching.md` and `magic-ui-core.mdc`. The
existing Magic stack already covers our needs:

| Concern | Layer |
|---|---|
| Server data (rack layout, catalog) | TanStack Query — `EQueryKey.HARDWARE_LAYOUT`, `EQueryKey.HARDWARE_CATALOG` (added later, when real backend lands) |
| Selection (which rack/unit/category is open) | `SelectionContext` (already exists) |
| Edits (rename, qty, swap, delete) | TanStack Query mutations with `onMutate/onError/onSettled` (later) — the current demo's overlay contexts (`SubsystemEditsContext`, `ComponentEditsContext`) are kept **only for this fake-data phase** and removed when we wire the backend |

This pass doesn't change state plumbing. It only refactors **how the rack
is drawn**. The selection / edits flow stays exactly as it is.

---

## 8. File map for this pass

### New files
```
app/features/hardware/
├─ config.ts                              ← geometry tokens (§4)
└─ rack-constructor/
   ├─ index.ts
   ├─ RackFrame.tsx
   ├─ RackUnitSlot.tsx
   ├─ RackSideRail.tsx
   ├─ RackNode.tsx
   └─ StandaloneNode.tsx
```

### Changed files
- `app/features/hardware/Rack.tsx` — drop `Server_BG.png` + magic insets; use
  `RackFrame` + `RackNode`. Selection / edit logic unchanged.
- `app/features/hardware/types.ts` — add `RackKind`, add `kind` to `Rack`,
  default existing racks to `"rack-42u"` in `fake-data.ts`.
- `app/features/hardware/projects/avaya.ts` and `projects/adgsa-ai.ts` —
  add `kind: "rack-42u"` to existing racks (data migration only, no
  behavioural change).
- `app/app.css` — add the 5 CSS variables from §4 under `:root`.

### Unchanged
- `HardwareCanvas.tsx`, `ScreenA.tsx`, `ScreenC.tsx`, `TopChrome.tsx`,
  `SelectionContext.tsx`, `useActiveSubsystem.ts`, `CatalogPanel.tsx`,
  `HardwareLayout.tsx`, `motion.ts`, `chassis-assets.ts`,
  `preload-assets.ts`, both edit providers.

### Asset preload
`preload-assets.ts` adds the two new SVGs to the **critical** tier so the
first paint never shows an empty rack outline:
- `Rack_Top.svg`
- `Rack_bottom.svg`

`Server_BG.png` stays on disk for now (rollback safety); we remove it from
the preload list and remove the import from `Rack.tsx`. Delete the file in
a follow-up cleanup commit.

---

## 9. Phased implementation steps

Each step is independently verifiable; after every step `npm run typecheck`
and a manual cold-load of `/avaya` must stay green.

### Step 1 — Tokens + types
- Add `app/features/hardware/config.ts` with the constants from §4.
- Add CSS variables to `app/app.css`.
- Add `RackKind` to `types.ts`, default existing racks in fake data.
- ✅ Checkpoint: `tsc` clean. No visual change.

### Step 2 — Primitives (no integration yet)
- Create the 5 files in `rack-constructor/`.
- `RackFrame` imports the two SVGs as components (`?react`) so they accept
  className/style and inherit `currentColor` for future tinting.
- Add a temporary debug route or storybook-style test in dev only (or
  simply unit-test by rendering a `<RackFrame heightU={42}/>` somewhere
  off the main canvas) to verify shape.
- ✅ Checkpoint: visual primitives render in isolation.

### Step 3 — Swap inside `Rack.tsx`
- Replace the `<img src={rackFrameUrl}/>` + magic-inset `<div>` with
  `<RackFrame heightU={rack.heightU}>` and convert each unit into a
  `<RackNode/>`.
- Preserve every existing behaviour: scale-on-select, hover ring, unit
  click → selectSubsystem sync, deleted-subsystem filtering.
- Delete `RACK_ASPECT`, `TOP_INSET_PCT`, `BOTTOM_INSET_PCT`,
  `LEFT_SIDE_INSET_PCT`, `RIGHT_SIDE_INSET_PCT` — replaced by tokens.
- ✅ Checkpoint: `/avaya` looks like before (just smaller per tokens),
  selection and Screen C navigation unchanged.

### Step 4 — Preload + asset hygiene
- Add the two SVGs to `preload-assets.ts` critical tier.
- Remove `Server_BG.png` from the preload list (file stays on disk for
  rollback).
- Remove `Server_BG.png` import from `Rack.tsx`.
- ✅ Checkpoint: view-source of static `index.html` shows the two new
  `<link rel="preload">` tags; cold load is flicker-free.

### Step 5 — Standalone node
- Branch in `Rack.tsx` (or earlier in `ScreenA`) on `rack.kind ===
  "standalone"` → render `<StandaloneNode/>` instead of `<RackFrame/>`.
- Add one fake standalone entry to the Avaya project so we can visually
  confirm it renders without a frame.
- ✅ Checkpoint: standalone item appears next to the racks; no frame.

### Step 6 — Tune
- Adjust `UNIT_HEIGHT_PX`, `SIDE_RAIL_WIDTH_PX`, `RACK_TOP_HEIGHT_PX`,
  `RACK_BOTTOM_HEIGHT_PX`, `RACK_GAP_PX` until the look matches your
  intent. This is purely a config tweak — no code changes.
- ✅ Checkpoint.

### Step 7 — Dead code & asset cleanup (mandatory final step)
This pass replaces a real piece of the demo, so we **must** finish by
deleting everything the new constructor obsoletes. Done in one focused
cleanup commit at the very end, after Steps 1–6 are signed off.

Files / imports / constants removed:
- `app/assets/hardware/verstka/Server_BG.png` — the old rack frame PNG.
- Any `Server_BG.png` import in `Rack.tsx` (already removed in Step 4) and
  any leftover reference anywhere else in the repo (verify with
  `rg "Server_BG"`).
- `RACK_ASPECT`, `TOP_INSET_PCT`, `BOTTOM_INSET_PCT`,
  `LEFT_SIDE_INSET_PCT`, `RIGHT_SIDE_INSET_PCT` constants in `Rack.tsx`
  (already removed in Step 3) — verify none crept back in.
- `Rack_Unit.png` and `Rack_Unit.svg` from the new `Rack_PNG/` folder if
  they end up unreferenced (user already excluded them).
- Any orphaned PNG variants of the new SVGs in `Rack_PNG/` that the
  constructor doesn't load (`Rack_Top.png`, `Rack_bottom.png`,
  `Shadow.png` — check each with `rg` before deleting).
- Any helper / constant / type added during exploration that didn't end
  up wired into the final code.
- `preload-assets.ts` — confirm `Server_BG.png` is removed and the two
  new SVGs are present.

Verification commands (run all three before committing):
```bash
rg -n "Server_BG" magic-ui-dev/app                       # must be empty
rg -n "Rack_Unit\\.(png|svg)" magic-ui-dev/app           # must be empty
rg -n "RACK_ASPECT|TOP_INSET_PCT|BOTTOM_INSET_PCT|LEFT_SIDE_INSET_PCT|RIGHT_SIDE_INSET_PCT" magic-ui-dev/app  # must be empty
```

Also check binary asset orphans:
```bash
git ls-files magic-ui-dev/app/assets/hardware | while read f; do
  base="$(basename "$f")"
  rg -q --fixed-strings "$base" magic-ui-dev/app || echo "ORPHAN: $f"
done
```
Each `ORPHAN:` line is either (a) safe to delete or (b) needs an explicit
"keep for rollback" note in the commit message.

- ✅ Final checkpoint. After this commit, the repo contains zero references
  to the pre-constructor rack code or its assets.

---

## 10. TODOs deferred to the next phase (after rack constructor)

Captured here so we don't lose them when we start the real Magic
integration. Order is loose — final ordering picked when we plan that
phase.

1. **URL deep-linking.** Keep the existing `/projects/:id/systems/:systemId`
   shape. Decide whether `?rack=…&unit=…` belongs in the URL for proposal
   sharing.
2. **Lead-score gate.** Confirm hardware-flow behaviour when
   `parseLeadScore(project.lead_score) <= 2.0`.
3. **Polling.** If backend generates rack layout asynchronously, reuse
   `useProjectPolling`/`useSubsystemPolling` patterns.
4. **Optimistic mutations.** Replace `SubsystemEditsContext` and
   `ComponentEditsContext` overlay pattern with TanStack Query
   `useMutation` + `onMutate/onError/onSettled` + dependent-key
   invalidation.
5. **Sidebar slots.** Reuse existing `SidebarLeft` / `SidebarRight`
   slot props (`topSlot`, `priceOverride`, `catalogSlot`, `chatSlot`,
   `onPreviewProposalClick`, `onNavItemSelect`). Never fork sidebars.
6. **Proposal screenshot.** `utils/downloadProposal.ts` snapshots
   `#stack-container`. Decide whether the rack view replaces or augments
   this for the `.docx` export, and which snapshotter (`html-to-image`
   vs `html2canvas-pro`) to use.
7. **`DiagramContext` extension.** `"dell" | "nvidia"` may grow a
   `"hardware"` mode, or hardware lives as its own surface inside the
   Design tab.
8. **Asset preload.** Continue extending `preload-assets.ts` for any new
   chassis or border SVGs.
9. **Linux/Vercel case sensitivity.** Every asset import must match disk
   casing exactly.
10. **Customer theming (`data-customer`).** Hook the rack colour /
    background tokens into the `:root[data-customer="..."]` override
    system so brands can retint the rack without code changes.
11. **Empty / loading / error states.** Once we move to real data, add
    `<Loader2/>` and an empty state for projects that have no racks yet.
12. **Mobile / accessibility / i18n.** Project-wide gap; document the
    deferral so it's not assumed working.
13. ~~**Drag-and-drop inside a rack.** Deferred from v1.~~ **DONE** — and
    extended to **cross-rack** moves. Built on `@dnd-kit/core` + framer-motion
    (this supersedes the "no drag library" note in §7); see
    `RACK-NODE-EDITOR-PLAN.md` §13.
14. **"Change" chassis flow + the `+` carousel button.** Deferred from v1.
15. **Magic AI Advisor adapting to hardware context.** Deferred from v1.
16. **EQueryKey additions.** `HARDWARE_LAYOUT`, `HARDWARE_CATALOG` (and
    polling variant if needed) added when backend wiring starts.
17. **Real left/right border SVGs.** Replace the synthesised
    `RackSideRail` with provided assets when delivered.
18. **Delete unused assets.** Remove `Server_BG.png` from disk once the
    new constructor has been live for a release.

---

## 11. Verification checklist (run after every step)

- [ ] `npm run typecheck` — exits 0.
- [ ] `npm run build` — exits 0 on both macOS and Linux paths.
- [ ] Cold load of `/avaya` shows no flash of empty rack outline.
- [ ] Click a rack → it scales up, centres, neighbours blur.
- [ ] Click a unit inside the selected rack → Screen C opens for that
      subsystem (matching the existing demo behaviour).
- [ ] Click an empty rack → no selection change.
- [ ] Delete a subsystem from the Catalog → its units disappear from the
      rack; restoring → they come back (existing behaviour preserved).
- [ ] Changing `UNIT_HEIGHT_PX` in `config.ts` resizes the whole rack
      proportionally without breaking unit alignment.
- [ ] A `kind: "standalone"` entry renders the chassis without a rack
      frame.
- [ ] Static `index.html` includes `Rack_Top.svg` and `Rack_bottom.svg`
      under `<link rel="preload">`.
- [ ] After Step 7: `rg "Server_BG"`, `rg "Rack_Unit\.(png|svg)"`, and
      `rg "RACK_ASPECT|TOP_INSET_PCT|BOTTOM_INSET_PCT|LEFT_SIDE_INSET_PCT|RIGHT_SIDE_INSET_PCT"`
      all return zero matches.
- [ ] After Step 7: no orphan asset under `app/assets/hardware/` that the
      constructor doesn't load (unless explicitly kept for rollback with a
      comment in the commit message).

---

## 12. Out of this pass on purpose

- The existing 2-project Avaya + ADGSA-AI demo shell stays intact.
- The right-sidebar catalog / `CatalogPanel` is untouched.
- Animation timings (`motion.ts`) are unchanged.
- `useActiveSubsystem`, `useCatalogScope`, and both edit providers are
  unchanged.

We move on those when we start the real-Magic integration phase, with the
TODO list in §10 as the work plan.
