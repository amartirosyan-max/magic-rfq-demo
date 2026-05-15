# Hardware Configurator — Re-Implementation Playbook

> Captures **everything** we built on the demo repo (`magic-rfq-demo`,
> branch `dev` → `main`) starting from the baseline commit
> `eac54759ac02d16c2a3736174f6316bb5f3c0ce3` so we can rebuild this
> feature in the real Magic project from a clean checkout.
>
> Scope: the **/avaya** hardware-configurator demo only. Files outside
> `app/features/hardware/`, `app/docs/features/hardware-configurator/`,
> `app/assets/hardware/`, plus a few touch-points in the existing
> sidebars and routing.
>
> Read this top-to-bottom **once** before you start. Then use §4 as the
> step list and §5–§12 as deep-dives when you hit each step.

---

## 0. The product in 30 seconds

Three "screens" rendered inside the existing 3-column app shell:

```
┌────────────┬──────────────────────────────────┬─────────────┐
│ SidebarLeft│   Canvas (HardwareCanvas)        │ SidebarRight│
│            │                                  │             │
│ Project    │   Screen A — multi-rack overview │  Tabs:      │
│  ├ Hyper-V │   Screen C — chassis details     │   AI / Team │
│  ├ VMware  │     (no Screen B in v1)          │   /Catalog  │
│  ├ SAN     │                                  │             │
│  └ …       │                                  │  Catalog    │
│            │                                  │  L0 / L1/L2 │
└────────────┴──────────────────────────────────┴─────────────┘
```

- **No backend.** `fake-data.ts` is the source of truth, projected onto
  the existing sidebar components via `adapter.ts`.
- **No URL state.** Selection lives entirely in React context.
- **Two overlay stores** sit on top of `fake-data.ts`:
  - `SubsystemEditsContext` — rename / qty / delete / chassis-swap.
  - `ComponentEditsContext` — qty / description / delete a component row.
- **Right sidebar Catalog** is **selection-aware** (L0/L1/L2 levels) —
  picking a subsystem, a rack unit, or a Screen-C row drills the
  catalog automatically; the catalog's back-arrow walks back.

---

## 1. Commit history that produced this state

Anchor commit (do NOT touch anything below this — pre-feature
baseline):

```
eac54759 chore: baseline magic-ui-dev as received
```

Feature work since then, in order:

| # | SHA | What | Notes |
|---|-----|------|-------|
| 1 | `28a315d` | docs, types, fake-data tree, Verstka assets | All planning + types.ts + fake-data.ts. **No UI**. |
| 2 | `c21a71e` | route `/` → `/avaya`, demo entry route | Placeholder page; confirms data tree wiring. |
| 3 | `f2114b9` | docs only | Step-2 hash record. |
| 4 | `548c708` | Screen A — 3-part shell + multi-rack canvas | First UI commit. Built parallel sidebars (later removed). |
| 5 | `5c5fdae` | docs only | Step-3 hash record. |
| 6 | `9761ab9` | reuse existing sidebars + Screen-A chrome fix | Adapter, deletes parallel sidebars, fixes rack aspect. |
| 7 | `d036144` | docs only | |
| 8 | `c4c9733` | initial hardware configurator + related updates | Adds `HardwareCanvas`, `ScreenC`, `SelectionContext`, `useActiveSubsystem`, more PNG/SVG assets. |
| 9 | `eaa7a0e` | selectable Screen C + context-aware catalog rewrite | The big one — **this is where the catalog L0/L1/L2 system is born.** Adds `CatalogPanel`, `useCatalogScope`, `catalog-data.ts`. |
| 10 | `9ed739b` | catalog-driven edits + rack absolute-U placement | `SubsystemEditsContext` + `ComponentEditsContext`. |
| 11 | `ee2dde7` | Fast-Refresh-safe context split + real Swap action | Splits each Edits context into `*Context.tsx` (hook+types) + `*Provider.tsx` (component). Catalog cards lose decorative buttons. |
| 12 | `521abfe` | preload rack/chassis/component images at app start | `preload-assets.ts` + `<link rel="preload">` in `root.tsx`. |
| 13 | `b571a4e` | Dr. Artemy UI polish pass | Adds `BG_Blue.jpg` gradient, polishes chrome. |
| 14 | `7108a8a` | image fixes | Real Dell product photos (R660 / R760 / Unity / DS-6610B / S5224F-ON / N3248TE-ON) wired into Rack + Screen C + preload. |
| 15 | `be2e6bb` | restore lowercase `dell-poweredge-r660.png` import | Vercel-on-Linux build fix (case sensitivity). |
| 16 | `(pending)` | responsive + stability fixes | Restores Preview Proposal as a demo reset, aligns left nav/header widths, makes Screen C responsive, constrains right-sidebar catalog scrolling, and removes selection/hover jitter. |

If you replay this in the real project, you can collapse 1–8 into a
single "scaffold" commit. 9–16 are each independently useful and
should stay separate.

---

## 2. What lives where (current file map)

### 2.1 `app/features/hardware/` — feature module

