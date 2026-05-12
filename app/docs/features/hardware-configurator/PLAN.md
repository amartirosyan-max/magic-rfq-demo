# Hardware Configurator — Planning Doc

> **Status:** DRAFT / PLANNING — no code written yet.  
> **Owner of decisions:** product (you).  
> **Owner of execution:** AI agent + dev.  
> **Goal of this file:** capture every requirement, open question, and proposed shape *before* we touch the codebase, so the implementation prompts are unambiguous.

This doc is intentionally light on commitments and heavy on open questions. Once we agree, we move definitions into sibling files in this folder (`types.ts`, `fake-data.ts`, `routes.md`, …) and start implementing per `app/docs/14-implementation-playbook.md`.

---

## 1. Goal (one paragraph)

Build a **physical rack configurator** inside `magic-ui` that lets a user:

1. Land on the dashboard and see **3 fake test projects** (purely client-side mock data).
2. Click a project and navigate into a **Hardware view** that visualises and lets the user modify the project's racks and the components inside each server.
3. Drill from a multi-rack overview → a single rack with RU numbering → a single server's component editor (CPU / Memory / GPU / RAM / Power / …).

This is a **mock-only** v1: no backend, no API calls, no real persistence. All data lives in-memory / hard-coded so we can iterate on the UX in isolation.

---

## 2. Source mockups (in repo root)

| File | Screen it represents |
| --- | --- |
| `010_UI_1.jpg` | **Multi-rack overview** on a blue blueprint canvas. 5 racks side-by-side: AI Server Rack 01 / 02, Infrastructure Rack 03, AI Server Rack 04, Standalone. Brand pill = `DELL`. |
| `010_UI_Server_HP.jpg` | **Single rack detail** — full rack with RU numbering 01–42, blurred adjacent racks left/right, brand = `HP` (green canvas). |
| `010_UI_Server_GRAY.jpg` | Same single-rack detail with brand = `Standart` (gray canvas). Confirms canvas colour follows the brand selector. |
| `010_UI_Components_02.jpg` (and the duplicate `(1)`) | **Component configurator** — full app chrome: left sidebar with rack-by-rack totals + grand total + Preview Proposal, top breadcrumb + Design/Questions/Price tabs, brand pill, center component list for `Dell PowerEdge XE9680`, bottom server card with power stats, right `Catalog` panel with Chassis / CPU / GPU / RAM / Power sections. |

> The two `Components_02` files are visually identical — treat as one source.

---

## 3. UI inventory (what's actually on screen)

### 3.1 Common chrome (visible on all hardware screens)

- **Top breadcrumb** — `Project > {project} > {rack-or-system} > {chassis-name}`. Reuses the breadcrumb style from existing `project-breadcrumbs.tsx`.
- **Tabs** (top-left) — `Design` / `Questions` / `Price` (Design is the new hardware view; Questions/Price stay as today, scoped to the hardware context).
- **Carousel control** (top-center) — `←`, dots indicator, `→`, `+` button. Switches between racks (and `+` adds something — see Q4).
- **Brand pill** (top-right) — dropdown showing the current brand (`DELL`, `HP`, `Standart`, possibly `NVIDIA`). Coloured dot mirrors the canvas colour.
- **Canvas background** — full-bleed grid blueprint, colour tied to brand:
  - Dell → blue
  - HP → green
  - Standart → gray
  - (NVIDIA?) → green-2 (TBD)

### 3.2 Screen A — Multi-rack overview (`010_UI_1.jpg`)

- 5 vertical "rack columns" laid out horizontally on the blueprint.
- Each column has a **label above** (`AI Server Rack 01`, `Infrastructure Rack 03`, `Standalone`, …).
- Each rack shows a **rack chassis illustration** with stacked server units inside.
- Last column ("Standalone") is mostly empty with a small input/dropdown near the bottom.
- Click a rack → Screen B.

### 3.3 Screen B — Single rack detail (`010_UI_Server_HP.jpg`, `_GRAY.jpg`)

- Centered title above rack: `Infrastructure Rack 01`.
- Centered rack with **RU ruler 01..42** on its left edge.
- Server units placed at specific RU positions (each unit shows its product image).
- One unit is highlighted with a **drag handle dots icon** on its right → suggests drag-to-reorder or selection affordance.
- Adjacent racks are blurred and visible left/right as part of the carousel preview.
- Click a unit → Screen C (component configurator).

