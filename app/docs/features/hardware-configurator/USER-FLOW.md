# Hardware Configurator — User Flow (canonical)

> Source of truth for the user journey through the hardware configurator.
> Captured from the user on 2026-05-11. Update only when the product decision changes.
> See `./IMPLEMENTATION.md` for open questions, `./PLAN.md` for the deep design notes.

## 0. Pre-conditions

- User is logged in (existing auth flow, unchanged).
- The 3 fake hardware projects are always visible on the entry screen, independent of real backend data.

## Step 1 — Entry screen

Reuses the existing dashboard root (the "describe your project" screen), unchanged in spirit. New addition:

- **Existing**: "Describe your project" textarea, file upload, project history list.
- **NEW**: directly under the project input, before/alongside the history, we render **3 fake hardware project cards**.
- User clicks one of the 3 fake project cards.

## Step 2 — Project route (existing, untouched routing)

- Navigation lands on the existing project URL: `/projects/:id/systems/:systemId`.
- The page already has 3 tabs at the top: **Questions · Design · Price**.
- We do **not** change Questions or Price.
- We **only modify the body of the Design tab** for the hardware projects.

## Step 3 — Design tab, Overview (Screen A)

Matches `010_UI_1.jpg`.

- Centre canvas: N racks side-by-side
  (example: `AI Server Rack 01`, `AI Server Rack 02`, `Infrastructure Rack 03`, `AI Server Rack 04`, `Standalone`).
- Each rack thumbnail shows its server/RU layout in miniature.
- Top of canvas chrome:
  - carousel arrows `← rack-strip →`,
  - `+` button,
  - brand pill on the right (`Dell` / `HP` / `Standart` / `Nvidia`).
- The brand pill changes only the **canvas colour theme**.
- No rack is selected yet. User clicks a rack to drill into Screen B.

## Step 4 — Design tab, Single rack (Screen B)

Matches `010_UI_Server_HP.jpg` (HP/green theme) and `010_UI_Server_GRAY.jpg` (Standart/neutral theme).

- One rack is centred, **42 RU** numbered `01…42` on the left side of the rack.
- The two neighbouring racks appear **blurred** on either side (decorative; see open Q in `IMPLEMENTATION.md`).
- On **hover** over a server unit:
  - the unit's row lights up (white card background),
  - a **dots indicator** appears at the right edge of the row.
- The dots indicator is interpreted as a **hover/selection marker, not a drag handle** (see C4 in `IMPLEMENTATION.md`).
- Clicking a server unit goes to Screen C.

## Step 5 — Design tab, Component view (Screen C)

Matches `010_UI_Components_02.jpg` and `010_UI_Components_03.jpg`.

- Centre canvas replaces the rack with a **parts list for the selected server**:
  - Header bar with the chassis name (e.g. `Dell PowerEdge XE9680`), the rack name (`Infrastructure Rack 01`) and the RU range (`U34–35`).
  - Stacked rows, one per component category, each with quantity and spec text:
    `CPU`, `Memory`, `M.2 Drive`, `Hard Drive / SSD`, `GPU`, `Network Card`, `Power`, `Cooling System`.
  - Bottom: full chassis hero card with image, summary text, Wattage and BTU/Hr badges.
- Right sidebar switches to the **Catalog** tab.
- The Catalog body shows **alternative versions** for each component slot:
  - Chassis variants (with `Change` link),
  - CPU radio list,
  - GPU radio list,
  - RAM DIMM checkboxes with quantity counters (e.g. `16GB DDR5 RDIMM 4800MHz × 10`),
  - Power supplies radio list.
- Selecting a different option in the Catalog updates the matching row in the centre parts list.

## Step 6 — Sidebars in hardware mode

The two sidebars from the existing project layout stay, but their bodies switch:

- **Right sidebar** (existing tabs: `Magic AI Advisor` · `Team` · `Catalog`):
  - `Magic AI Advisor` and `Team` tabs unchanged.
  - `Catalog` tab body is replaced with the component-options panel from Step 5.

- **Left sidebar** (project meta):
  - Existing customer-meta block at the top (`First Emirates Bank Enterprise`, `Lead score: 9.6`) — kept.
  - The use-case / subsystem accordion list is replaced (or hidden) with a **rack totals list**:
    `AI Server Rack 01  $123,176`
    `AI Server Rack 02  $123,176`
    `Infrastructure Rack 03  $171,412`
    `AI Server Rack 04  $123,176`
    `Standalone  $8,743`
    `Grand Total  $644,475`
    `[ Preview Proposal ]` button.

## Step 7 — Back-navigation

The flow is **Screen A → B → C**, but back-navigation is not yet specified:

- Screen C → Screen B: how? (Back button? Click outside? Breadcrumb?)
- Screen B → Screen A: how? (Carousel arrows? Breadcrumb?)

Open question — tracked in `IMPLEMENTATION.md`.

## Visual reference

| Screen | Mockup files | What is being shown |
| --- | --- | --- |
| A | `010_UI_1.jpg` | Multi-rack overview |
| B | `010_UI_Server_HP.jpg`, `010_UI_Server_GRAY.jpg` | Single rack with one row hovered |
| C | `010_UI_Components_02.jpg`, `010_UI_Components_03.jpg` | Server's parts list + Catalog options |