| File | Role |
|---|---|
| `types.ts` | All public data types: `ComponentCategory`, `HardwareComponent`, `Chassis`, `Subsystem`, `RackUnit`, `Rack`, `CatalogStatus`, `CatalogEntry`, `HardwareProject`. |
| `fake-data.ts` | The Avaya project tree + `subsystemCategories` + `productAlternatives`. Single source of truth for the demo. |
| `catalog-data.ts` | The full Dell SKU catalog (servers, switches, CPUs, RAM, storage, power) + `platformCatalog` + `inProposalCatalogId`. |
| `adapter.ts` | `getFakeProject() / getFakeProjectPrice() / getFakeNavItems()` — projects `hardwareProject` into the shapes the existing sidebars expect. |
| `preload-assets.ts` | Single source of truth for the `<link rel="preload">` manifest. Critical (above-the-fold) vs deferred (Screen C) tiers. |
| `SelectionContext.tsx` | Provider + hook. Tracks `selectedSubsystemId / selectedRackId / selectedUnitId / selectedCategoryId`. Pure client state. |
| `SubsystemEditsContext.tsx` | Hook + types only (no component) — Fast-Refresh boundary. |
| `SubsystemEditsProvider.tsx` | The `<SubsystemEditsProvider>` component. Stores name / qty / delete / chassis-swap overlays. Exposes `applyEdits(s)` and `effectiveSubsystems(list)`. |
| `ComponentEditsContext.tsx` | Same split — hook + types. |
| `ComponentEditsProvider.tsx` | The `<ComponentEditsProvider>` component. Stores qty / description / delete overlays. Exposes `effectiveComponents(subsystem)`. |
| `useActiveSubsystem.ts` | Resolves "which subsystem is open in Screen C right now?" from `selectedUnitId` (rack click) → `selectedSubsystemId` (sidebar click) → `null`. Applies subsystem edits. |
| `useCatalogScope.ts` | Walks the right sidebar between `project` / `subsystem` / `chassis` views. Self-heals when the in-proposal SKU isn't in `catalog-data.ts` (synthesises a one-off `CatalogEntry` from `Subsystem.chassis`). |
| `HardwareLayout.tsx` | The 3-column shell. Wraps providers and feeds the existing `SidebarLeft` / `SidebarRight` via `adapter.ts`. Owns the stale-selection cleanup effects. |
| `HardwareCanvas.tsx` | The middle column. Owns the blueprint background (`BG_Blue.jpg` gradient + `BG_Blue_Grid_Tile_2.png`) and switches between `<ScreenA>` / `<ScreenC>` via `AnimatePresence`. |
| `HardwareLogo.tsx` | The Magic logo + project label injected as `topSlot` into `SidebarLeft`. |
| `TopChrome.tsx` | The breadcrumb + Design / Questions / Price tabs + rack-carousel pill. |
| `ScreenA.tsx` | The 4-rack canvas. Centres the selected rack via row-translation `%`. |
| `ScreenC.tsx` | Chassis detail. Page title, component cards stack, chassis hero. Cards / hero are click-selectable. Responsive: centred stack while it fits; component list scrolls when cramped; chassis hero switches to a compact column under narrow canvas widths. |
| `Rack.tsx` | One rack: frame image + absolutely-positioned unit images derived from `positionU` / `sizeU`. |
| `CatalogPanel.tsx` | Top-level switcher for L0 (project) / L1 (subsystem alternatives) / L2 (chassis chips + per-category SKU list). Owns the sticky breadcrumb + back-arrow. |
| `CatalogEntryCard.tsx` | The unified catalog card — renders L0 / L1 / L2 entries with one visual language. Optional `actionLabel + onAction` for primary actions (Swap / Restore). |
| `StatusBadge.tsx` | "In proposal" / "Removed" / "Not in proposal" pill. |

### 2.2 `app/docs/features/hardware-configurator/` — feature docs

| File | Purpose |
|---|---|
| `PLAN.md` | Original design notes. |
| `READY.md` | Pre-implementation readiness checklist. |
| `USER-FLOW.md` | Canonical user flow (Screens A / B / C). |
| `IMPLEMENTATION.md` | Block-by-block Q&A from initial scope discussion. |
| `PROGRESS.md` | Per-step commit hash tracker. |
| `DATA-ANALYSIS.md` | How the Avaya BoQ maps to the data model. |
| `HARDWARE-DEMO-DATA-INVENTORY-PM.md` | PM-facing data inventory. |
| `DELL-INFRASTRUCTURE-SKU-CATALOG.md` | Verbatim extract of the Dell SKU master xlsx (source of truth for `catalog-data.ts`). |
| `HARDWARE-DEMO-FULL-CHANGELOG.md` | Running change log. |
| `IMPLEMENTATION-PLAYBOOK.md` | **(This file.)** |
| `source/avaya-ipo200.txt` | The original BoQ text used to build `fake-data.ts`. |

### 2.3 `app/assets/hardware/`

```
PNG+SVG/                  ← deduped + organised verstka assets
  BG_Blue.jpg             ← canvas base gradient (preloaded critical)
  BG_Blue_Grid_Tile_2.png ← grid tile (preloaded critical)
  Component_*.png         ← 5 component-hero icons (preloaded deferred)
  Server_BG.png           ← rack frame
  Logo.svg / Logo_text.svg
  Avatar_*, Bt_*, Nav_bar_*, Server_select_* …  (decoration; ad-hoc)
verstka/                  ← original design pack (kept for parity)
  Component_*.png         ← duplicates that ALSO get preloaded
  Server_BG.png, Logo.svg, Logo_text.svg
  Server_Dell_03.png      ← stylised stand-in (Unity now uses real photo, kept for safety)
products/                 ← REAL product photos (added in commit 7108a8a)
  Dell-PowerEdge-R660.png
  Dell-PowerEdge-R760.png
  DELL-UNITY-XT-380F.png
  Dell-Connectrix-DS-6610B.png
  Dell-EMC-S5224F-ON.png
  Dell-EMC-N3248TE-ON.png
```

### 2.4 Touch-points outside the feature

- `app/routes.ts` + `app/routes/index.tsx` + `app/routes/avaya/index.tsx`
  — register `/avaya` outside `PrivateRoute`; root `/` redirects to it.
- `app/components/sidebar-left.tsx` — slot props (`topSlot`,
  `priceOverride`, `disableHeaderClick`, `hidePrimaryAction`,
  `onPreviewProposalClick`, `onNavItemSelect`). Hardware uses
  `onPreviewProposalClick` to reset to the rack overview instead of
  navigating to a backend project proposal.
- `app/components/sidebar-right.tsx` — slot props (`catalogSlot`,
  `chatSlot`, `defaultTab`, `optionsBgColor`). It also keeps tab chrome
  fixed and lets tab content scroll internally.
- `app/components/nav-main.tsx` — picked up the `onItemSelect`
  callback used by the demo to drive `selectSubsystem`; hardware rows
  are full-width, square-corner controls aligned to the project card.