### 3.4 Screen C — Component configurator (`010_UI_Components_02.jpg`)

**Left sidebar** (replaces / mode of existing `SidebarLeft`):
- Logo: `MINDWARE MAGIC`.
- Project title: `First Emirates Bank Enterprice`.
- `Lead score: 9.6`.
- Per-rack totals (one line per rack):
  ```
  AI Server Rack 01      $123,176
  AI Server Rack 02      $123,176
  Infrastructure Rack 03 $171,412
  AI Server Rack 04      $123,176
  Standalone             $8,743
  ```
- `Grand Total: $644,475` (highlighted, brand-colored).
- `Preview Proposal` button.

**Main column** (center):
- Header bar: `Dell PowerEdge XE9680` + `Infrastructure Rack 01 ▼` + `U34-35 ▼` (the second/third are dropdowns to jump to another rack / another RU range).
- **Component list** — one row per category, each row: icon, qty multiplier (e.g. `2×`), category name (CPU / Memory / M.2 Drive / Hard Drive / SSD / GPU / Network Card / Power / Cooling System), description text.
  - Categories observed: **CPU, Memory, M.2 Drive, Hard Drive / SSD, GPU, Network Card, Power, Cooling System** (8 rows in this mockup).
- **Server card** at the bottom: thumbnail image, model name (`Dell PowerEdge XE9680`), full description (`4U Rack-mountable Workstation - 2 × Intel Xeon Socket LGA-4189 - …`), and two stats badges: `1665 Watts`, `5681.22 BTU/Hr`.

**Right sidebar** (`Catalog` tab — replaces the current `Options` content for hardware mode):
- Tabs at top: `Magic AI Advisor` / `Catalog` (Catalog is active).
- Title: `Dell PowerEdge R770`, with `Recommended` badge and 3 status icon buttons (good / suggestion / remove — same iconography as `ActionsButtons`).
- **Sections**:
  - `Chassis` — radio with one selected (`Dell PowerEdge R770`) + a `Change` link to swap chassis entirely.
  - `CPU` — radio list of Intel Xeon variants with cores/freq labels.
  - `GPU` — radio list of NVIDIA H100/H200/A100/L40S/RTX 6000 Ada and AMD Instinct M300X/M250X (some visibly disabled).
  - `RAM. Total 256 GB` — checkboxes for DIMM SKUs (`16GB DDR5 RDIMM 4800MHz`, …) with **quantity inputs** on the right (`10`, `2`).
  - `Power` — radio list of `1× DELL 1100W`, `2× DELL 1100W`, `1× DELL 1400W`, … (selected count and wattage).
- The total RAM (`256 GB`) is **derived** from the per-DIMM quantities × DIMM size.

---

## 4. Required user flow

```
[/dashboard]
   • Show 3 fake test projects in the existing project list.
   • Each is mostly a "hardware-first" project (real or mock RFP doesn't matter for v1).
   • User picks one row → navigate to <project's hardware entry>.

[Hardware overview]
   • Screen A — multi-rack blueprint (Dell brand by default).
   • User can change brand via the top-right pill (only colour/skin changes for v1).
   • User clicks a rack column.

[Rack detail]
   • Screen B — full rack with RU 01..42, server units placed.
   • User clicks a server unit OR uses the carousel arrows to switch racks.

[Component configurator]
   • Screen C — left sidebar with totals, center component list, right Catalog.
   • User changes Chassis/CPU/GPU/RAM/Power → totals update locally (no backend).
   • User can navigate back via breadcrumb or carousel.
```

The dashboard test projects are **manual seed**, not generated. Click → goes straight into the hardware flow. The existing Questions/Use cases/Proposal flow is not needed for v1 unless you say otherwise.

---

## 5. Scope

### In scope (v1)

- 3 fake projects on the dashboard (visible alongside any real ones, or in a dedicated dev mode — see Q2).
- Hardware overview screen (Screen A).
- Rack detail screen (Screen B), without drag-and-drop — clicking a unit just opens it.
- Component configurator screen (Screen C).
- Brand pill switcher → changes canvas colour and brand label only.
- Local-only state for Chassis/CPU/GPU/RAM/Power selections, with totals recomputed in the left sidebar.
- Lead-score gate disabled for the test projects (or set high so it never triggers).

### Out of scope (v1, deferred)

