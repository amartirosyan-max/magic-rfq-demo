# Hardware Configurator — Implementation Progress

> Running log. Updated after every step completes.
>
> Related docs:
> - `READY.md` — the plan (one-pager).
> - `DATA-ANALYSIS.md` — full data analysis + assumptions.
> - `USER-FLOW.md` — user flow.
> - `IMPLEMENTATION.md` — Q&A from planning rounds.
> - `PLAN.md` — original long-form design notes.

## Snapshot

| | |
| --- | --- |
| Branch | `main` |
| Steps done | 4 / 8 |
| Currently in | **— (Step 3 complete)** |
| Next | Step 4 — Screen B (single rack detail) |

## Commit map

| Hash | Step | Summary |
| --- | --- | --- |
| `eac5475` | — | `chore: baseline magic-ui-dev as received` |
| `28a315d` | Step 0 + 1 | `feat(hardware): docs, types, fake-data tree, Verstka assets` |
| `c21a71e` | Step 2 | `feat(hardware): route / → /avaya, add demo entry route` |
| `548c708` | Step 3 | `feat(hardware): Screen A — 3-part shell + multi-rack canvas` |

## Step status

### Step 0 — Asset move
**Status:** done in `28a315d`.

What:
- Copied 58 files from `/Verstka/` → `app/assets/hardware/verstka/` (PNGs + SVGs).
- Kept both formats side-by-side for now.

### Step 1 — Data tree
**Status:** done in `28a315d`.

What:
- `app/features/hardware/types.ts` — `HardwareProject`, `Subsystem`, `Rack`, `RackUnit`, `Chassis`, `HardwareComponent`, `CatalogEntry`, `CatalogStatus`, `ComponentCategory`, `SubsystemKind`.
- `app/features/hardware/fake-data.ts` — full Avaya project:
  - 6 subsystems (Hyper-v cluster, VMWare cluster, SAN Storage, Management Switch, ToR Switches, SAN Switches).
  - 4 racks (`[empty][Rack 01][Rack 02][empty]`), U-layout per `DATA-ANALYSIS.md §8.1`.
  - All component specs verbatim from Avaya BoQ (`Intel Xeon Gold 6548Y+`, `32GB RDIMM 5600MT/s`, …).
  - 6 subsystem-category catalog entries with status badges.
  - 2–4 product-alternatives per subsystem.
- `npx tsc --noEmit` clean.

### Step 2 — Entry routing
**Status:** done.

What:
- `app/routes.ts` — registered `route("avaya", "routes/avaya/index.tsx")` as a top-level route **outside** the `PrivateRoute` wrapper, so the demo opens with no login.
- `app/routes/avaya/index.tsx` — placeholder page that reads `hardwareProject` from `~/features/hardware/fake-data` and lists the 6 subsystems + 4 racks. Proves the data tree is reachable end-to-end.
- `app/routes/index.tsx` — root `/` now `<Navigate to="/avaya" replace />`. Login/dashboard URLs still work if visited directly.
- `npx tsc --noEmit` clean.

Verification:
- `npm run dev` then visit `http://localhost:5173/` → redirects to `/avaya` and renders the placeholder with the Avaya subsystem + rack counts.
- `/login` still loads the login page; nothing pre-existing is broken.

### Step 3 — Screen A (multi-rack overview)
**Status:** done (revised after user feedback).

#### Step 3.1 — Initial pass (superseded)
What was built and why it was wrong:
- Custom `SidebarLeft.tsx` / `SidebarRight.tsx` in `features/hardware/` — user feedback:
  the project already has `~/components/sidebar-left.tsx` and `~/components/sidebar-right.tsx`;
  the demo should reuse those and just feed them fake data, not introduce parallel components.
- Blueprint grid background was scoped to a child element below `TopChrome` — looked like
  the grid was not full-height.
- `TopChrome` design didn't match the screenshots: light-blue breadcrumb, dark/black active
  tab, and an unwanted `+` button next to the rack carousel.

#### Step 3.2 — Revised (current)
What:
- `app/features/hardware/adapter.ts` — translates `hardwareProject` into the shapes the existing
  sidebars expect (`ProjectResponse`, `NavItem[]`, `IProjectPriceResponse`). Lead score 8.4/10
  keeps `SidebarLeft` from redirecting to `/lead-score`. Grand Total reused as the (single) price.
- `app/components/sidebar-right.tsx` — added 3 optional, backward-compatible props:
  `catalogSlot?: ReactNode`, `chatSlot?: ReactNode`, `defaultTab?: ...`. Production behaviour
  preserved when the slots are omitted; the hardware demo passes its own catalog body in.
- `app/features/hardware/HardwareLayout.tsx` — now wraps in `DiagramProvider + SidebarProvider`
  and renders the **existing** `<SidebarLeft />` and `<SidebarRight />` from `~/components/...`,
  feeding them via the adapter. The catalog slot renders our `CatalogEntryCard` list.
- DELETED `app/features/hardware/SidebarLeft.tsx` and `SidebarRight.tsx`.
- `TopChrome.tsx` — redesigned:
  * Navy breadcrumb pill (`#3a4a5f`) with light text — matches screenshot.
  * White tabs pill with **blue** active state (`#2f7be5`), not black. Other tabs
    transparent + slate-500.
  * Rack carousel = white pill with `←` / bar indicator / `→`. **`+` button removed.**
  * Whole chrome is `pointer-events-none absolute inset-x-0 top-0` so the grid sits behind it.