- `app/root.tsx` — spreads `hardwarePreloadAssets` into the root
  `links()` export so the `<link rel="preload">` tags land in the
  static SPA shell (route-level `links()` don't reach it in SPA mode).
- `app/constants/assetMapping.ts` — *unrelated* to the hardware
  feature, but the only file outside the feature that touches the
  filesystem-case-sensitive Vercel build (see §13.4).

---

## 3. Architectural principles (don't break these)

1. **No backend.** All values come from `fake-data.ts`. If you ever
   need a real API, swap `adapter.ts` to call it; nothing else
   changes.
2. **No URL state.** Selection is React context. The URL stays
   `/avaya` no matter how deep you drill. Adding routing means breaking
   browser back/forward semantics for a demo that doesn't need it.
3. **Reuse the existing sidebars.** Never rebuild `SidebarLeft` /
   `SidebarRight` for this feature. We tried in commit 4 and ripped
   it out in commit 6. The slot pattern is enough.
4. **Edits are overlays.** `SubsystemEditsContext` and
   `ComponentEditsContext` never mutate `fake-data.ts`. They project
   onto it at read time via `applyEdits()` / `effectiveComponents()`.
   This keeps the static data inspectable, makes "Reset" trivial, and
   means a refresh always returns to the BoQ truth.
5. **Catalog cards are one component.** `CatalogEntryCard` renders L0,
   L1, and L2. Resist the urge to fork it — extend `CatalogEntry`
   with optional fields instead.
6. **Preload above-the-fold images.** Never let users see an empty
   rack frame waiting for chassis PNGs. The manifest in
   `preload-assets.ts` is the single place to declare new critical
   assets.
7. **`useCatalogScope` self-heals.** If a proposal SKU isn't in
   `catalog-data.ts`, synthesise a one-off `CatalogEntry` from
   `Subsystem.chassis`. The user never sees a broken catalog.
8. **Filenames are case-sensitive.** macOS lies. Treat every asset
   import as if it were on Linux. See §13.4 for the rule.

---

## 4. Implementation order (do this on the real project)

The order matters because each step compiles + runs without depending
on a later one. You can ship after any step.

### Step 0 — repo prep

- Verify the existing `SidebarLeft` / `SidebarRight` slot props exist
  (`topSlot`, `priceOverride`, `catalogSlot`, `chatSlot`,
  `onPreviewProposalClick`, `onNavItemSelect`, `optionsBgColor`). If not,
  port them — they're tiny additive
  changes (commit `9761ab9` shows the exact diff).
- Add `framer-motion` to `package.json` if not already there.
- Drop the `app/assets/hardware/PNG+SVG/`, `verstka/`, and `products/`
  asset folders into the repo. Verify case sensitivity in commit
  (Linux build).

### Step 1 — types + data

- Add `app/features/hardware/types.ts` (verbatim from this repo).
- Add `app/features/hardware/fake-data.ts` (Avaya tree). Keep all
  values verbatim from the BoQ (`source/avaya-ipo200.txt`).
- Sanity check: a one-line `import { hardwareProject } from
  './fake-data'` in any route, then `console.log` it.

### Step 2 — route entrypoint

- Register `/avaya` **outside** the `PrivateRoute` wrapper (the demo
  is publicly viewable).
- Make `/` redirect to `/avaya`.
- Land a placeholder route that just renders subsystem names — this
  proves the data tree is reachable end-to-end.

### Step 3 — adapter + 3-column shell

- Add `adapter.ts` (verbatim from this repo).
- Add `HardwareLayout.tsx` (the 3-column shell — see §6 for details).
- Inside the SidebarInset, render placeholder text. Sidebars should
  now show the project header, Grand Total, and the 6 subsystem nav
  rows.
- **Verification:** clicking a subsystem nav row does nothing yet —
  expected. The next step wires Selection.

### Step 4 — selection state + Screen A

- Add `SelectionContext.tsx` with `selectedSubsystemId / selectedRackId
  / selectedUnitId` (skip `selectedCategoryId` until Step 7).
- Add `useActiveSubsystem.ts`.
- Add `Rack.tsx` (rack frame + absolute-U positioned units).
- Add `ScreenA.tsx` (4-rack row with row-translation `%` to centre the
  selected rack).
- Add `HardwareCanvas.tsx` rendering Screen A. The blueprint
  background = solid blue + tiled grid (BG_Blue.jpg comes in Step 9).
- Add `TopChrome.tsx` (breadcrumb + Design tab + carousel pill).
- Wire `onNavItemSelect` on `SidebarLeft` to call `selectSubsystem`.
- **Verification:** click a rack → it scales up + centres. Click a nav
  row → still no Screen C, but the breadcrumb updates.

### Step 5 — Screen C

- Add `ScreenC.tsx` (page title + component cards stack + chassis hero).
  Cards are click-selectable (visual-only at this step — Step 7 wires
  the Catalog).
- Update `HardwareCanvas` to swap to `<ScreenC>` when
  `useActiveSubsystem()` returns non-null.
- **Verification:** clicking a sidebar nav row OR a rack unit now
  renders the chassis detail.

### Step 6 — catalog data

- Add `catalog-data.ts` (full SKU catalog).
- Notes:
  - **S5224F-ON, DS-6610B, DS-7720B** are *not* in the source xlsx but
    are needed because the BoQ uses them. Add them by hand — see the
    file's top comment for the rationale.
  - `platformCatalog[subsystemId]` and `inProposalCatalogId[subsystemId]`
    are the two maps `useCatalogScope` reads.

### Step 7 — selection-aware Catalog (L0/L1/L2)

- Extend `SelectionContext` with `selectedCategoryId: ComponentCategory
  | null`. Auto-clear it on subsystem / unit / rack change.
- Add `useCatalogScope.ts` (`{ kind: "project" } | { kind: "subsystem",
  subsystem, alternatives, selectedId } | { kind: "chassis",
  subsystem, unitId, contextEntry }`).
- Add `CatalogEntryCard.tsx` (the unified card with optional
  `actionLabel + onAction`).
- Add `StatusBadge.tsx`.
- Add `CatalogPanel.tsx` — top-level switcher with the sticky
  breadcrumb + back-arrow logic.
- Wire `<CatalogPanel />` into `SidebarRight`'s `catalogSlot` prop in
  `HardwareLayout`.
- Wire `ScreenC` rows + chassis hero to `selectCategory` /
  `selectUnit(null)` so canvas clicks drive the panel.
- **Verification:** sidebar pick → L1 alternatives. Rack click → L2
  chip row + chassis context card. Click a Screen-C row → L2 SKU
  list for that category. Back-arrow walks up.

### Step 8 — overlays (subsystem + component edits)

- Add `SubsystemEditsContext.tsx` (hook + types) +
  `SubsystemEditsProvider.tsx` (provider). **Two files** — see §13.1
  for the Fast-Refresh reason.
- Same split for `ComponentEditsContext.tsx` /
  `ComponentEditsProvider.tsx`.
- Add `<SubsystemEditsProvider>` and `<ComponentEditsProvider>` inside
  `HardwareLayout` (between `<SelectionProvider>` and the inner shell).
- Add the `<SubsystemEditCard>` to `CatalogPanel` (rename, qty stepper,
  delete) — only visible at L1.
- Add the per-component edit affordance to L2 (qty / description /
  delete / restore).
- Stale-selection cleanup: in `HardwareLayout`, two `useEffect`s clear
  the selection if a subsystem is deleted while it (or one of its
  units) is selected.
- **Verification:** rename a subsystem → sidebar nav + Screen-C title
  + breadcrumb update live. Delete it → it disappears from the canvas
  and shows up at the top of L0 with a Restore button.

### Step 9 — preload manifest

- Add `preload-assets.ts` (critical / deferred lists).
- In `app/root.tsx` `links()`, spread `hardwarePreloadAssets.map(a =>
  ({ rel: "preload", as: "image", href: a.href, fetchPriority:
  a.priority }))`.
- Why root and not the `/avaya` route's `links()`? See §13.2.
- **Verification:** view-source the static `index.html` — should
  contain ~10 `<link rel="preload" as="image">` tags with no `data:`
  URIs.

### Step 10 — UI polish

- Replace solid blue canvas with the `BG_Blue.jpg` gradient. Keep
  `bg-[#3b6bb1]` as the same-tone fallback for the millisecond before
  the JPG decodes.
- Render the tiled grid at `backgroundSize: "72px 72px"` and
  `opacity-65`. Animate `scale` from `1` → `1.8` on dive (current
  tuning in `HardwareCanvas.tsx`). Earlier the value was `1.06` for
  a barely-perceptible nudge — pick the one that matches the design
  intent at the time.
- Brand polish — `#3744a6` (brand blue) for in-proposal indicators
  in the right sidebar; `#70CDFF` (sky cyan) for the Screen-C active
  ring (it has to read on top of the blue canvas — see §12).
- Left-sidebar polish:
  - project card background = `#dce7f8` (not the older `#c2eaff`).
  - project card keeps `rounded-md`; nav rows/sub-rows are `rounded-none`.
  - nav content and project card align despite the `7px` custom scrollbar:
    `SidebarHeader` reserves `pr-[7px]`, `SidebarContent` gets a small
    top margin.
  - `Preview Proposal` is visible in the hardware demo and calls
    `onPreviewProposalClick` to clear rack/unit/subsystem focus, returning
    to Screen A with no selected rack.
- Right-sidebar polish:
  - `optionsBgColor="#dde5ea"` for the hardware catalog panel.
  - tab header stays fixed; the active tab body scrolls internally.
  - Catalog body is `h-full min-h-0` with an internal scroll region below
    the breadcrumb.
- Screen-C responsive polish:
  - title gets extra top clearance below `TopChrome`.
  - cards + chassis form a centred stack while they fit.
  - when vertical space is tight, only the component-card list scrolls.
  - under narrow canvas widths (sidebars still visible), `ChassisHero`
    switches from horizontal image/card to a compact column so the
    description card stays readable and does not become very tall.
  - selected component/chassis states use reserved `ring-2 ring-inset`;
    no outside ring/glow expansion that changes the visual footprint.

### Step 11 — real product photos

- Drop the 6 product PNGs into `app/assets/hardware/products/`.
- Update `Rack.tsx` + `ScreenC.tsx` `SERVER_IMAGES` maps + the
  preload manifest. Filenames mirror the SKU (case-sensitive!).
- Update `fake-data.ts` so each `Chassis.image` points to the new
  filename.

---

## 5. The data model in one breath (`types.ts`)

The model is intentionally flexible — strings everywhere, no enums for
spec values. The shapes:

```ts
type ComponentCategory = "cpu" | "memory" | "storage" | "network" | "power";

interface HardwareComponent {
  id: string;
  category: ComponentCategory;
  categoryLabel: string;     // "CPU" / "Memory" / "Hard Drive / SSD"
  description: string;       // verbatim BoQ spec line
  qty: number;               // per single chassis
}

type SubsystemKind = "compute" | "storage" | "switch";

interface Chassis {
  id: string;
  name: string;              // "Dell PowerEdge R660"
  vendor: string;            // "dell"
  sizeU: number;             // 1, 2, …
  image: string;             // filename under products/ or verstka/
  description: string;
  watts?: number;
  btuPerHr?: number;
}

interface Subsystem {
  id: string;
  name: string;              // sidebar label, e.g. "Hyper-v cluster"
  titleSuffix: string;       // Screen-C title trailer
  kind: SubsystemKind;
  qty: number;               // # of chassis in this subsystem
  chassis: Chassis;
  components: HardwareComponent[];   // empty for switches
}

interface RackUnit {
  id: string;
  subsystemId: string;
  positionU: number;         // 1 = bottom
  sizeU: number;
}

interface Rack {
  id: string;
  name: string;
  shortLabel: string;
  heightU: number;           // 42 in v1
  units: RackUnit[];
  isEmpty: boolean;
}

type CatalogStatus = "in-proposal" | "removed" | "not-in-proposal";

interface CatalogEntry {
  id: string;
  name: string;
  status: CatalogStatus;
  description: string;
  image?: string;
  // Optional enrichments (L1 / L2):
  price?: string;            // "~$4,500"
  bestFor?: string;          // "Dense compute nodes"
  spec?: string;             // "32C / 64T · 300W · 60MB L3"
}

interface HardwareProject {
  id: string;
  name: string;
  leadScore: string;         // "9.6/10"
  grandTotalUSD: number;
  subsystems: Subsystem[];   // display order
  racks: Rack[];             // display order: [empty, R01, R02, empty]
  subsystemCategories: CatalogEntry[];  // legacy L0 cards (pre-rewrite)
  productAlternatives: Record<string, CatalogEntry[]>;  // legacy L1
}
```

The two `CatalogEntry`-flavoured maps in `HardwareProject` are
**legacy** — the new system reads from `catalog-data.ts` instead. They
stay for backward compatibility but you can ignore them in v2.

---

## 6. Adapters & sidebar reuse (`adapter.ts` + `HardwareLayout.tsx`)

The whole point of `adapter.ts` is "**don't touch the existing
sidebars; feed them fake data**".

```ts
// adapter.ts (sketch)
export function getFakeProject(): ProjectResponse { …pull from hardwareProject… }
export function getFakeProjectPrice(): IProjectPriceResponse { …Grand Total… }
export function getFakeNavItems(
  selectedSubsystemId: string | null,
  subsystems: Subsystem[],     // edited subsystems!
): NavItem[] { … }
```

Important details:

- `getFakeProject()` must set `lead_score > 2.0`, otherwise the real
  sidebar redirects to `/lead-score`.
- `getFakeNavItems()` takes the **edited** subsystem list (after
  `effectiveSubsystems()`) so renames + deletes flow into the nav.
- Each nav item carries `hr_uid: subsystem.id`, which the layout's
  `onNavItemSelect` callback reads to drive `selectSubsystem`.

`HardwareLayout` provider stack (top → bottom):

```tsx
<SelectionProvider>
  <SubsystemEditsProvider>
    <ComponentEditsProvider>
      <DiagramProvider>           {/* existing app provider */}
        <SidebarProvider>
          {SidebarLeft + SidebarInset(children) + SidebarRight}
        </SidebarProvider>
      </DiagramProvider>
    </ComponentEditsProvider>
  </SubsystemEditsProvider>
</SelectionProvider>
```

Slot props passed to existing sidebars:

- `SidebarLeft.topSlot` = `<HardwareLogo />` (Magic logo + project label).
- `SidebarLeft.priceOverride` = `{ label: "Grand Total:", value: "$644,475" }`.
- `SidebarLeft.disableHeaderClick` — true (the project card itself does not
  route away from `/avaya`).
- Do **not** pass `hidePrimaryAction` in hardware anymore. The header keeps
  `Preview Proposal` visible.
- `SidebarLeft.onPreviewProposalClick` — clears rack/unit/subsystem focus
  (`selectRack(null); selectSubsystem(null);`) so Preview Proposal returns
  to Screen A with no selected rack instead of navigating to
  `/projects/:id?tab=proposal`.
- `SidebarLeft.onNavItemSelect` — drives `selectSubsystem`.
- `SidebarRight.catalogSlot` = `<CatalogPanel />`.
- `SidebarRight.chatSlot` = friendly "coming soon" placeholder.
- `SidebarRight.sidebarMode = "options"`, `category = "infrastructure"`,
  `defaultTab = "options"`, `optionsBgColor = "#dde5ea"`.

Two stale-selection cleanup `useEffect`s sit in `HardwareLayoutInner`:

```tsx
useEffect(() => {
  if (selectedSubsystemId && isDeleted(selectedSubsystemId)) {
    selectSubsystem(null);
  }
}, [selectedSubsystemId, isDeleted, selectSubsystem]);

useEffect(() => {
  if (!selectedUnitId) return;
  for (const rack of hardwareProject.racks) {
    const unit = rack.units.find((u) => u.id === selectedUnitId);
    if (unit && isDeleted(unit.subsystemId)) {
      selectUnit(null);
      return;
    }
  }
}, [selectedUnitId, isDeleted, selectUnit]);
```

These are crucial — without them, deleting a subsystem while it's open
in Screen C leaves dangling state pointing at a tombstoned id.

---

## 7. Selection + edits (the four contexts)

### 7.1 `SelectionContext`

Pure client state. Four slots:

| Field | Set by | Cleared by |
|---|---|---|
| `selectedSubsystemId` | sidebar nav click | another sidebar pick (with unit + category cleared automatically) |
| `selectedRackId` | clicking a rack on Screen A | clicking outside any rack; `selectRack` clears unit + category |
| `selectedUnitId` | clicking a unit inside a selected rack | `selectRack`, `selectSubsystem`; toggling the same unit clears it |
| `selectedCategoryId` | clicking a Screen-C component row OR a chip in L2 | `selectSubsystem`, `selectRack`, `selectUnit`, or back-arrow in CatalogPanel |

The auto-clear cascades are why state never goes stale. If you add a
new selection, follow the same rule: any setter that invalidates
deeper context must clear the deeper context too.

### 7.2 `useActiveSubsystem`

> "Which subsystem is open in Screen C?"

Resolution order:
1. `selectedUnitId` set → walk racks, find the unit, return its
   parent subsystem (with edits applied).
2. `selectedSubsystemId` set → return that subsystem (with edits
   applied).
3. Else → `null` (Screen A is active).

If the resolved subsystem is `isDeleted()`, return `null` so Screen C
unmounts immediately.

### 7.3 `SubsystemEditsContext` + `Provider`

Four overlays keyed by `subsystem.id`:
- `nameOverrides: Record<id, string>`
- `qtyOverrides: Record<id, number>` (clamped at 1)
- `deletedMap: Record<id, true>`
- `chassisSwaps: Record<id, ChassisSwap>` where
  `ChassisSwap = { catalogEntryId, name, description? }`

Public surface:
- `applyEdits(subsystem)` — return a new `Subsystem` with overlays
  layered on. Returns the same reference when no overlays apply (so
  React memoisation stays sharp).
- `effectiveSubsystems(list)` — filter deleted + map `applyEdits`.
- Setters: `setName / setQty / deleteSubsystem / restoreSubsystem /
  swapChassis / resetChassis`.
- Inspectors: `isDeleted / getActiveChassisCatalogId / deletedIds`.

The `chassis` swap only mutates `name` + `description`. We
deliberately don't touch `id / image / sizeU` so racks keep their
geometry — swapping an R660 for an R760 in the catalog does not
change the rack rendering. (You can argue this is wrong; it was
chosen because rendering a 2U swap inside a 1U slot looks worse than
the inconsistency.)

### 7.4 `ComponentEditsContext` + `Provider`

Per-component overlays keyed by `component.id`:
- qty (clamped at 1)
- description (string overwrite)
- delete (hide the row)

`effectiveComponents(subsystem)` returns the filtered + transformed
list. Screen C reads from this — never directly from `subsystem.components`.

---

## 8. The Catalog system (the pride of this feature)

### 8.1 Three views

| Level | When | Shows |
|---|---|---|
| **L0** | No subsystem active (Screen A) | The 6 real subsystems (Hyper-V cluster / VMware / SAN Storage / Mgmt / ToR / SAN switches). Cards are deep-link buttons → `selectSubsystem`. Deleted subsystems pinned at top with Restore. |
| **L1** | Subsystem active, no unit pinned (Screen C entered via sidebar) | `<SubsystemEditCard>` (rename / qty / delete) + the platform alternatives list. Each non-active card has a "Swap" action; the active card has "Reset" if a swap is in effect. |
| **L2** | Unit pinned (Screen C entered via rack click) | A persistent chassis context card + a chip row of component categories. Picking a chip OR a Screen-C row drills into the per-category SKU list. |

L2 → category drill is **the same view shape as L1**, just with
component SKUs instead of platforms.

### 8.2 `useCatalogScope` — the brain

Returns one of:

```ts
| { kind: "project" }
| { kind: "subsystem"; subsystem; alternatives; selectedId }
| { kind: "chassis";   subsystem; unitId; contextEntry }
```

**Self-healing**: if `inProposalCatalogId[subsystem.id]` doesn't
resolve to any entry in `platformCatalog[subsystem.id]`, we
synthesise a one-off `CatalogEntry` from `Subsystem.chassis` and
prepend it. The user always sees the proposed chassis at the top of
L1, even when `catalog-data.ts` is incomplete.

The `chassis` scope also synthesises if the proposal entry is
missing — `contextEntry` is **never null**.

### 8.3 `CatalogPanel` — the switcher

Renders one of `<ProjectCatalog>` / `<SubsystemCatalog>` /
`<ChassisOverview>` / `<ComponentCategoryView>` based on
`(scope.kind, selectedCategoryId)`.

Key UX bits:
- **Sticky breadcrumb** at top with a back-arrow that walks
  category → chassis → subsystem → project.
- **`AnimatePresence`** between views so transitions feel smooth.
- **gap-1.5 spacing** between cards (we used to `divide-y`, but the
  hairline crashed into the active card's ring — see §12).

### 8.4 `CatalogEntryCard` — the canvas

One component renders L0, L1, L2. Optional fields on `CatalogEntry`
unlock extra rows:
- `price` → top-right.
- `bestFor` → "Best for: …" line under status.
- `spec` → grey one-liner above the description.

Optional component props:
- `selected` — visual-only override that forces the in-proposal
  treatment (used for the L2 chassis context card).
- `onClick` — clickable card behaviour (cursor-pointer + lift).
- `actionLabel + onAction` — render a single primary action button
  (Swap / Add / Restore). The button stops propagation so the
  surrounding `onClick` selector still works.
- `bare` — L0-only override: drop the "in proposal" ring/border/tint.
  Reason: at the project level every card is in-proposal by
  definition, so painting them all teal is just noise.

> Status note: the in-proposal ring/border/tint block is currently
> **commented out** in `CatalogEntryCard.tsx` (see the `// !bare && …`
> lines). Cards render flat white. If you want the brand-blue
> highlight back, uncomment those classes — that's the entire toggle.

---

## 9. Routing & demo entrypoint

- `app/routes.ts` — `/avaya` registered **outside** `PrivateRoute`. The
  demo is publicly viewable.
- `app/routes/index.tsx` — root `/` redirects to `/avaya` with
  `replace: true`.
- `app/routes/avaya/index.tsx` — renders `<HardwareLayout><HardwareCanvas
  /></HardwareLayout>`. That's it. The route file is intentionally
  thin so all the wiring lives in `HardwareLayout`.

The route never updates the URL. Selection is context, not URL state.

---

## 10. Asset pipeline

### 10.1 Why preload

The biggest images are the 4 chassis PNGs (~4 MB combined) + the rack
frame + the grid tile. Without preload, the browser only discovers
them after React mounts and renders the `<img>` tags — users see an
empty rack frame for ~1–2 seconds on a cold cache, then everything
pops in.

### 10.2 The manifest (`preload-assets.ts`)

Two tiers:

- **`critical`** (`fetchpriority: "high"`):
  - `BG_Blue.jpg`
  - `BG_Blue_Grid_Tile_2.png`
  - `Server_BG.png` (rack frame)
  - 6 product chassis PNGs
  - `Logo.svg` + `Logo_text.svg`
- **`deferred`** (`fetchpriority: "auto"`):
  - 5 component-hero PNGs (CPU / RAM / HDD / Network / Power) ×
    2 copies (PNG+SVG/ + verstka/ — Vite dedupes by URL).

`normaliseManifest()` strips `data:` URIs (Vite inlines anything <
4 KB and a preload link to a data URI is wasted bytes) and dedupes
by `href`.

### 10.3 Where the `<link>` tags go

In `app/root.tsx`'s `links()` export. **Not** on the `/avaya` route's
`links()` — in SPA mode, route-level `links()` don't reach the static
shell `index.html`. Document-level (root) `links()` do.

### 10.4 Image-map pattern in `Rack.tsx` / `ScreenC.tsx`

Both files maintain a `SERVER_IMAGES: Record<string, string>` map
keyed by the same filename string used in `Chassis.image`. Imports
must be static so Vite rewrites URLs in production:

```ts
import productR660 from "~/assets/hardware/products/Dell-PowerEdge-R660.png";
…
const SERVER_IMAGES: Record<string, string> = {
  "Dell-PowerEdge-R660.png": productR660,
  …
};
```

Adding a new chassis = 4 places to touch:
1. The product PNG file in `app/assets/hardware/products/`.
2. `fake-data.ts`: `Chassis.image = "<filename>"`.
3. `Rack.tsx`: import + `SERVER_IMAGES` entry.
4. `ScreenC.tsx`: import + `SERVER_IMAGES` entry.
5. `preload-assets.ts`: import + critical-list entry.

(Yes, that's 5. Unify if you re-implement.)

---

## 11. Animations & UX details (gotchas)

### 11.1 Screen-C click stability

Screen-C component rows and chassis hero still animate **in** with their
entry springs, but they do **not** use hover/tap transforms after entry.
Earlier versions used `whileHover` / `whileTap`; when the user clicked a
component, selected state changed on the row and the chassis hero at the
same time, which read as "the server icon shakes".

Rules:

- No hover lift on `ComponentCard`.
- No tap scale on `ComponentCard`.
- No hover lift on `ChassisHero`.
- No tap scale on `ChassisHero`.
- Selected state uses `ring-2 ring-inset` with a constant footprint.
- Shadows stay stable; avoid selected-state glow/shadow changes that make
  nearby elements appear to recalculate.

The goal is simple: selection may change color, but it must not change
outside size, transform, or perceived layout position.

### 11.2 ScreenA centre-the-rack maths

Translate the row by `((centreIdx - idx) * 100) / N` percent of its
own width. For `N = 4` racks, `centreIdx = 1.5`, so picking rack #1
shifts +12.5%, picking #2 shifts –12.5%.

### 11.3 Rack interior is geometry, not Tailwind

`RACK_ASPECT = "342 / 912"` matches the actual `Server_BG.png` file
dimensions. The interior box uses absolute insets (`TOP_INSET_PCT`,
`BOTTOM_INSET_PCT`, `LEFT_SIDE_INSET_PCT`, `RIGHT_SIDE_INSET_PCT`)
calculated from the source PNG. Each unit is positioned by `top: (1
- (positionU + sizeU) / heightU) * 100%`, height `= sizeU / heightU
* 100%`. **Never hand-place units in CSS** — drive everything from
`positionU + sizeU` in `fake-data.ts`.

### 11.4 Selected rack scales up

`baseScale = isSelected ? 1.15 : isOther ? 0.75 : 1`. (We tried `1.4`
in conversation but reverted; you can crank it back up if the inner
chassis art needs to be more legible in overview mode.)

### 11.5 Background grid zoom

Only the grid layer (`BG_Blue_Grid_Tile_2.png`) animates `scale` on
dive (`isZoomed = anyone selected`). The base gradient
(`BG_Blue.jpg`) stays put — its radial highlight is the focal point
and shouldn't drift. Spring: `stiffness: 180, damping: 28`. Scale
target lives in `HardwareCanvas.tsx` (currently `1.8`); a more subtle
`1.06` reads as a calm nudge if `1.8` feels too aggressive.

### 11.6 Catalog list spacing

Use `flex flex-col gap-1.5`, **not** `divide-y`. With dividers, the
selected card's ring/border crashes into the hairline above and below.
The `gap` gives the active card breathing room.

### 11.7 `<motion.button>` inside the cards

Don't nest `<h2>`, `<div>`, etc inside `<motion.button>` — buttons
only allow phrasing content per HTML spec. Use `<motion.div role=
"button" tabIndex={0} onKeyDown={Enter/Space → onSelect}>` instead.
Pattern in `ScreenC.tsx` `ComponentCard` and `ChassisHero`.

### 11.8 Screen-C responsive layout

The middle canvas has to work while both sidebars are visible, so
viewport width alone is misleading — the **canvas** can be narrow on a
desktop-sized screen.

Current structure in `ScreenC.tsx`:

1. Outer wrapper: `h-full min-h-0 flex-1`, with enough `pt-*` to clear
   `TopChrome`.
2. Title: `shrink-0`, never inside the scroll area.
3. Stage: `min-h-0 flex-1 justify-center overflow-hidden`.
4. Component list: `min-h-0 max-h-full shrink overflow-y-auto`; it is
   centred with the chassis while it fits, and becomes the scroll region
   when it does not.
5. Chassis hero: `shrink-0`; it remains visible while the component list
   scrolls.

`ChassisHero` is horizontal at wide canvas sizes. Under `1200px` it
switches to `flex-col`, centers the image, caps the image width, and gives
the description card `w-full max-w-[420px]`. This prevents the description
from becoming a narrow/tall side card.

### 11.9 Sidebar scroll containment

Left sidebar:

- Header reserves `pr-[7px]` to match the custom
  `SidebarContent` scrollbar width (`scrollbar-w-[7px]`), so the project
  card and nav rows visually align.
- `SidebarContent` gets a small top margin from the project card.
- Nav rows/sub-rows use full width and `rounded-none`.

Right sidebar:

- The sidebar root is `overflow-hidden`; don't let the whole panel scroll.
- Tabs header is `shrink-0`.
- `SidebarContent` and active `TabsContent` are `min-h-0`.
- `CatalogPanel` owns the internal scroll below its breadcrumb.

---

## 12. Color tokens

| Role | Hex | Used in |
|---|---|---|
| Canvas blue (background) | `#3b6bb1` | `HardwareCanvas` `<section>` fallback |
| Brand blue (in-proposal indicators) | `#3744a6` | `StatusBadge` "in proposal" text, `CatalogEntryCard` ring/border, `PrimaryActionButton`, IconPill teal-tone, focus rings inside the right sidebar |
| Active-on-canvas accent (sky cyan) | `#70CDFF` | `ScreenC` active row ring + chassis hero ring + glow shadow + focus ring (this is on top of the blue canvas, so brand blue blends in — we use the high-luminance cyan instead) |
| Mockup chrome plate | `#f7f2ee` | `TopChrome` Design tab plate background |
| Mockup chrome active | `#004986` | `TopChrome` Design tab active state |
| Right sidebar bg | `#dde5ea` | `SidebarRight optionsBgColor` prop |
| Left project card bg | `#dce7f8` | `SidebarLeft` project header card |

**Rule of thumb:** brand blue `#3744a6` for "this is the chosen SKU"
on white surfaces (right sidebar). Sky cyan `#70CDFF` for "this is
the active focus" on the blue canvas (Screen C). Don't mix.

---

## 13. Build & deploy gotchas (lessons learned the hard way)

### 13.1 Fast-Refresh-safe context split

Vite's React plugin treats a file as a Fast Refresh boundary only if
**all** its exports are React components. A file that exports both
`<MyProvider>` and `useMyContext()` forces a full-page reload on
every save.

Symptom: transient "useComponentEdits must be used inside
<ComponentEditsProvider>" or "change in the order of Hooks" errors
during HMR.

Fix: split `XContext.tsx` into two files:
- `XContext.tsx` — `createContext`, the value type, and the `useX()`
  hook. **No React component exports.**
- `XProvider.tsx` — the `<XProvider>` component only.

We did this for both `SubsystemEdits` and `ComponentEdits`. Don't
collapse them back.

### 13.2 SPA mode `links()` quirk

In React Router v7 SPA mode, **route-level `links()` exports don't
reach the static `index.html` shell**. To get `<link rel="preload">`
into the document head, declare them in the **root** route's
`links()` export. We use:

```tsx
// app/root.tsx
export const links: LinksFunction = () => [
  ...staticLinks,
  ...hardwarePreloadAssets.map((a) => ({
    rel: "preload",
    as: "image",
    href: a.href,
    fetchPriority: a.priority,
  })),
];
```

### 13.3 Vite asset-inlining + dedupe

Vite content-hashes assets and inlines anything < 4 KB as a `data:`
URI. Two consequences for the preload manifest:

- A `<link rel="preload" href="data:…">` is wasted bytes — drop those
  entries (`normaliseManifest`).
- Importing the same physical file from `verstka/` and `PNG+SVG/`
  produces the same hashed URL — dedupe by `href`, keep the first
  occurrence so a `critical` entry wins over a `deferred` one with
  the same content.

### 13.4 Filename case on Linux/Vercel

macOS treats the filesystem as case-insensitive; Linux (Vercel build
machines) does not. **Every asset import is case-sensitive in CI.**

Concrete bug we hit: commit `7108a8a` flipped one import in
`app/constants/assetMapping.ts` from `dell-poweredge-r660.png`
(lowercase, the actual filename) to `Dell-PowerEdge-R660.png`
(capitalised). macOS resolved both; Vercel exited with 1 and a
`Cannot find module` dump.

**Rule:** filenames are typed exactly as they exist on disk. When
introducing a new file, run `git ls-files | grep -i <name>` after
adding it to confirm Git tracked it with the case you expect.

### 13.5 Webp vs png

R660 was originally a `.webp` file in our copy script. The `.webp`
file got replaced by a `.png` file during a re-drop and the imports
went stale for one save. If you ship `.webp`:
- Vite handles it natively (no plugin).
- The preload `<link>` must use `type: "image/webp"`.
- Make sure `tsc` doesn't choke on the import (it doesn't, but worth
  noting).

We ended up shipping `.png` for all 6 product images — simpler.

---

## 14. Things to reconsider in v2

- **5 places to touch when adding a chassis** (§10.4) — collapse the
  three `SERVER_IMAGES` maps into one shared module, and have the
  preload manifest derive from it.
- **`subsystemCategories` and `productAlternatives` in
  `HardwareProject`** are dead now — `catalog-data.ts` superseded
  them. Delete on the next pass.
- **`Server_Dell_03.png` stand-in** got replaced by
  `DELL-UNITY-XT-380F.png`; the verstka image is still on disk but
  no longer referenced. Safe to delete in a cleanup pass.
- **Selected-rack scale** is a magic number (`1.15`) — promote to a
  constant or read from the design system once one exists.
- **`HardwareLogo`** is hand-rolled — if Magic gets a global
  `<BrandLogo>`, swap it.
- **The chassis swap UX** keeps `chassis.id / image / sizeU` constant
  so racks don't break geometry. If swap-with-different-U is needed,
  this is the call site to revisit.
- **No undo/redo** on the edit overlays — additive-only setters.
  Likely fine for a demo, would not be fine for a real configurator.
- **No persistence** — refresh = lose all edits. Add `localStorage`
  if/when the demo needs it.
- **Component category icon assets** are duplicated under
  `verstka/Component_*.png` and `PNG+SVG/Component_*.png`. The Vite
  dedupe makes this harmless but it's confusing — collapse on
  cleanup.

---

## 15. Verification checklist (run on every build)

- [ ] `npm run build` exits 0 (Linux + Mac).
- [ ] `npx tsc --noEmit` exits 0.
- [ ] Cold-load `/avaya` → no flash of empty rack frame.
- [ ] Static `index.html` contains ~10 `<link rel="preload">` tags.
- [ ] Left project card bg is `#dce7f8`; nav rows align to the same
      visual width and use square corners.
- [ ] Preview Proposal in `/avaya` clears selection back to Screen A
      with no selected rack; it does not navigate to `/projects/:id`.
- [ ] Click a sidebar nav row → Screen C with that subsystem.
- [ ] Click a rack → it scales up + centres; click a unit inside →
      Screen C with that chassis.
- [ ] Click a Screen-C component row → right sidebar drills into that
      category's SKU list.
- [ ] Clicking Screen-C component rows does not make the chassis hero or
      component list visibly jump/shake.
- [ ] Resize height down on Screen C → title stays below top chrome,
      component rows scroll internally, chassis hero remains visible.
- [ ] Narrow canvas with both sidebars visible → chassis hero switches to
      compact column layout and the description card stays readable.
- [ ] Right Catalog tab header stays fixed; catalog content scrolls below
      the breadcrumb.
- [ ] Click chassis hero → right sidebar returns to L1 alternatives.
- [ ] Rename a subsystem in L1 → sidebar nav + Screen-C title +
      breadcrumb update live.
- [ ] Delete a subsystem → it disappears from canvas + nav + appears
      at the top of L0 with Restore.
- [ ] Swap chassis from L1 → Screen-C hero name + L1 active highlight
      both update; "Reset" appears.
- [ ] Adjust component qty in L2 → Screen-C row qty updates.
- [ ] Delete a component row in L2 → row disappears in Screen-C; L2
      shows it as removed with Restore.
- [ ] Refresh → all edits gone, BoQ truth is back.
- [ ] No `Cannot find module` errors when building on Vercel.

---

## Appendix A — One-paragraph "why this design"

The whole feature is built around one insight: **the right sidebar
should always reflect what the user is looking at on the canvas, and
clicking anywhere on the canvas should move the right sidebar to the
matching context**. `useCatalogScope` is the reified version of that
insight. Once you accept it, every other decision (selection cascade,
edit overlays, self-healing scope, unified card) falls out naturally.

The second insight: **never mutate the static data**. Edits are
overlays. This is why we have two separate edits contexts and why
`fake-data.ts` is read-only at runtime. It makes "Reset" a one-line
operation, makes inspecting the BoQ trivial, and means the demo
always has a known-good state to return to.

The third insight: **filenames are typed by humans, so they will be
typed wrong**. `useCatalogScope` synthesises missing entries.
`SERVER_IMAGES` falls through gracefully. The preload manifest
dedupes by URL. Defence in depth — every step assumes the previous
step typed the filename wrong.