- Drag-and-drop reordering inside a rack.
- The `+` button (add rack / add server unit).
- The `Standalone` column behaviour beyond rendering.
- The "Change" chassis flow.
- Real persistence to the backend.
- Questions/Price tabs reworked for hardware (assume they keep current behaviour).
- The Magic AI Advisor (chat) reskin.
- Mobile layout.
- Animations between Screen A → B → C (assume instant for v1; we add motion later).

---

## 6. Proposed data model (rough draft)

> Treat the snippets below as a **sketch** to align on, not committed code. Once we agree, we'll lift it to `types.ts` and `fake-data.ts` in this folder.

```ts
// Brand pill colour scheme
type Brand = "dell" | "hp" | "standart" | "nvidia";
type RackKind = "ai_server" | "infrastructure" | "standalone";
type ComponentCategory =
  | "cpu" | "memory" | "m2_drive" | "hdd_ssd"
  | "gpu" | "network" | "power" | "cooling";

interface FakeProject {
  id: string;
  name: string;             // "First Emirates Bank Enterprice"
  client_name: string;
  lead_score: string;       // "9.6/10"
  brand: Brand;             // default brand for the canvas
  hardware: {
    racks: FakeRack[];
    grand_total: number;    // computed; mirrored for display
  };
}

interface FakeRack {
  id: string;
  name: string;             // "AI Server Rack 01"
  kind: RackKind;
  ru_height: 42;            // standard 42U for v1
  total_price: number;      // computed
  units: FakeRackUnit[];    // empty for "standalone" v1
}

interface FakeRackUnit {
  id: string;
  ru_start: number;         // bottom RU (1..42)
  ru_size: number;          // 1U / 2U / 4U
  product: FakeServerProduct;
}

interface FakeServerProduct {
  sku: string;              // "POWEREDGE-XE9680"
  name: string;             // "Dell PowerEdge XE9680"
  brand: Brand;
  ru_size: number;
  description: string;      // long marketing description
  thumbnail_url: string;    // /assets/hardware/...
  power_watts: number;      // 1665
  btu_per_hr: number;       // 5681.22
  components: FakeServerComponent[];
}

interface FakeServerComponent {
  category: ComponentCategory;
  qty: number;              // "2×"
  sku: string;
  name: string;             // "Intel Xeon Platinum 8352Y"
  description: string;      // "32 Core - 2.20 GHz - …"
  unit_price: number;
}

// Catalog data shown in the right sidebar
interface FakeCatalog {
  chassis: CatalogOption[];                 // radio
  cpu: CatalogOption[];                     // radio
  gpu: CatalogOption[];                     // radio (some disabled)
  ram: {
    target_total_gb: number;                // 256
    options: CatalogRamOption[];            // checkbox + qty
  };
  power: CatalogOption[];                   // radio
}

interface CatalogOption {
  sku: string;
  label: string;            // "Intel Xeon 6335P (4C 12M 2.80 GHz)"
  recommended?: boolean;
  disabled?: boolean;
}

interface CatalogRamOption {
  sku: string;
  label: string;            // "16GB DDR5 RDIMM 4800MHz"
  size_gb: number;          // 16
  speed_mhz: number;        // 4800
  default_qty?: number;     // for the seed
}
```

Computed values to surface:

- `rack.total_price = Σ unit.product.unit_total` where unit_total = Σ component.qty × component.unit_price.
- `project.hardware.grand_total = Σ rack.total_price`.
- `server.total_ram_gb = Σ selected_ram.qty × selected_ram.size_gb` (must equal `target_total_gb` to be valid).
- `server.power_watts` and `btu_per_hr` — TBD (Q12): hardcoded on chassis, or derived from selected components?

---

## 7. Proposed integration points

### 7.1 Routes

Two options — pick one in Q11.

**Option A — new top-level route (cleaner for v1, easier to ship without breaking existing flow):**

```
/projects/:id/hardware                 → Screen A (overview)
/projects/:id/hardware/racks/:rackId   → Screen B (rack detail)
/projects/:id/hardware/racks/:rackId/units/:unitId → Screen C (configurator)
```

Reuses `layouts/project.tsx` so we keep header, breadcrumbs, left sidebar, right sidebar.

**Option B — third diagram mode in `DiagramContext`:**

Reuse `/projects/:id/systems/:systemId`, extend `Diagram` to `"dell" | "nvidia" | "hardware"`, swap the diagram renderer when `hardware` is picked. Cleaner long-term but couples the new flow to the existing system tree.

### 7.2 Components

