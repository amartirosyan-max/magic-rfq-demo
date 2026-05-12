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
| _(pending)_ | Step 3 | `feat(hardware): Screen A — 3-part shell + multi-rack canvas` |

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
**Status:** done.

What:
- `app/features/hardware/HardwareLayout.tsx` — 3-column shell `[260px | 1fr | 360px]`.
- `app/features/hardware/SidebarLeft.tsx` — Magic logo, project header, lead score, Grand Total, Preview Proposal button, subsystem nav (project node + 6 children).
- `app/features/hardware/SidebarRight.tsx` — `Magic AI Advisor / Team / Catalog` tabs (Catalog active); body lists `subsystemCategories` from `fake-data`.
- `app/features/hardware/CatalogEntryCard.tsx` + `StatusBadge.tsx` — one catalog entry with status pill, 3 action buttons, description.
- `app/features/hardware/Rack.tsx` — single rack with `Server_BG.png` frame + absolute-positioned `Server_Dell_0X.png` units. U-positioning derived from `positionU` / `sizeU`. Empty racks render with reduced opacity.
- `app/features/hardware/TopChrome.tsx` — breadcrumb, Design/Questions/Price tabs (Design active), rack carousel control, `+` button. Brand pill omitted.
- `app/features/hardware/ScreenA.tsx` — blueprint-grid canvas with 4 racks in a row + column labels.
- `app/routes/avaya/index.tsx` — swap placeholder for `<HardwareLayout><ScreenA /></HardwareLayout>`.

Animations (framer-motion):
- Rack: `whileHover scale 1.03`, spring transition.
- Sidebar buttons / nav items / catalog action buttons: subtle scale on hover + tap.
- Screen mount: fade + scale-in on the canvas.

Tuning points:
- `Rack.tsx` `TOP_INSET_PCT` / `BOTTOM_INSET_PCT` — adjust to visually fit unit area inside `Server_BG.png` cap/feet.
- Rack width (140 px) and aspect ratio — adjust if racks look too thin or tall.
- Image mapping `Server_Dell_01..04.png → R660/R760/Unity 380F/switches` per Q-A1 default.

Verification:
- `npx tsc --noEmit` clean.
- HMR picked up the changes; visit `http://localhost:5173/` → redirects to `/avaya` and shows the 3-part layout with Screen A.

### Step 4 — Screen B (single rack detail)
**Status:** not started.

Plan:
- Click a rack → routes to `/avaya/racks/:rackId` (or pure state, TBD).
- Two neighbour racks blurred on either side.
- 42U numbered scale on the left of the centred rack.
- Hover state on a server row (white background + dots indicator).
- framer-motion zoom-in transition from Screen A.

### Step 5 — Screen C (cluster component view)
**Status:** not started.

Plan:
- Click a subsystem (left sidebar) or a server row → `/avaya/subsystems/:subsystemId`.
- Title: `{qty} × {chassis.name} — {subsystem.titleSuffix}`.
- Component rows for the 5 surviving categories with `Component_*.png` icons.
- Chassis hero card at the bottom (image + spec sentence + Watts/BTU placeholders for now).

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
