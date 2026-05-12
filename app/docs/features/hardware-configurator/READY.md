# Hardware Configurator — Ready to start?

> One-page status. Sign off the small list at the bottom and we begin.
> Deep references: `DATA-ANALYSIS.md` (data + assets), `USER-FLOW.md` (UX), `PLAN.md` (long form).

---

## A. What is locked in

### Project & scope
- **One project.** Name verbatim: `Avaya POD Cluster – IPO200`.
- **Entry point.** App opens **directly** on the Avaya project's `Design` tab. No dashboard, no project picker.
- **No pricing** anywhere except a single **Grand Total** in the left sidebar.
- **No brand selector**, **no loading / "Analyzing your requirements…" states**.

### Source of truth
- **Data:** the Avaya proposal only (raw text at `./source/avaya-ipo200.txt`).
- **Structure / UI:** the new screenshots, treated as a structural reference only — none of the visible specs in them are real Avaya data.

### Inventory we render (assets ∩ proposal)
- **6 subsystems** map 1:1 to BoQ groups: Hyper-v cluster · VMware cluster · SAN Storage · Management Switch · ToR Switches · SAN Switches.
- **5 component categories** survive the filter and appear on Screen C: **CPU · Memory · Hard Drive / SSD · Network Card · Power**.
- All specs come from the BoQ verbatim (`Intel Xeon Gold 6548Y+`, `32GB RDIMM DDR5-5600`, etc.).

### Canvas layout
- Screen A shows **4 racks in this order**: `[empty] [Rack 01 — Hyper-v + Shared] [Rack 02 — VMware] [empty]`.
- Rack frame asset = `Verstka/Server_BG.png` (42U).
- Concrete U-positions: see `DATA-ANALYSIS.md §8.1`.

### Right Catalog panel
- **Screen A/B context:** subsystem categories (e.g. `Compute Server`, `Server Storage`, `Server GPU`, `Management Node Server`) with status badges `In proposal · Removed · Not in proposal`. May include extra fake categories to make the list look populated.
- **Screen C context:** product alternatives (e.g. alternative chassis, alternative components for the currently viewed cluster) with the same status badges. Hardcoded fake list in `fake-data.ts`.

### Left sidebar in hardware mode
- Logo (Magic).
- Project header (`Avaya POD Cluster – IPO200`, `Lead score: 9.6`).
- `Grand Total` line.
- `Preview Proposal` button.
- Subsystem nav: project node at top (`Avaya Prod Cluster IPO 200`) → 6 children in order: `Hyper-v cluster` · `VMWare cluster` · `SAN Storage` · `Management Switch` · `ToR Switches` · `SAN Switches`.

### Animation strategy (framer-motion)
- Library: `framer-motion` (already a project dep — see `app/docs/01-stack-and-libraries.md`).
- **Canvas background**: subtle zoom-in when the user selects a rack (Screen A → B) and zoom-out on deselect. Done via `<motion.div>` on the canvas wrapper with `scale` + `transition`.
- **Rack selection**: clicked rack `scale: 1` while neighbours `scale: 0.92` + `filter: blur(4px) opacity(0.5)`. Reverse on back.
- **Server-row hover (Screen B)**: subtle `scale: 1.02`, `box-shadow` lift, drag-dot indicator fades in. Trigger via `whileHover`.
- **Subsystem nav item hover**: small background fade.
- **Catalog status badge hover**: pulse on the action icons (Add / Edit / Remove).
- **Screen transitions**: A ↔ B ↔ C use `AnimatePresence` with `motion.div` `opacity` + `y: 10 → 0`.
- No skeletons / no "Analyzing your requirements" loaders (per Q-S11).

---

## B. Last 5 micro-decisions before I generate the data tree

Pick `default` or override. None block each other.

