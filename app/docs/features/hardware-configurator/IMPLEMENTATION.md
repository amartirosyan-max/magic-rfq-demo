# Hardware Configurator — Implementation Q&A

> Walk-through doc. One block at a time. We do **not** start code until at least Block 2 is fully ✅.
>
> **Status legend:** ❓ open · ✅ answered · 💡 inferred from user (please confirm) · ⏭ deferred to v2

Canonical user flow lives in `./USER-FLOW.md`.
Deep design notes live in `./PLAN.md`.

---

## Snapshot

- Block 1 (clarifications): ❓ 5 · 💡 1 · ✅ 2
- Block 2 (blocking decisions): ❓ 3 · ✅ 3
- Block 3 (defaults to confirm): all ❓
- Block 4 (defer to v2): all ❓
- Block 5 (new questions from the user-flow round): ❓ 7

---

## Block 1 — Clarifications

### C1. `010_UI_Components_03.jpg`
Status: ✅
You said this is the **same Component view as Components_02**, the "parts list" inside a selected server. Treated as a duplicate / second state of Screen C. (See B5 if there is a meaningful difference between the two.)

### C2. The "Standalone" rack column (last column in Screen A)
Status: ❓
Still unclear — bin for unallocated items? Virtual rack with no RU constraints? Anything else?
Answere - the stand alone is the part that dont need rack. Clients could get it from analyse of their reqiroments. its the same part as we have inide the rackand on it click we should open the screen to see what we have inside ho you select the component inisde the rack.

### C3. The `+` button in the top carousel
Status: ❓
Still unclear — adds a new rack, a new server, or opens a menu?
Answere - i dont know what it will do but we should have it the fucntionality we will make later.

### C4. The drag-handle dots icon (hover state on a server row)
Status: 💡 → please confirm
From your flow ("on hover user sees the concrete selected rack component") I'm reading it as a **hover/selection indicator only — not a drag handle, no drag-and-drop in v1**. Confirm so I can lock it in.
Answere - it will be in but for implementation start we didnt do it yet.

### C5. The "Change" link next to **Chassis** in the Catalog
Status: ❓
Modal? Inline dropdown? Goes back to Screen B?
Answere: we dont know yet it alos will be in next steps

### C6. Blurred neighbouring racks on Screen B
Status: ❓
Clickable to switch rack, or purely decorative?
Answere - Clickable to switch the selected rack

### C7. The "Standart" brand pill (gray mockup)
Status: 💡 → please confirm
Reading as a **neutral / generic brand skin** (gray canvas, no specific vendor styling). Confirm.
Answere: we will add the brands specificas later currently we only can use 1 back ground for all then we will modify it to have a few.

### C8. The small input/dropdown at the bottom of the "Standalone" column
Status: ❓
What is it for?
Answere: its a standalone component not an input. the components could also be without rack and we visualise it like this. 


---

## Block 2 — Blocking decisions

### Q1. Where do the 3 fake test projects appear?
Status: ✅
On the existing entry screen (the "describe your project" page) — **under the project input, alongside / above the project history**. Two micro-questions left:
- (a) Render them as their own row above the history, or as the **first 3 cards inside** the history list?
- (b) Hidden behind a dev flag (`VITE_HARDWARE_DEMO=1`), or visible always?

### Q2. Route shape — new route or third diagram mode?
Status: ✅
We **reuse the existing route** `/projects/:id/systems/:systemId`. We only change the **body of the Design tab**. No new top-level route.

### Q3. Click on a fake project → first tab the user lands on?
Status: ✅
Lands on the existing project page with the existing **Questions / Design / Price** tabs. Open follow-up: **which tab is selected by default for a fake hardware project?** Current app defaults to Questions; should it now default to **Design** for these 3 projects?

### Q4. Brands — confirm the list and meaning
Status: ❓
Same question as before:
- Keep all four: `dell`, `hp`, `standart`, `nvidia`? 
Answere - yes keep but we will add spcific backgroud later.
- Brand is **view-only** (just retints the canvas), correct?
Answere: yes its view only

### Q5. Local persistence of selections (CPU / GPU / RAM / Power)
Status: ❓
- (a) TanStack Query cache only → reset on full page reload, or
- (b) `localStorage` per project → survives reload.
ANswere - lets do reset after full page reload. then we will make it survive.

### Q6. Power (Watts) + BTU/Hr on the chassis card (Screen C)
Status: ❓
- (a) Hardcoded on the chassis in the fake data, or
- (b) Computed live from selected components.
ANswere - we do all fake data for this project now then we will implement back end according dara structure that we need and get

---

## Block 3 — Defaults I will assume unless you stop me