Proposed new folder: `app/components/hardware/`

```
HardwareCanvas.tsx        — full-bleed blueprint background + brand colouring
RackCarousel.tsx          — top-center carousel (← • • → +)
BrandSelector.tsx         — top-right brand pill dropdown
RackOverview.tsx          — multi-rack horizontal layout (Screen A)
RackColumn.tsx            — rack thumbnail used in overview + side blur
RackDetail.tsx            — full rack with RU ruler (Screen B)
RuRuler.tsx               — vertical 01..42 numbers
RackUnit.tsx              — server occupying a U-range, with drag handle slot
ServerComponentList.tsx   — center column in Screen C
ServerInfoCard.tsx        — bottom card with thumbnail + power stats
CatalogPanel.tsx          — right sidebar in Screen C (Chassis/CPU/GPU/RAM/Power)
CatalogSection.tsx        — grouped radio/checkbox section
CatalogOptionRow.tsx      — single radio/checkbox row
CatalogRamRow.tsx         — checkbox + numeric qty input
ProjectRackTotalsSidebar.tsx — left sidebar variant for hardware mode
```

### 7.3 State

- New `HardwareContext` (or just a React Query cache key against the fake data) holding `{ projects, currentBrand, draftSelections }`.
- All mutations are local (no axios). Use `setQueryData` against an `EQueryKey` like `HARDWARE_PROJECT` so the rest of the app keeps the "Query is the source of truth" pattern even when the data is fake.
- Add `EQueryKey.HARDWARE_PROJECT`, `HARDWARE_CATALOG` to `app/constants/queryKeys.ts` so the cache stays consistent.

### 7.4 Theming

- The brand pill writes a `data-brand="dell|hp|standart|nvidia"` on the hardware canvas root.
- Add CSS rules in `app/app.css` (or a new `app/components/hardware/hardware.css`) that map each `data-brand` to its blueprint colour, ruler colour, and rack-illustration tint. Same pattern as `data-customer` (see `app/docs/09-styling-and-theming.md`).

### 7.5 Sidebars

- **Left** — for hardware screens, render `ProjectRackTotalsSidebar` instead of the current `SidebarLeft` content (or extend `SidebarLeft` with a `mode="hardware"` prop). The header card becomes "client name + lead score + per-rack totals + grand total + Preview Proposal".
- **Right** — for the configurator (Screen C), the `Catalog` tab content becomes `CatalogPanel`. `Magic AI Advisor` stays as today.

---

## 8. How the dashboard becomes the entry point

Three options for seeding the 3 test projects (decide in Q2):

1. **Inject into the existing `getProjects()` response in dev** — patch `app/api/projects.ts` or shim TanStack Query to merge 3 fake projects on top of the real list, gated by `import.meta.env.DEV` or `VITE_HARDWARE_DEMO=1`.
2. **Replace the dashboard query in dev** — only fake projects shown.
3. **Separate dev route** — `/dev/hardware` that lists the 3 fake projects.

Whatever we pick, click on one of the 3 → navigates to `/projects/<fake-id>/hardware` (Option A) or `/projects/<fake-id>/systems/<fake-system-id>?diagram=hardware` (Option B).

---

## 9. Open questions (please answer before we code)

> The numbering matches references throughout this doc.