- `ScreenA.tsx` — blueprint grid moved to the outer `<section>` so it covers the full
  canvas height (including behind the top chrome). Racks row now uses an explicit
  `h-[72vh]` band so `Rack` can rely on `h-full`.
- `Rack.tsx` — container `aspectRatio` switched from `140/480` to `342/912` to match the actual
  `Server_BG.png` pixel dimensions, so `object-fill` keeps the frame edges and the inner band
  aligned to the rack's visible interior. Per-unit positioning is now a clean
  `bottom = (positionU - 1) * (100 / heightU) %` inside the band. Unit images use
  `object-fill` to fully occupy each slot.

Tuning points:
- `Rack.tsx` `TOP_INSET_PCT` (10), `BOTTOM_INSET_PCT` (9), side inset (`7%`) — tune if the
  unit band edges drift off the visible rack interior.
- `h-[72vh]` in `ScreenA` controls overall rack scale on Screen A.

Verification:
- `ReadLints` clean on the changed files.
- Vite HMR picked up every change, no compile/runtime errors.

Commit:
- `9761ab9` — `fix(hardware): reuse existing sidebars + fix Screen A chrome`.

#### Step 3.3 — Left sidebar polish
What:
- Extended `~/components/sidebar-left.tsx` with 4 optional, backward-compatible props:
  * `topSlot?: ReactNode` — content rendered above the project header card.
  * `disableHeaderClick?: boolean` — kills the click-to-navigate behaviour + cursor-pointer.
  * `hidePrimaryAction?: boolean` — hides the `Preview Proposal` / `Use cases` button.
  * `priceOverride?: { label; value }` — replaces the "Price range: $X - $Y" block with
    a single labelled value (e.g. "Grand Total: $644,475").
- New `app/features/hardware/HardwareLogo.tsx` — `Logo.svg` mark + `Logo_text.svg`
  wordmark lockup, used as the `topSlot`.
- `HardwareLayout.tsx` now feeds the left sidebar:
  * `topSlot={<HardwareLogo />}`
  * `disableHeaderClick`
  * `hidePrimaryAction`
  * `priceOverride={{ label: "Grand Total:", value: formatToUSD(grandTotalUSD) }}`

All four override props default to off, so the production project layout
(`layouts/project.tsx`) renders unchanged.


### Step 4 — Screen B (single rack detail)
**Status:** not started.

Plan:
- Click a rack → routes to `/avaya/racks/:rackId` (or pure state, TBD).
- Two neighbour racks blurred on either side.
- 42U numbered scale on the left of the centred rack.
- Hover state on a server row (white background + dots indicator).
- framer-motion zoom-in transition from Screen A.

### Step 5 — Screen C (cluster component view)
**Status:** in progress.

Trigger:
- `selectedUnitId` is set (rack click) → resolved to its subsystem.
- *or* `selectedSubsystemId` is set (left-sidebar click).
- Otherwise: stay on Screen A.

Layout (full canvas; replaces the rack carousel, blueprint background + TopChrome stay):
- Top region: vertical list of `HardwareComponent` cards
  * Lucide icon (category → `Cpu` / `MemoryStick` / `HardDrive` / `Network` / `Plug`).
  * Title = `categoryLabel`, body = `description`, badge = `× qty`.
- Bottom region: chassis hero card
  * Big chassis image LEFT, title + description + cluster qty RIGHT.

Animations (framer-motion):
- Chassis hero slides up from below (spring).
- Each component card emerges from *under* the hero with a staggered y → 0 + opacity fade, index-based delay. Visually feels like the parts "pop out" of the chassis.
- Exit reverses the choreography.

Refactor:
- New `HardwareCanvas.tsx` owns the section wrapper + blueprint grid + TopChrome
  and `AnimatePresence`-switches between `ScreenA` (rack carousel) and `ScreenC`.
- `ScreenA.tsx` becomes the rack carousel body only.
- `ScreenC.tsx` is new — chassis hero + component cards + animations.
- `SelectionContext.selectSubsystem` now clears `selectedUnitId` so a sidebar
  pick deterministically overrides any in-rack unit pick.
- Route entry switches from `<ScreenA/>` to `<HardwareCanvas/>`.

Selection → screen mapping:
| state                                | screen   |
| ------------------------------------ | -------- |
| no unit, no subsystem                | Screen A |
| unit selected (rack auto-selected)   | Screen C |
| subsystem selected (from sidebar)    | Screen C |

Click-outside on Screen C clears both `selectedUnitId` and
`selectedSubsystemId`, dropping back to Screen A (rack stays selected if it
was — `selectRack` only clears the unit, not itself).

### Step 6 — Right Catalog: product alternatives
**Status:** not started.

Plan:
- On Screens A/B: show `subsystemCategories` with status badges.
- On Screen C: swap body to `productAlternatives[subsystemId]`.
- Three small action icons (Add / Edit / Remove) per entry — visual only.

### Step 7 — Polish
**Status:** not started.

Plan:
- Breadcrumbs (`Project › Avaya POD Cluster – IPO200 › Hyper-v Cluster`).
- `Preview Proposal` and `Share` buttons (cosmetic).
- Empty-rack frames on Screen A.
- Server carousel at the top of the canvas.
- Tighten framer-motion transitions across all 3 screens.

## Out of scope (parked for v2)

- Drag-and-drop in racks.
- The `+` carousel button behaviour.
- "Change" chassis flow.
- Magic AI Advisor reacting to hardware context.
- Mobile / responsive layout.
- Real backend.
- Keyboard / accessibility polish.
- Real proposal export.
