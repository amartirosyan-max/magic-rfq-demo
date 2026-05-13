# Hardware configurator demo — full implementation changelog

This document describes **everything introduced or changed** for the Avaya hardware UI demo, measured from the repository **baseline** (first commit in this history) through **`HEAD`**. It is meant for handoff: engineering, product, and design can use it to understand scope, file ownership, and behaviour without re-reading the whole thread.

**Git baseline (first commit):** `eac54759` — `chore: baseline magic-ui-dev as received`  
**Measurement:** `git diff eac54759..HEAD` → **177 files**, **+7824 / −70** lines (includes binary assets and docs).

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Commit timeline (since baseline)](#2-commit-timeline-since-baseline)
3. [Architecture you should picture](#3-architecture-you-should-picture)
4. [Routing & entry](#4-routing--entry)
5. [Feature module: `app/features/hardware/`](#5-feature-module-appfeatureshardware)
6. [Extensions to existing app components](#6-extensions-to-existing-app-components)
7. [Data model & content](#7-data-model--content)
8. [Assets](#8-assets)
9. [Documentation added under `app/docs/`](#9-documentation-added-under-appdocs)
10. [Repo / tooling files outside `app/`](#10-repo--tooling-files-outside-app)
11. [Behaviour reference (clicks & navigation)](#11-behaviour-reference-clicks--navigation)
12. [Representative code patterns](#12-representative-code-patterns)
13. [Known gaps & follow-ups](#13-known-gaps--follow-ups)

---

## 1. Executive summary

We added a **self-contained hardware configurator demo** for the **Avaya POD Cluster – IPO200** project:

- **Landing:** `/` redirects to **`/avaya`** (no auth for this path).
- **Layout:** three columns — existing **`SidebarLeft`** + **`SidebarInset`** canvas + existing **`SidebarRight`**, wrapped in **`HardwareLayout`** with fake data from an **adapter**.
- **Canvas:** **`HardwareCanvas`** — blue field + tiled grid texture + **`TopChrome`**, switching between **Screen A** (four-column rack carousel) and **Screen C** (subsystem BOM + chassis hero) via **`AnimatePresence`**.
- **State:** **`SelectionContext`** holds `selectedSubsystemId`, `selectedRackId`, `selectedUnitId`; **`useActiveSubsystem`** derives which subsystem drives Screen C.
- **Data:** **`fake-data.ts`** + **`types.ts`** model racks, rack units, subsystems, chassis, line items, and two catalog layers (`subsystemCategories`, `productAlternatives`).
- **Motion:** **`framer-motion`** for rack scale/carousel, Screen C enter animations, background zoom, hover on units.

---

## 2. Commit timeline (since baseline)

| Commit | Date | Subject |
|--------|------|---------|
| `28a315d` | 2026-05-12 | `feat(hardware): docs, types, fake-data tree, Verstka assets` |
| `c21a71e` | 2026-05-12 | `feat(hardware): route / → /avaya, add demo entry route` |
| `f2114b9` | 2026-05-12 | `docs(hardware): record Step 2 commit hash in PROGRESS.md` |
| `548c708` | 2026-05-12 | `feat(hardware): Screen A — 3-part shell + multi-rack canvas` |
| `5c5fdae` | 2026-05-12 | `docs(hardware): record Step 3 commit hash` |
| `9761ab9` | 2026-05-12 | `fix(hardware): reuse existing sidebars + fix Screen A chrome` |
| `d036144` | 2026-05-12 | `docs(hardware): record Step 3.2 commit hash` |
| `c4c9733` | 2026-05-12 | `Initial hardware configurator and related updates` |

Later iterative fixes (sidebars, Screen C UI, breadcrumb navigation, backdrop behaviour, grid tile, PM inventory doc, etc.) are included in the tree at **`HEAD`**; if your clone has additional commits after `c4c9733`, extend this table with `git log`.

---

## 3. Architecture you should picture

```text
┌─────────────────────────────────────────────────────────────────┐
│  HardwareLayout (SelectionProvider + DiagramProvider +          │
│                   SidebarProvider)                               │
│  ┌──────────────┬─────────────────────────────┬───────────────┐ │
│  │ SidebarLeft  │ SidebarInset                │ SidebarRight  │ │
│  │ (existing)   │  ┌─────────────────────────┐│ (existing)    │ │
│  │ + adapter    │  │ HardwareCanvas          ││ + catalogSlot │ │
│  │ + logo slot  │  │  section + grid + chrome  ││ + chatSlot    │ │
│  │ + nav select │  │  ScreenA | ScreenC       ││               │ │
│  └──────────────┴─────────────────────────────┴───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

- **Screen A** = rack overview only (row translate + rack click + canvas deselect rack).
- **Screen C** = when `useActiveSubsystem()` is non-null (subsystem from sidebar **or** unit in rack with synced subsystem).

---

## 4. Routing & entry

| File | Change |
|------|--------|
| `app/routes.ts` | Registered **`route("avaya", "routes/avaya/index.tsx")`** outside auth layout so the demo loads without login. |
| `app/routes/index.tsx` | Root **`/`** now **`<Navigate to="/avaya" replace />`** so the demo is the default entry (other routes e.g. `/login` remain direct). |
| `app/routes/avaya/index.tsx` | Demo page: **`HardwareLayout` → `HardwareCanvas`** (not raw `ScreenA`). |

---

## 5. Feature module: `app/features/hardware/`

| File | Responsibility |
|------|----------------|
| **`types.ts`** | `HardwareProject`, `Subsystem`, `Chassis`, `Rack`, `RackUnit`, `HardwareComponent`, `CatalogEntry`, `CatalogStatus`, `ComponentCategory`. |
| **`fake-data.ts`** | Full Avaya tree: chassis specs, per-chassis BOM rows, six subsystems, four racks (two empty flanks + two populated), `subsystemCategories` for right catalog, `productAlternatives` per subsystem (data ready; UI swap optional). |
| **`adapter.ts`** | Maps `hardwareProject` → **`getFakeProject()`**, **`getFakeProjectPrice()`**, **`getFakeNavItems(selectedSubsystemId)`** for existing sidebar types. |
| **`SelectionContext.tsx`** | React context: `selectedSubsystemId`, `selectedRackId`, `selectedUnitId` + setters; **`selectRack`** and **`selectSubsystem`** clear unit when rack/subsystem changes. |
| **`useActiveSubsystem.ts`** | Memo resolver: unit’s subsystem wins, else explicit subsystem id; used by **`HardwareCanvas`** and **`TopChrome`**. |
| **`HardwareLayout.tsx`** | Wires **`SidebarLeft`** / **`SidebarRight`** with adapter + `HardwareLogo` topSlot, price override, nav intercept, **`catalogSlot`** / **`chatSlot`**. |
| **`HardwareCanvas.tsx`** | Full-height **`section`** with **`bg-[#3b6bb1]`**, tiled **`BG_Blue_Grid_Tile_2.png`** at **`opacity-50`** + spring **scale** when “zoomed”, **`TopChrome`**, **`AnimatePresence`** Screen A/C. |
| **`ScreenA.tsx`** | Rack row only: **`rowOffsetPercent`** centering, canvas **`onClick`** → **`selectRack(null)`** when a rack was selected. |
| **`ScreenC.tsx`** | Page title, scrollable BOM cards (icons from **`PNG+SVG`** candidates + Lucide fallback), chassis hero (image + white spec card + Watts/BTU from **`watts × 3.412`**), staggered **`framer-motion`** entry. |
| **`Rack.tsx`** | `Server_BG.png` frame, interior slot insets, grouped units, rack-level scale/opacity carousel, unit hover ring (asymmetric plate), **`selectSubsystem`** sync on unit click, **`stopPropagation`** for rack vs canvas. |
| **`TopChrome.tsx`** | Breadcrumb (clickable Project/project → clear Screen C context; subsystem crumb **`details`** dropdown), Design/Questions/Price tabs (only Design enabled), **carousel hidden on Screen C** with **`pointer-events-auto`** spacer so clicks do not fall through, carousel arrows cycle **`selectRack`**. |
| **`HardwareLogo.tsx`** | Logo mark + wordmark for left sidebar top. |
| **`CatalogEntryCard.tsx`** | Renders a catalog row + **`StatusBadge`**. |
| **`StatusBadge.tsx`** | Maps `in-proposal` / `removed` / `not-in-proposal` to pill styles. |

---

## 6. Extensions to existing app components

These files existed before the demo; we **added optional props / callbacks** so the hardware flow reuses them instead of duplicating sidebar UI.

| File | Key additions |
|------|----------------|
| **`app/components/sidebar-left.tsx`** | `topSlot`, `disableHeaderClick`, `hidePrimaryAction`, `priceOverride`, `onNavItemSelect`; conditional header click and primary button; passes nav callback to **`NavMain`**. |
| **`app/components/sidebar-right.tsx`** | `catalogSlot`, `chatSlot`, `defaultTab` — demo injects hardware catalog / placeholder chat while keeping shell. |
| **`app/components/nav-main.tsx`** | `onItemSelect?:` — **`preventDefault`** + callback so subsystem rows update state without routing. |
| **`app/components/ui/sidebar.tsx`** | (If touched in diff) container padding / layout tweaks for demo parity — see git blame for exact hunks. |

---

## 7. Data model & content

- **Proposal alignment:** Comments in **`fake-data.ts`** state BoQ-derived strings for compute/storage line items; **watts** on chassis are labelled **demo placeholders** in code comments.
- **Racks:** Hyper-v cluster **split 7+7** across Rack 01 and Rack 02 for visual balance; VMware **2× R760** on Rack 02; switches + Unity placement documented in comments in **`fake-data.ts`**.
- **Catalog (right bar, current UI):** **`subsystemCategories`** — six high-level categories with marketing blurbs + status badges.
- **Catalog (prepared, not necessarily wired to Screen C):** **`productAlternatives[subsystemId]`** — alternative SKUs per subsystem; PM inventory lists them in **`HARDWARE-DEMO-DATA-INVENTORY-PM.md`**.

**Extracted proposal text (reference):**  
`app/docs/features/hardware-configurator/source/avaya-ipo200.txt`

**PM-facing inventory:**  
`app/docs/features/hardware-configurator/HARDWARE-DEMO-DATA-INVENTORY-PM.md`

---

## 8. Assets

Two parallel trees (historical duplication from Verstka import + PNG+SVG pack):

| Path | Role |
|------|------|
| `app/assets/hardware/verstka/*` | Primary references from **`Rack.tsx`** / **`HardwareLogo`** (e.g. `Server_BG.png`, `Server_Dell_01.png`–`04.png`, logos). |
| `app/assets/hardware/PNG+SVG/*` | Expanded pack: same server images, **component icons** (`Component_CPU.png`, `Component_RAM.png`, `Component_HDD.png`, …), **background** `BG_Blue_Grid_Tile_2.png`, UI chrome PNG/SVG. |

**Screen C icons:** `ScreenC.tsx` tries **`PNG+SVG`** paths first (per category), then **`verstka`**, then Lucide fallback.

**Canvas background:** `HardwareCanvas.tsx` imports **`~/assets/hardware/PNG+SVG/BG_Blue_Grid_Tile_2.png`**, `background-repeat: repeat`, **`opacity-50`** over **`#3b6bb1`**.

---

## 9. Documentation added under `app/docs/`

### 9.1 Project-wide (`app/docs/`)

Numbered guides: stack, architecture, folder structure, routes, state/data, API, domain model, coding style, styling, functionality, user flow, key components, environment, implementation playbook, **`README.md`**, and **`examples/`** (templates with `// @ts-nocheck` where needed).

### 9.2 Hardware feature (`app/docs/features/hardware-configurator/`)

| File | Role |
|------|------|
| `PLAN.md` | Original planning / questions. |
| `IMPLEMENTATION.md` | Step-by-step implementation notes. |
| `USER-FLOW.md` | Narrative user flow. |
| `DATA-ANALYSIS.md` | Proposal vs assets analysis. |
| `READY.md` | Readiness / scope decisions. |
| `PROGRESS.md` | Chronological progress + commit pointers. |
| `HARDWARE-DEMO-DATA-INVENTORY-PM.md` | Full fake-data + catalog tables for PM. |
| **`HARDWARE-DEMO-FULL-CHANGELOG.md`** | **This file** — repo-wide demo changelog. |

---

## 10. Repo / tooling files outside `app/`

| Path | Role |
|------|------|
| `.gitignore` | Adjusted (e.g. allow `.cursor/rules` pattern per project history). |
| `.cursor/rules/*.mdc` | Cursor rules for API / core / React in this repo. |
| `AGENTS.md` | Agent / contributor guidance. |

---

## 11. Behaviour reference (clicks & navigation)

| Context | Action | Result |
|---------|--------|--------|
| Screen A | Click non-empty rack | **`selectRack`**, row translates to centre, carousel zoom/opacity, grid scales up. |
| Screen A | Click empty canvas | **`selectRack(null)`** (deselect rack). |
| Screen A | Click empty rack column | Same as canvas (no `stopPropagation` on empty racks). |
| Rack (selected) | Click unit | **`selectUnit`**, **`selectSubsystem(unit.subsystemId)`** — left nav highlights matching subsystem. |
| Screen C | Click empty middle | **No exit** (backdrop clear removed on purpose). |
| Breadcrumb | Project or project name | **`selectUnit(null)`**, **`selectSubsystem(null)`** → back to Screen A. |
| Breadcrumb | Subsystem crumb | Opens list; pick subsystem → **`selectSubsystem`**. |
| Top chrome centre (Screen C) | Click | Invisible **`pointer-events-auto`** spacer — **does not** fall through to Screen C. |
| Left nav | Subsystem row | Toggle **`selectSubsystem`** (intercepted in **`NavMain`**). |

---

## 12. Representative code patterns

### 12.1 Adapter — reuse sidebars without new sidebar components

```26:52:magic-ui-dev/app/features/hardware/adapter.ts
export function getFakeProject(): ProjectResponse {
  return {
    id: FAKE_PROJECT_ID,
    name: hardwareProject.name,
    client_name: "Avaya",
    description:
      "Avaya POD Cluster — IPO200. Two-rack Hyper-V + VMware infrastructure.",
    // …CreatingStatus / SystemGenerationStatus / lead_score, etc.
  };
}
```

### 12.2 Selection + rack clears unit

```44:55:magic-ui-dev/app/features/hardware/SelectionContext.tsx
  const selectRack = useCallback((id: string | null) => {
    setSelectedRackId(id);
    setSelectedUnitId(null);
  }, []);

  const selectSubsystem = useCallback((id: string | null) => {
    setSelectedSubsystemId(id);
    setSelectedUnitId(null);
  }, []);
```

### 12.3 Canvas: blue + tiled grid + Screen A / C switch

```44:74:magic-ui-dev/app/features/hardware/HardwareCanvas.tsx
  return (
    <section className="relative flex h-full w-full flex-col overflow-hidden bg-[#3b6bb1]">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-repeat opacity-50"
        style={{
          backgroundImage: `url(${gridTileUrl})`,
          backgroundPosition: "0 0",
        }}
        animate={{ scale: isZoomed ? 1.2 : 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
      />

      <TopChrome />

      <AnimatePresence mode="wait">
        {activeSubsystem ? (
          <ScreenC key={`screen-c-${activeSubsystem.id}`} subsystem={activeSubsystem} />
        ) : (
          <ScreenA key="screen-a" />
        )}
      </AnimatePresence>
    </section>
  );
```

### 12.4 Active subsystem resolution (shared hook)

```1:40:magic-ui-dev/app/features/hardware/useActiveSubsystem.ts
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
```

---

## 13. Known gaps & follow-ups

1. ~~**`productAlternatives`** exists in **`fake-data.ts`** but the right **`catalogSlot`** still renders **`subsystemCategories`** for all screens.~~ ✅ Resolved 2026-05-13 — see **§14** below: the Catalog tab is now selection-aware (L0 / L1 / L2).
2. **Questions / Price** tabs in **`TopChrome`** are present but disabled except Design.
3. **Switch subsystems** have **no** `HardwareComponent[]` rows — Screen C empty state is intentional until PM defines line items.
4. **Auth / production**: `/avaya` is intentionally outside private layout for demo; revisit before any public deploy.
5. **Proposal PDF** is not read at runtime — only **`avaya-ipo200.txt`** / **`fake-data.ts`** drive the UI.
6. **Catalog "Add" action** is currently visual only — clicking does not persist a swap. Add a per-subsystem / per-chassis selection store when product wants live re-configuration.
7. **Catalog imagery** uses placeholders (the 4 `Server_Dell_0X.png` chassis renders cycled by id hash for platforms; per-category `Component_*.png` icons for components). Real product imagery to replace.

---

## 14. Selection-aware Catalog (2026-05-13 follow-up)

Catalog tab in the right sidebar now mirrors how deep the user has drilled into the canvas. Three levels:

| Selection state | Trigger | Catalog content |
| --- | --- | --- |
| **L0 — project** | Nothing selected | Six subsystem-category cards (unchanged behaviour) |
| **L1 — subsystem** | Left-sidebar pick (e.g. "Hyper-V cluster") | All compatible platform alternatives (10 for Hyper-V / VMware, 10 SAN, 10 switches). The chassis already in the proposal is highlighted with a teal ring + "In proposal" badge. |
| **L2 — chassis** | Rack-unit click | First a 2-column chip row (CPU · Memory · Storage · Network · Power); clicking a chip opens that category's full SKU list. The SKU matching the installed BoQ row is highlighted. |

The panel header always shows a breadcrumb (`Catalog ▸ Hyper-V Cluster ▸ CPU`) with a back-arrow that walks one level up:  
L2-list → L2-chips → L1 → L0. The breadcrumb is `sticky top-0`.

### Files added

| File | Purpose |
|------|---------|
| `app/features/hardware/catalog-data.ts` | Full SKU catalog from `dell_infrastructure_sku_master.xlsx`: 10 servers per cluster type, 10 SAN arrays, 10 switches, 10 CPUs, 10 RAM SKUs, 10 storage SKUs, plus synthesised 5 Network and 5 Power SKUs (xlsx didn't enumerate these). Also exports `inProposalCatalogId` to mark "in proposal" entries. |
| `app/features/hardware/useCatalogScope.ts` | Hook deriving `CatalogScope = "project" \| "subsystem" \| "chassis"` from `useSelection()` + `useActiveSubsystem()`. |
| `app/features/hardware/CatalogProductCard.tsx` | Card UI: thumbnail (placeholder), name, "best for" tag, optional spec line, highlights row, long description, formatted price (top-right), "In proposal" badge or `+` add affordance. Selected variant uses teal ring + `bg-teal-50` icon. |
| `app/features/hardware/CatalogPanel.tsx` | Smart container that renders L0/L1/L2 with `AnimatePresence`. Owns the local `activeCategory` state for L2 chip-then-list. Handles the back-arrow up-traversal. |

### Files changed

| File | Change |
|------|--------|
| `app/features/hardware/HardwareLayout.tsx` | `catalogSlot` now passes `<CatalogPanel />` instead of the static `subsystemCategories.map(...)` block. |
| `app/docs/features/hardware-configurator/DELL-INFRASTRUCTURE-SKU-CATALOG.md` | (created earlier same day) — markdown extract of the source xlsx used to populate `catalog-data.ts`. |

### Behaviour notes

- L1 is entered by **sidebar subsystem click** (`selectedSubsystemId` set, no unit). L2 is entered by **rack-unit click** (`selectedUnitId` set). This matches `useActiveSubsystem`'s precedence and the existing Screen C behaviour — the canvas screen is unchanged; only the catalog content adapts.
- L2 SKU highlight is best-effort: `matchInstalledSku()` does a keyword match against `HardwareComponent.description` (BoQ row). Misses fall back to no highlight, which is honest.
- Placeholder imagery is deterministic per id: same SKU → same chassis render every render — no jitter.
- Card "Add" buttons are visual; selection swap will be added when product defines persistence semantics.

### Verification

- `npx tsc --noEmit` — pass.
- `npm run build` — pass; assets (`Server_Dell_0X-*.png`, `Component_*-*.png`) emitted with hashed URLs.
- Manual smoke check via `npm run dev`: pick a subsystem in the left sidebar → 10 cards appear in Catalog; click a rack unit → category chips appear; click "CPU" chip → 10 CPU SKUs with the BoQ chip highlighted.

---

## 14.1 Catalog rewrite (2026-05-13 follow-up)

After the first cut of §14 we found three issues worth fixing in the same pass:

1. **Selected SKU invisible for two subsystems.** The Avaya BoQ uses **S5224F-ON** (ToR Switches) and **Connectrix DS-6610B** (SAN Switches); neither exists in the Dell xlsx switch sheet. Result: the catalog had no entry to highlight as "In proposal".
2. **Catalog visual identity drifted.** The new `CatalogProductCard` (thumbnail + price chip + highlight chips) didn't match the rest of the app's catalog look.
3. **Selected chassis not visible at L2.** When you clicked a rack unit, the panel jumped straight to the chip row with no reminder of which chassis you were configuring.

### What changed

**Type + UI unification**

- `CatalogEntry` gained optional `price?: string`, `bestFor?: string`, `spec?: string` fields.
- `CatalogEntryCard` now renders those fields inside the existing layout (title row + status badge + 3 round Add/Edit/Remove buttons + description). Price chip sits on the right of the title; "Best for: …" goes under the status badge; optional spec line above the description.
- Added a `selected` prop on `CatalogEntryCard` so the panel can force the teal "in-proposal" treatment regardless of the entry's own `status` (used by the L2 context card).
- **Deleted `CatalogProductCard.tsx`.** Every catalog level (L0 / L1 / L2) now renders with `CatalogEntryCard`.

**Data rewrite (`catalog-data.ts`)**

- All platform and component lists are now `CatalogEntry[]` with `status`, `price`, `bestFor`, `spec`, `description` populated.
- **Added S5224F-ON** to a new `torSwitches` list with 5 curated 25GbE / 100GbE alternatives (S5248F-ON, S5296F-ON, S5232F-ON, S4148F-ON). `inProposalCatalogId["tor-switches"] = "sw-s5224f"`.
- **Added a separate `sanSwitches` list** for FC: DS-6610B (in proposal), DS-7720B, DS-7730B, DS-5300B. `inProposalCatalogId["san-switches"] = "sw-ds6610b"`. Kept it FC-only — mixing Ethernet PowerSwitches into SAN switches would have been misleading.
- Marked the Avaya BoQ matches on component SKUs (`status: "in-proposal"`) so the chassis catalog L2 list highlights them automatically: **6442Y** (CPU closest family), **32GB DDR5 RDIMM**, **480GB SATA SSD**, **Broadcom 57414 / 5720** NICs, **800W redundant PSU**.

**Self-healing scope (`useCatalogScope.ts`)**

- Refactored to hydrate alternatives once, normalising status flags so we never render two "In proposal" badges in the same list.
- If `inProposalCatalogId[subsystemId]` does not resolve to an entry in the catalog, the hook **synthesises a one-off `CatalogEntry`** from `Subsystem.chassis` (`name`, `sizeU`, `watts`, `description`) and prepends it to the alternatives. Guarantees the "In proposal" SKU is always visible even after future data drift.
- L2 (`kind: "chassis"`) now carries a hydrated `contextEntry` that the panel renders at the very top.

**Panel rewrite (`CatalogPanel.tsx`)**

- Every level renders with `CatalogEntryCard`. L1 and L2 SKU lists sort the in-proposal entry to position 0 (`sortBySelectedFirst`).
- L2 opens with a **`CatalogEntryCard` context card** for the current chassis (selected variant) and a hint, then the category chip row (CPU · Memory · Storage · Network · Power). Click a chip → category SKU list with installed SKU at the top.
- Removed all placeholder-thumbnail wiring (no `Server_Dell_0X.png` imports in the panel). The card itself has no image — matches the original `CatalogEntryCard`.

### Files

| File | Action |
|------|--------|
| `app/features/hardware/types.ts` | Extended `CatalogEntry` with optional fields. |
| `app/features/hardware/CatalogEntryCard.tsx` | Renders new optional fields + accepts `selected` override. |
| `app/features/hardware/catalog-data.ts` | Full rewrite as `CatalogEntry[]`; added S5224F-ON, ToR / SAN switch catalogs. |
| `app/features/hardware/CatalogProductCard.tsx` | **Deleted.** |
| `app/features/hardware/useCatalogScope.ts` | Hydrate + self-heal; L2 carries `contextEntry`. |
| `app/features/hardware/CatalogPanel.tsx` | Single visual language; L2 context card; sort-selected-first. |
| `app/docs/features/hardware-configurator/DELL-INFRASTRUCTURE-SKU-CATALOG.md` | Added "Notes & deviations from xlsx" section. |

### Verification

- `npx tsc --noEmit` — pass.
- `npm run build` — pass.
- Click-through: every subsystem now shows the proposal SKU at the top of the catalog with the teal "In proposal" ring and badge, including **ToR Switches → S5224F-ON** and **SAN Switches → DS-6610B**. Click a rack unit → top of the panel shows the chassis card; click a chip → SKU list with the installed component at the top.

---

## Catalog-driven editing (2026-05-13, Dr. Artemy review)

Following Dr. Artemy's review the **right-sidebar Catalog became the only
place to edit a project**. Screen C is now read-only — qty / description /
chassis swap / delete all live on `CatalogEntryCard` action buttons.

### What changed

- **Two new edit stores** with a strict file split for Vite Fast Refresh
  compatibility:
  - `ComponentEditsContext.ts` (hook + context, non-component exports) +
    `ComponentEditsProvider.tsx` (component-only) — overlays qty,
    description and deletion on top of `Subsystem.components`.
  - `SubsystemEditsContext.ts` (hook + context) +
    `SubsystemEditsProvider.tsx` (component-only) — overlays name, qty,
    deletion **and chassis swap** on top of each `Subsystem`. Splitting
    the files was required: mixed component + non-component exports
    force `hmr invalidate` on every save and surfaced transient
    "useComponentEdits must be used inside <ComponentEditsProvider>"
    errors during HMR.
- **`CatalogEntryCard`** lost its decorative `+ □ ×` trio (it did
  nothing). The card now renders **exactly one** primary action button
  when `actionLabel + onAction` are passed; otherwise the whole card
  is the click target (used by L0 active-subsystem cards).
- **L0 ProjectCatalog**: deleted subsystems pinned to the top with a
  `Restore` button so the user can always recover.
- **L1 SubsystemCatalog**: pinned `SubsystemEditCard` (rename / qty /
  delete) + every non-active alternative gets a `Swap to this` action
  that calls `swapChassis(subsystemId, {…})`. When a swap is active,
  the swapped SKU floats to the top with a `Reset to original` action.
- **L3 ComponentCategoryView**: installed SKU shown with a qty stepper
  + `Delete` / `Restore`; alternatives get a single `Swap` button.
- **`Rack.tsx`** filters out units belonging to deleted subsystems so
  the canvas updates immediately on delete / restore.
- **`HardwareLayoutInner`** clears stale `selectedSubsystemId` /
  `selectedUnitId` when the subsystem is deleted, so Screen C
  unmounts cleanly.

### Files

| File | Action |
|------|--------|
| `app/features/hardware/ComponentEditsContext.tsx` | **Deleted** (split below). |
| `app/features/hardware/ComponentEditsContext.ts` | **New** — context object + `useComponentEdits` hook. |
| `app/features/hardware/ComponentEditsProvider.tsx` | **New** — `ComponentEditsProvider` only. |
| `app/features/hardware/SubsystemEditsContext.tsx` | **Deleted** (split below). |
| `app/features/hardware/SubsystemEditsContext.ts` | **New** — context object + `useSubsystemEdits` hook + `ChassisSwap` type. |
| `app/features/hardware/SubsystemEditsProvider.tsx` | **New** — `SubsystemEditsProvider` only. |
| `app/features/hardware/HardwareLayout.tsx` | Wraps both providers + stale-selection guards. |
| `app/features/hardware/CatalogPanel.tsx` | L0 deleted-pin / `SubsystemEditCard` / Swap / Reset / installed-row editor. |
| `app/features/hardware/CatalogEntryCard.tsx` | Removed decorative trio; single `PrimaryActionButton` when wired. |
| `app/features/hardware/Rack.tsx` | Filters deleted subsystems out of the visual rack. |
| `app/features/hardware/ScreenC.tsx` | Read-only — qty pill restored to the original `text-[20px]` size. |
| `app/features/hardware/useActiveSubsystem.ts` | Applies subsystem overlays + returns `null` for deleted subsystems. |
| `app/features/hardware/adapter.ts` | Accepts edited subsystems so the left nav reflects renames / deletes. |

### Verification

- `npx tsc --noEmit` — pass.
- `curl http://localhost:5173/avaya` — `HTTP 200`, ~282 KB body.
- Vite dev log — no `Could not Fast Refresh`, no `hmr invalidate`, no
  transform errors after the split.
- Manual click-through: open L1 → click `Swap to this` on R760 →
  Screen C chassis hero name updates to R760 → `Reset to original`
  restores R660.

---

## Regenerating this summary from Git

```bash
cd magic-ui-dev
git log --oneline eac54759..HEAD
git diff --stat eac54759..HEAD
```

To attach a **patch file** for legal/archival:  
`git diff eac54759..HEAD > hardware-demo-full.patch`

---

*Document generated from repository state; amend when the demo scope changes.*