| # | Question | My proposed default |
| --- | --- | --- |
| 1 | **Server image mapping.** We have 4 `Server_Dell_0X.png`, 6 chassis types. | `01 → R660 (1U)`, `02 → R760 (2U)`, `03 → Unity 380F (2U)`, `04 → all 5 switches` |
| 2 | **Switches on Screen C.** They have 0 component rows after the filter. | **Show a chassis-only card** (chassis image + spec sentence, no component rows) |
| 3 | **`Standalone` column on Screen A** (5th column in the old mockup). | **Drop entirely** — we already use 4 racks (2 empty + 2 filled) |
| 4 | **Component count convention** on Screen C. | **Per single chassis** (e.g. `CPU × 2` = 2 per R660; title still reads `14 × Dell PowerEdge R660 — Hyper-v Cluster`) |
| 5 | **Red X with line on Screen B** (your annotation in the screenshots). | Treat as **annotation only** — not a UI element |

If any of these need to change, tell me which # and the new answer. Anything you don't comment on, I take as agreed.

---

## C. Step-by-step implementation plan

Each step ends with a checkpoint where you review before we move on.

### Step 0 — Asset move (no `app/` code yet)
- Copy `/Verstka/*.png` → `app/assets/hardware/verstka/`.
- Copy `/Verstka/*.svg` → `app/components/hardware/icons/` (imported via `vite-plugin-svgr`).
- ✅ Checkpoint: I list every file with its new path; you ack.

### Step 1 — Data tree (the most important step)
- Create `app/features/hardware/types.ts` with:
  `Project`, `Subsystem`, `Rack`, `RackUnit`, `Chassis`, `Component`, `CatalogEntry`, status enum, etc.
- Create `app/features/hardware/fake-data.ts` with the full Avaya project filled in per `DATA-ANALYSIS.md` §2 + §8.1 + §13.
- ✅ Checkpoint: you review both files; we tweak names / shape until you're happy. **No UI yet.**

### Step 2 — Entry routing
- Add a redirect / direct route so the app lands on the Avaya `Design` tab. Re-use existing `/projects/:id/systems/:systemId` mechanics.
- ✅ Checkpoint: cold-loading the app opens straight on the Design tab.

### Step 3 — Screen A (multi-rack overview)
- New `HardwareDesign` component swapped into the Design tab body.
- Canvas: 4 racks in a row using `Server_BG.png`. Top chrome: server carousel + `+` button. No brand pill.
- Left sidebar swaps to hardware-mode (project header, Grand Total, Preview Proposal, 6-item subsystem nav).
- Right Catalog tab swaps to subsystem-categories list.
- ✅ Checkpoint: visual match for Screen A.

### Step 4 — Screen B (single rack detail)
- Click a rack → routes to a "single rack" view. Two neighbour racks blurred on the sides.
- Each `RackUnit` is rendered at its `positionU` using the right `Server_Dell_0X.png`.
- Hover state on a server row.
- ✅ Checkpoint: visual match for Screen B.

### Step 5 — Screen C (cluster component view)
- Click a subsystem (left sidebar) OR a server in the rack → routes to the cluster component view.
- Title: `{N} × {ChassisName} — {SubsystemName}`.
- Component rows for the 5 surviving categories, each with the right `Component_*.png` icon.
- Chassis hero card at the bottom (image + spec sentence + Watts/BTU placeholders).
- ✅ Checkpoint: visual match for Screen C.

### Step 6 — Right Catalog: product-alternatives
- Swap the right Catalog body when on Screen C.
- Show ~3–4 fake alternative chassis / component products with status badges.
- ✅ Checkpoint: visual match.

### Step 7 — Polish
- Breadcrumbs (`Project › Avaya POD Cluster – IPO200 › Hyper-v Cluster`).
- `Preview Proposal` and `Share` buttons (cosmetic only, no real action).
- Empty-rack rendering (frame only, no label).
- ✅ Final checkpoint.

---

## D. What we will NOT do (still v2)

- Drag-and-drop in racks.
- The `+` button behaviour (placeholder only).
- "Change" chassis flow.
- Magic AI Advisor adapting to hardware context.
- Mobile / responsive layout.
- Real backend (everything reads from `fake-data.ts`).
- Keyboard / accessibility polish.
- Real proposal export (Preview Proposal button is cosmetic).