1. **Single source for hardware view: new route (A) or new diagram mode (B)?** (See §7.1.)
2. **Where do the 3 fake projects live: dev-merge / dev-replace / separate dev route?** (See §8.)
3. **Brand pill scope:** is brand a per-rack property, a per-project property, or just a view-level theme override? In the mockups it visibly changes only the canvas colour.
4. **What does the `+` button do** in the carousel — add a new rack, add a new server unit, or open a "new item" menu?
5. **`Standalone` column** — what is it semantically? An "unallocated bin" of items not in any rack? A virtual rack with no RU constraints? The bottom of it shows a small input/dropdown — what is that?
6. **Adjacent blurred racks** in Screen B — purely decorative, or clickable to navigate to neighbour rack?
7. **`Change` link next to Chassis** in Screen C — separate flow (modal/sheet to swap chassis), or just clears the radio?
8. **Local persistence behaviour** — when the user changes a CPU and navigates away then back, do the selections persist for the session? Forever (`localStorage`)? Reset on reload?
9. **Brand list** — confirm the four brands (`dell`, `hp`, `standart`, `nvidia`) and their canvas colours. Anything else?
10. **Lead score format** — mockup shows `Lead score: 9.6` (no `/10`). Are we changing the display to drop the denominator, or is this just mockup shorthand?
11. **URL structure** — confirm or amend the routes in §7.1.
12. **`1665 Watts` / `5681.22 BTU/Hr`** — hardcoded on the chassis, or computed from selected components? If computed, what's the formula?
13. **Questions / Price tabs** in the new top bar — same as today (subsystem-scoped) or hardware-specific?
14. **Drag-and-drop** inside a rack — defer to v2 confirmed?
15. **Magic AI Advisor** — does it know about the rack context (asks the user to e.g. "swap GPU for H200 across all racks"), or is it the same project-scoped chat?
16. **i18n** — English only for v1?
17. **Responsiveness** — desktop-only for v1?
18. **Accessibility** — what's the bar for keyboard navigation in the rack/unit selection?
19. **Component categories list** — confirm the 8 from Screen C (CPU, Memory, M.2 Drive, Hard Drive / SSD, GPU, Network Card, Power, Cooling System). Add any?
20. **GPU "disabled" rows** in the catalog (some options are visibly greyed) — what determines disabled state? (Out of stock? Incompatible chassis? Future flag?)
21. **RAM total enforcement** — must total exactly `target_total_gb`, or just be ≤ a max? UI behaviour when it doesn't match?
22. **Asset images** — do you have rack/RU/server images we'll use, or do we mock with placeholders from the existing `app/assets/hardware/` set?

---

## 10. Phased implementation plan (proposal)

### Phase 0 — alignment (this doc)
- Confirm answers to §9.
- Move agreed decisions into this PLAN as ✅ items.
- Lock the data model in `types.ts` and seed in `fake-data.ts` (sibling files).

### Phase 1 — dashboard entry + 3 fake projects
- Add `EQueryKey.HARDWARE_PROJECT`.
- Inject 3 fake projects (per Q2 decision).
- Click → navigate to hardware route.

### Phase 2 — Hardware overview (Screen A)
- New route + layout.
- `HardwareCanvas`, `BrandSelector`, `RackCarousel`, `RackOverview`, `RackColumn`.
- Brand pill changes canvas colour only.
- Click rack → Screen B.

### Phase 3 — Rack detail (Screen B)
- `RackDetail`, `RuRuler`, `RackUnit`, blurred neighbour previews.
- Click unit → Screen C.
- Carousel arrows switch rack.

### Phase 4 — Component configurator (Screen C)
- `ServerComponentList`, `ServerInfoCard`.
- `ProjectRackTotalsSidebar` (left).
- `CatalogPanel` + `CatalogSection` + `CatalogOptionRow` + `CatalogRamRow` (right).
- Local state for selections; recompute totals.

### Phase 5 — Polish
- Brand colour theming refinements.
- Empty states (`Standalone`).
- Animations.
- Keyboard navigation.

### Phase 6 — Backend wiring (later, not now)
- Replace fake-data hooks with real API calls.
- Persist selections.
- Hook into the existing system-tree generation flow.

---

## 11. Files we will create in this folder

As decisions firm up, this folder will hold:

```
app/docs/features/hardware-configurator/
├── PLAN.md            ← this file
├── decisions.md       ← log of every answered question (§9 with decisions)
├── types.ts           ← committed TS interfaces (no app imports)
├── fake-data.ts       ← seed data for the 3 projects + catalogs
├── routes.md          ← final route map for the feature
└── components.md      ← final component tree under app/components/hardware/
```

Per the project doc convention (`app/docs/README.md`), code lives in its own files; markdown only explains intent.

---

## 12. References (existing docs you should read with this)

- `app/docs/02-architecture.md` — render tree and provider model we have to fit into.
- `app/docs/04-routes.md` — how routes are declared (we'll mirror the pattern).
- `app/docs/05-state-and-data-fetching.md` — how to set Query keys for fake data so the rest of the app stays consistent.
- `app/docs/07-domain-model.md` — current domain (System, Subsystem, Product). The hardware model is a different shape, but we should be aware of overlaps.
- `app/docs/09-styling-and-theming.md` — `data-customer` pattern we will mirror with `data-brand`.
- `app/docs/12-key-components.md` — the existing diagram components (`StackDell`, `Stack`) we are NOT replacing in v1.
- `app/docs/14-implementation-playbook.md` — the recipes we will follow once Phase 1+ starts.