(Unchanged from previous round. Anything you don't override, I take as agreed.)

- **D1.** 8 component categories: CPU, Memory, M.2 Drive, Hard Drive / SSD, GPU, Network Card, Power, Cooling System — exactly these, in this order.
- **D2.** RAM total = chassis target (e.g. 256 GB); over / under is shown as invalid.
- **D3.** Every rack is 42U in v1.
- **D4.** USD everywhere, formatted via existing `formatToUSD()`.
- **D5.** Keep storing lead score as `"9.6/10"` but on hardware screens display only the numerator (`9.6`).
- **D6.** Sidebar behaviour:
  - left → swap body to "rack totals + Preview Proposal" when in Design tab of a fake hardware project,
  - right → swap `Catalog` tab body to the new component-options panel.
- **D7.** Use existing PNGs under `app/assets/hardware/*` as placeholders; real per-RU rack art comes later.
- **D8.** Theming via `data-brand="dell|hp|standart|nvidia"` on the canvas root, CSS-only colour swaps in `app/app.css`.
- **D9.** Fake data + types live in `app/docs/features/hardware-configurator/{types.ts, fake-data.ts}` and are imported into the app from there.

---

## Block 4 — Confirm we DEFER to v2

| Topic | Status |
| --- | --- |
| Drag-and-drop reordering inside a rack | ❓ |
| The `+` carousel button behaviour | ❓ |
| The "Change" chassis flow | ❓ |
| Magic AI Advisor adapting to the rack context | ❓ |
| Mobile / tablet layout | ❓ |
| Real backend persistence | ❓ |
| Keyboard / accessibility polish | ❓ |

---

## Block 5 — New questions raised by the user-flow round (B1–B7)

### B1. Default tab on a fake project
Status: ❓
When the user clicks a fake hardware project, do we **force the Design tab to be active** (because the project is "about hardware"), or keep the default Questions tab and let the user click Design themselves?
Answere - force the Design tab to be active

### B2. State of the fake projects
Status: ❓
Are the fake projects:
- (a) "complete" shells — questionnaire pre-answered, lead score filled, billing range filled, hardware ready to view, or
- (b) empty / partial — only the Design tab has meaningful content, Questions and Price are placeholder?
Answere - b

### B3. Subsystem context for the Design tab
Status: ❓
The existing route is `/projects/:id/systems/:systemId`. In your flow we land directly on a hardware screen — does that mean each fake project has **one fixed system+subsystem pre-selected** (e.g. `Hardware Infrastructure`), and the new Design body lives under that subsystem? Confirm we don't need a system-tree navigation in v1.


### B4. Left sidebar — replace or coexist?
Status: ❓
In hardware mode the left sidebar shows rack totals (see USER-FLOW Step 6). Do we:
- (a) **fully replace** the existing left-sidebar use-case accordion with the rack totals, or
- (b) keep both — accordion above, rack totals below?

### B5. Components_02 vs Components_03 — meaningful difference?
Status: ❓
The two mockups look identical to me. Is there a state difference I should encode (e.g. one is the default selection, the other is mid-edit) or are they just two renders of the same screen?

### B6. Back-navigation between screens A ← B ← C
Status: ❓
How does the user move backwards?
- A → B: clicking a rack. ✅
- B → C: clicking a server unit. ✅
- C → B: ?
- B → A: ?
Options: breadcrumb, dedicated Back button, click outside the rack, carousel arrows.

### B7. Deep-linkable URLs?
Status: ❓
When a user picks rack 02 → server at U22, does the URL change (e.g. `?rack=02&unit=22`), or is it pure component state? Deep-link support is "nice to have" for sharing, but adds work.

---

## How we will work through this file

1. We resolve **Block 1** clarifications (5 ❓ + 1 💡 to confirm).
2. We resolve **Block 2** remaining decisions (Q4 / Q5 / Q6 + the two micro-questions on Q1 + the follow-up on Q3).
3. We resolve **Block 5** new questions (B1–B7).
4. You skim **Block 3** defaults; tell me which to flip.
5. You skim **Block 4** defer list; tell me if anything must be in v1 after all.
6. When all blocks are ✅, I create `decisions.md` and the data files, and we begin Phase 1.

---

## What we are NOT missing anymore (locked in)

- Entry point: existing dashboard root, fake projects under the project input. ✅
- Routing: existing `/projects/:id/systems/:systemId` route, Design tab body only. ✅
- Three-screen flow inside Design: A (multi-rack) → B (single rack) → C (parts list + Catalog). ✅
- Catalog on the right sidebar swaps to component options when the user is inside Screen C. ✅
- Left sidebar swaps to a rack-totals + Preview Proposal view in hardware mode. ✅ (mode of swap = B4)
- 8 component categories on Screen C (per D1, awaiting confirm). 💡
