# Avaya IPO200 — Data Analysis

> Analysis of `Technical Proposal_AVAYA_IPO200 (1).docx` (raw text saved at `./source/avaya-ipo200.txt`).
> Goal: decide what gets into the fake-data tree before writing `types.ts` / `fake-data.ts`.
> Per your rules: **no cables, no software/services**. Servers + their components only.
> Final tree will live in 2 racks (split TBD — see Section 5).

## Round 2 — locked in (May 12)

- **One project only.** No 3 fake projects. Project name verbatim: **`Avaya POD Cluster – IPO200`**.
- **No per-item or per-rack pricing.** Only a single **Grand Total** in the left sidebar.
- **No brand selector.** The DELL pill in the top-right of the canvas is removed.
- **User flow has changed** — see open Q in §11.
- **Data tree first.** Nothing in `app/` gets touched until `types.ts` + `fake-data.ts` are signed off.

---

## 1. What the proposal contains

The proposal describes an Avaya datacentre refresh with two clusters and shared storage/network infrastructure. The Bill of Quantities (BoQ) section is the only place with line-by-line counts, so it is the **authoritative source** for the data tree.

| Block | Type | Qty | Form factor (per unit) | Section |
| --- | --- | --- | --- | --- |
| Dell PowerEdge R660 (Hyper-V cluster) | server | **14** | 1U | §5.1 |
| Dell PowerEdge R760 (VMware cluster) | server | **2** | 2U | §5.2 |
| Dell EMC Unity 380F (shared storage) | storage | **1** | 2U | §5.3 |
| Connectrix DS-6610B (SAN switches) | switch | **2** | 1U | §5.4 |
| Dell EMC S5224F-ON (ToR switches) | switch | **2** | 1U | §5.5 |
| Dell EMC N3248TE-ON (Mgmt switch) | switch | **1** | 1U | §5.6 |
| **Total chassis units** | | **22** | | |
| **Total RU consumed** | | | **25U** | |

Both racks are 42U each (`APC NetShelter 42U Deep Rack` per the proposal summary; matches our D3 default).

---

## 2. Inventory — what goes into the tree

For each chassis we keep the BoQ rows as **components**. The full breakdown:

### 2.1. Dell PowerEdge R660 — 14 units, 1U each

| # | Component | Category | Qty per server |
| --- | --- | --- | --- |
| 1 | 2.5" Chassis with up to 10 HDDs (SAS/SATA), 2CPU, PERC11 | Chassis | 1 |
| 2 | Intel Xeon Gold 6548Y+ 2.5G, 32C/64T, 60M Cache, 250W | CPU | 2 |
| 3 | 32GB RDIMM, 5600MT/s, Dual Rank | Memory | 4 (128 GB total) |
| 4 | PERC H355 Controller Front | RAID Controller | 1 |
| 5 | 480GB SSD SATA Read Intensive 6Gbps, 2.5in | Hard Drive / SSD | 2 |
| 6 | iDRAC9, Enterprise 16G | Management | 1 |
| 7 | Broadcom 57414 Dual Port 10/25GbE SFP28, OCP NIC 3.0 | Network Card | 1 |
| 8 | Broadcom 5720 Dual Port 1GbE LOM | Network Card | 1 |
| 9 | Emulex LPe35002 Dual Port FC32 Fibre Channel HBA | HBA | 1 |
| 10 | Dual, Hot-plug, Power Supply Redundant (1+1), 800W | Power | 1 (redundant pair) |

### 2.2. Dell PowerEdge R760 — 2 units, 2U each

| # | Component | Category | Qty per server |
| --- | --- | --- | --- |
| 1 | 2.5" Chassis with 8 Universal Drive Slots, Front PERC 11, 2 CPU | Chassis | 1 |
| 2 | Intel Xeon Platinum 8568Y+ 2.3G, 48C/96T, 300M Cache, 350W | CPU | 2 |
| 3 | 32GB RDIMM, 5600MT/s, Dual Rank | Memory | 8 (256 GB total) |
| 4 | PERC H755 SAS Front | RAID Controller | 1 |
| 5 | 480GB SSD SATA Read Intensive 6Gbps, 2.5in | Hard Drive / SSD | 2 |
| 6 | iDRAC9, Enterprise 16G | Management | 1 |
| 7 | Broadcom 57414 Dual Port 10/25GbE SFP28, OCP NIC 3.0 | Network Card | 1 |
| 8 | Broadcom 5720 Dual Port 1GbE LOM | Network Card | 1 |
| 9 | Emulex LPe35002 Dual Port FC32 Fibre Channel HBA | HBA | 1 |
| 10 | Dual, Hot-plug, Power Supply Redundant (1+1), 800W | Power | 1 |

### 2.3. Dell EMC Unity 380F — 1 unit, 2U

| # | Component | Category | Qty |
| --- | --- | --- | --- |
| 1 | Unity XT 380F DPE 25x2.5" Dell Field Rack | Chassis | 1 |
| 2 | Unity F 3.84TB ALL FLASH 25X2.5 SSD | Hard Drive / SSD | 14 |
| 3 | Unity CNA 4x16Gb FC SFPs AF | I/O Module | 1 |

### 2.4. Connectrix DS-6610B SAN Switches — 2 units, 1U each

| # | Component | Category | Qty |
| --- | --- | --- | --- |
| 1 | DS-6610B-L 8/24P switch (incl 8x16Gb SFPs + rack mount kit) | Chassis | 1 |
| 2 | DS-6610B 8 Port 16G SFP Port on Demand Upgrade Kit | Port License Kit | 2 |

### 2.5. Dell EMC S5224F-ON ToR Switches — 2 units, 1U each

| # | Component | Category | Qty |
| --- | --- | --- | --- |
| 1 | S5224F-ON, 24x 25GbE SFP28, 4x 100GbE QSFP28, 2x PSU | Chassis | 1 |

### 2.6. Dell EMC N3248TE-ON Mgmt Switch — 1 unit, 1U

| # | Component | Category | Qty |
| --- | --- | --- | --- |
| 1 | N3248TE-ON, 48x1G, 4x10G SFP+, 2x100G QSFP28, 32GB, 1xAC PSU | Chassis | 1 |

---

## 3. What I excluded per your rules

Removed from every BoQ table:

- **Cables**: `Rack Power Cord 2M (C13/C14 10A)`, `SFP28 to SFP28 Direct Attach Cable`, `OM4 LC/LC Multi Mode Fiber Cable`, `100GbE QSFP28 to QSFP28 Direct Attach Cable`, `Jumper Cord C13/C14`.
- **Software & services**: `ProSupport and Next Business Day Onsite Service 36 Month(s)`, `3Yr ProSupport Plus and 4hr Mission Critical`, `OS10 Enterprise S4128F-ON`.

---

## 4. Borderline items — need your call

These three came up while filtering. Need a yes/no:

### B-A. Optical transceivers (SFP+ / SFP28)
Items like `Dell Networking Transceiver SFP+ 10GbE SR 850nm × 2` appear under several switches. They are not literal cables — they plug into a switch port. **Currently excluded** from the tree (treated as cable-adjacent). Keep excluded? - yes

### B-B. APC PDU
Proposal summary mentions `2 x APC PDU AP7553 32A 230V`. Not in any BoQ table, so I have no SKU-level detail. **Currently excluded.** Want them as a zero-detail rack-mounted unit (1U or 0U vertical), or skip - yes skip?

### B-C. The rack itself
`APC NetShelter 42U Deep Rack` — the physical rack is the container, not a component. I treat it as the `Rack` entity (42U). Confirm. - yes curently i will provide you a 42U rack image and we will have 4 in display (2 empty from left and right and 2 that are containn our proposal components)

---

## 5. Two-rack split — three options

Everything fits comfortably in two 42U racks. I see three plausible splits:

### Option 1 — by cluster (matches the proposal's narrative)
| | Rack 01 — Hyper-V + Shared | Rack 02 — VMware |
| --- | --- | --- |
| 14 × R660 (1U) | ✅ (14U) | — |
| 2 × R760 (2U) | — | ✅ (4U) |
| 1 × Unity 380F (2U) | ✅ | — |
| 2 × Connectrix DS-6610B (1U) | ✅ (2U) | — |
| 2 × S5224F ToR (1U) | ✅ (1U) | ✅ (1U) — one each rack |
| 1 × N3248 Mgmt (1U) | ✅ | — |
| **Used** | **20U / 42U** | **5U / 42U** |

Pros: maps to how the proposal describes the solution. Cons: very uneven fill.

### Option 2 — balanced by RU
| | Rack 01 | Rack 02 |
| --- | --- | --- |
| 14 × R660 split 7/7 | 7 × R660 (7U) | 7 × R660 (7U) |
| 2 × R760 | — | 2 × R760 (4U) |
| 1 × Unity 380F | ✅ (2U) | — |
| 2 × Connectrix DS-6610B | ✅ (2U) | — |
| 2 × S5224F ToR | ✅ (1U) | ✅ (1U) |
| 1 × N3248 Mgmt | ✅ (1U) | — |
| **Used** | **13U / 42U** | **12U / 42U** |

Pros: looks symmetric on the canvas. Cons: splits the Hyper-V cluster across racks (less faithful).

### Option 3 — by function (compute vs infra)
| | Rack 01 — Compute | Rack 02 — Storage + Network |
| --- | --- | --- |
| 14 × R660 | ✅ (14U) | — |
| 2 × R760 | ✅ (4U) | — |
| 1 × Unity 380F | — | ✅ (2U) |
| 2 × Connectrix DS-6610B | — | ✅ (2U) |
| 2 × S5224F ToR | — | ✅ (2U) |
| 1 × N3248 Mgmt | — | ✅ (1U) |
| **Used** | **18U / 42U** | **7U / 42U** |

Pros: cleanest visually (rack 01 = all servers, rack 02 = all network/storage). Cons: also uneven; doesn't reflect the cluster topology.

**My recommendation: Option 1**, because the proposal explicitly groups everything around two clusters (Hyper-V + shared, VMware). The visual asymmetry is realistic.

yes lets do in 2 seperated raks but also we will add to empaty racks in reight and left sides for symetric

---

## 6. Gap analysis vs. the mockup's 8 categories

The mockup's right-side Catalog (`010_UI_Components_02.jpg`) assumes 8 fixed categories. Real BoQ data fits only **partially**:

| Mockup category | Present in BoQ? | Notes |
| --- | --- | --- |
| CPU | ✅ | matches |
| Memory | ✅ | matches |
| M.2 Drive | ❌ | none in this proposal |
| Hard Drive / SSD | ✅ | the 480GB SSDs + Unity 3.84TB SSDs |
| GPU | ❌ | R660/R760 in this config have no GPUs |
| Network Card | ✅ | Broadcom 57414 + 5720 (2 NICs per server) |
| Power | ✅ | matches |
| Cooling System | ❌ | not in BoQ (built into chassis) |

Extras in BoQ that aren't in the mockup:
- **HBA (Fibre Channel)** — Emulex LPe35002 on every server.
- **RAID Controller** — PERC H355 / H755.
- **Management** — iDRAC9.
- **Port License Kit** — Connectrix POD upgrades.
- **I/O Module** — Unity CNA card.

from screenshots we should see the structure but all data we should take from proposal

### Recommendation
Use a **flexible component model** — each chassis carries a `components: Component[]` array where each component has a free-form `category` string, not a fixed enum. The Catalog UI groups them dynamically. This keeps the data honest while letting the UI still render the mockup's 8 sections when GPUs/M.2 are absent (those sections simply don't appear, or appear as "Not configured").

---

## 7. Proposed data tree (shape only — no code yet)

```
Project ("Avaya POD Cluster – IPO200")
├─ racks: Rack[2]
│  ├─ Rack 01 (height 42U, brand "dell")
│  │  └─ units: RackUnit[]
│  │     ├─ ServerUnit (positionU: 1, sizeU: 1, chassis: R660 #1)
│  │     │  └─ components: Component[]   ← the 10 BoQ rows above
│  │     ├─ ServerUnit (R660 #2)
│  │     ├─ ... (R660 #14)
│  │     ├─ StorageUnit (positionU: 15, sizeU: 2, chassis: Unity 380F)
│  │     │  └─ components: Component[]   ← chassis + 14 SSDs + 1 CNA
│  │     ├─ SwitchUnit (DS-6610B #1)
│  │     ├─ SwitchUnit (DS-6610B #2)
│  │     ├─ SwitchUnit (S5224F #1)
│  │     └─ SwitchUnit (N3248)
│  └─ Rack 02 (height 42U, brand "dell")
│     └─ units: RackUnit[]
│        ├─ ServerUnit (R760 #1, sizeU: 2)
│        ├─ ServerUnit (R760 #2, sizeU: 2)
│        └─ SwitchUnit (S5224F #2)
```

Each `RackUnit` shares a base:
```
{ id, kind: "server" | "storage" | "switch" | "pdu",
  positionU, sizeU,                  ← physical placement in the rack
  chassis: { name, sku, image, description, watts?, btu? },
  components: Component[],           ← BoQ rows for this unit
  priceUSD?: number }                ← if we have it; placeholder otherwise
```

Each `Component`:
```
{ id, category: string, name, qty, specs: Record<string, string>,
  catalogAlternatives?: CatalogOption[] }   ← for the right-side Catalog swap
```

---

## 8. Open decisions from round 1 — status

1. **Rack split** — ✅ **Option 1 (by cluster)**, with 2 extra **empty** racks framing the filled ones (left + right) for symmetry. Final canvas layout: `[empty] [Rack 01] [Rack 02] [empty]`.
2. **Transceivers** — ✅ **excluded**.
3. **PDUs** — ✅ **skipped** (no SKU detail, dropped).
4. **Component model** — ✅ resolved by §13 below (filtered intersection of assets and proposal).
5. **Pricing** — ✅ resolved: no per-item or per-rack prices, just one Grand Total.
6. **U positions** — ✅ proposed layout in §8.1 below.
7. **Project name** — ✅ `Avaya POD Cluster – IPO200`.
8. **Other 2 demo projects** — ✅ resolved: scope dropped to 1 project.

### 8.1. Proposed U-layout (top-down from U42)

Datacentre convention: switches at top, compute middle, heavy storage low. Both racks use this pattern.

**Rack 01 — Hyper-v + Shared (20U used / 42U total)**

| U range | Unit | Subsystem |
| --- | --- | --- |
| U42 | Dell EMC N3248TE-ON | Management Switch |
| U41 | Dell EMC S5224F-ON #1 | ToR Switches |
| U40 | Connectrix DS-6610B #1 | SAN Switches |
| U39 | Connectrix DS-6610B #2 | SAN Switches |
| U38–U25 | 14 × Dell PowerEdge R660 | Hyper-v cluster |
| U24–U23 | Dell EMC Unity 380F (2U) | SAN Storage |
| U22–U01 | *empty* | — |

**Rack 02 — VMware (5U used / 42U total)**

| U range | Unit | Subsystem |
| --- | --- | --- |
| U42 | Dell EMC S5224F-ON #2 | ToR Switches |
| U41–U40 | Dell PowerEdge R760 #1 | VMware cluster |
| U39–U38 | Dell PowerEdge R760 #2 | VMware cluster |
| U37–U01 | *empty* | — |

---

## 9. What happens after these are answered

1. I draft `types.ts` (the `Project / Subsystem / Rack / RackUnit / Chassis / Component / CatalogEntry` interfaces).
2. I draft `fake-data.ts` (the Avaya project fully populated).
3. You review both. We tweak.
4. We pick **one** screen from `USER-FLOW.md` and start the demo.

Nothing in `app/` gets touched until steps 1–2 above are signed off.

---

## 10. Insights from the new screenshots (May 12)

Four annotated screenshots were attached. Below is what each one tells us about the data tree and the UI behaviour. I cross-reference them with the originals.

### Screenshot 1 — multi-rack overview (annotated `010_UI_1.jpg`)
- Left sidebar bottom shows a **subsystem tree** with these six items, in this order:
  1. Hyper-v cluster
  2. VMware cluster
  3. SAN Storage
  4. Management Switch
  5. ToR Switches
  6. SAN Switches
  These map 1:1 onto the six BoQ groups from §2 — confirming the proposal's natural grouping is the navigation grouping.
- Per-rack price lines in the left sidebar are **crossed out**. Only `Grand Total` and `Preview Proposal` remain.
- The right Catalog panel shows a **different kind of catalog from the mockup**: it lists *subsystem categories* (Compute Server, Server Storage, Server GPU, Management Node Server, …) each with a status badge: **In proposal · Removed · Not in proposal**.

### Screenshot 2 — single rack detail (annotated `010_UI_Server_HP.jpg`)
- The Catalog content stays the same as Screen A (subsystem-category list with statuses).
- A red **X with a connector line** is drawn from one server row out to the right.
  → unclear what it means. See Q-S2 below.
- Left sidebar list unchanged.

### Screenshot 3 — cluster component view (annotated `010_UI_Components_02.jpg`)
- Title bar reads **`14 x Dell R660 Hyper-v Cluster`** instead of a single chassis name.
  → Component view is **per-subsystem (cluster)**, not per-server. Since all 14 R660s are identical, we show one canonical spec and label it `14 x`.
- The components list keeps the mockup's 8 categories visually but the **values** shown are still mockup placeholders, not Avaya BoQ values — see Q-S3.
- Right Catalog now shows **alternative chassis products** (XE8640, XE9640, XE7740/XE7745), each with a status badge **In proposal · Not in proposal**.

### Screenshot 4 — cluster component view, GPU context (annotated `010_UI_Components_03.jpg`)
- The **DELL brand pill** at the top-right has a red strikethrough → **remove the brand selector entirely**.
- Right Catalog shows **GPU alternatives** (NVIDIA H100, L40S, A100).
- A `Analyzing your requirements…` loading bar appears at the bottom of the components list. This is a transient state when switching contexts.

### What this means for the data tree

- A `Project` has many `Subsystems`. A `Subsystem` is the unit of navigation. Examples for Avaya:
  `hyper-v-cluster`, `vmware-cluster`, `san-storage`, `mgmt-switch`, `tor-switches`, `san-switches`.
- A `Subsystem` has **one canonical chassis spec** (since all units inside it are identical) plus a **quantity** (e.g. `14 x`).
- A `Subsystem` is **placed inside one or more racks**. The mapping `Subsystem → Rack(s)` is what drives both screens A and B.
- A `Catalog` is a **separate top-level list**, with **two layers**:
  1. *Subsystem-category catalog* (Screen A/B): high-level data-center subsystems with status. Drives the right panel before the user enters a specific cluster.
  2. *Product-alternatives catalog* (Screen C): alternative chassis / alternative GPUs / alternative components, scoped to whichever component slot the user is looking at.
- Every catalog entry carries a `status: "in-proposal" | "removed" | "not-in-proposal"`.

This is **different** from what `PLAN.md` originally sketched — catalog isn't just a list of swappable parts, it's two related lists with status semantics. The data tree needs to reflect both.

from old screenshots we dont need to take any data. we take it from proposal.

---

## 11. New questions from the screenshots

Please answer in line — short is fine.

### Q-S1. The new user flow
The previous flow (`USER-FLOW.md`) was dashboard → 3 fake projects → project tabs. With only one project, what's the new entry path?
- (a) Skip the dashboard entirely; the app opens directly on the Avaya project page.
- (b) Dashboard exists but has only one card (the Avaya project).
- (c) Something else?

answere - (a) we would open directly the Avaya project page Design tab

### Q-S2. The red X with a connector line on Screen B
What does it indicate?
- (a) A "remove this server" action visible on hover.
- (b) Just an annotation by you to highlight where the click target is.
- (c) Something else.

### Q-S3. Mockup specs vs. real Avaya specs
The screenshots still show mockup text like `Intel Xeon Platinum 8352Y` and `64 GB DDR4 SDRAM`. The Avaya proposal uses different parts (`Intel Xeon Gold 6548Y+`, `32GB RDIMM DDR5-5600`). In `fake-data.ts` I will:
- (a) Use the **real Avaya BoQ specs** verbatim (recommended — keeps the demo credible).
- (b) Keep the **mockup placeholders** and ignore the Avaya parts.
- (c) Use Avaya for R660/R760 and mockup placeholders for everything else.

answere - (a)

### Q-S4. The 8 mockup categories vs. real Avaya components
✅ **Resolved by your rule "include only components we have as an asset AND in the proposal".** See §13 below — final list is **5 categories**: CPU, Memory, Hard Drive / SSD, Network Card, Power.

### Q-S5. Subsystem catalog (right panel, Screen A/B)
The visible categories are `Compute Server`, `Server Storage`, `Server GPU`, `Management Node Server`. Is the full list:
- (a) Compute Server, Server Storage, Server GPU, Management Node Server, Network Switch — just these 5?
- (b) Some other list — please name them?

answere - we will add. afake options too for now we could use anything to get the view

Also: for the demo, do you supply the descriptive paragraphs ("The Compute Server subsystem is the part of a data center …") or do I write short placeholders? keep how it is

### Q-S6. Product-alternatives catalog (right panel, Screen C)
✅ implied by Q-S5: **(a) hardcoded fake alternatives** inside `fake-data.ts`, just enough to make the view look populated. Same status badges (`In proposal · Removed · Not in proposal`).

### Q-S7. Subsystem ↔ rack mapping
Given **only 2 racks** and the 6 subsystems, confirm placement. My proposal:
- **Rack 01** — `hyper-v-cluster` (14 R660), `san-storage` (Unity 380F), `san-switches` (2 DS-6610B), `mgmt-switch` (N3248), `tor-switches` (one of two S5224F).
- **Rack 02** — `vmware-cluster` (2 R760), `tor-switches` (second S5224F).
Confirm or revise. (A subsystem can span two racks — that's fine in the model.)

### Q-S8. The `Standalone` column on Screen A
Mockup shows a 5th "Standalone" column next to the racks. With 2 racks, do we:
- (a) Drop it entirely.
- (b) Keep it as an empty placeholder column.
- (c) Repurpose it for something specific.

### Q-S9. Quantity rendering on the component view
Title is `14 x Dell R660 Hyper-v Cluster`. The component counts shown (e.g. `10 x Memory`) — are they:
- (a) **Per single server** (one R660 has 10 DIMMs in the mockup data),
- (b) **Per cluster** (10 across all 14),
- (c) Just visual mockup numbers, not meaningful.
The Avaya R660 has 4 DIMMs per server (= 56 across cluster). Whichever convention we pick I need to know to label them consistently.

### Q-S10. Brand selector — confirm fully removed?
Screenshot 4 shows the `DELL` pill struck through. Confirm we delete the brand selector everywhere (Screen A, B and C) and stick to a single visual theme.

answere - keep removed

### Q-S11. "Analyzing your requirements…" loader
- (a) Show on every navigation between subsystems (decorative, ~500 ms).
- (b) Show only on first entry into a cluster view.
- (c) Skip for the demo.

answere - lets skip any loading state and ui for the demo 

---

## 12. Asset inventory (from `/Verstka/`)

Source: `/Users/argenmartirosyan/Desktop/RFQ/Verstka/`. All assets at high-res, mix of PNG + SVG. Grouped by role.

### 12.1. Server chassis art — for rack visualization (Screen B)
Four stylized Dell servers, each appears to depict a different server / form factor:

| Asset | Suggested use |
| --- | --- |
| `Server_Dell_01.png` | TBD — see Q-A1 |
| `Server_Dell_02.png` | TBD — see Q-A1 |
| `Server_Dell_03.png` | TBD — see Q-A1 |
| `Server_Dell_04.png` | TBD — see Q-A1 |

`Server_BG.png` — background plate behind each server unit.

### 12.2. Component icons — for Screen C parts list
Eight component icons, one per mockup category:

| Asset | Category |
| --- | --- |
| `Component_CPU.png` | CPU |
| `Component_RAM.png` | Memory |
| `Component_M2.png` | M.2 Drive |
| `Component_HDD.png` | Hard Drive / SSD |
| `Component_GPU.png` | GPU |
| `Component_Network.png` | Network Card |
| `Component_Power.png` | Power |
| `Component_Cooling.png` | Cooling System |

`Component_Platform_BG.svg` — backplate behind each component row.
`Component_BG.svg` — generic component card background.

### 12.3. UI chrome
| Asset | Use |
| --- | --- |
| `Logo.svg`, `Logo_text.svg`, `Ico_Magic.svg` | Magic branding (header) |
| `Avatar.png`, `Avatar_BG.svg`, `Avatar_drop_down_arrow.svg` | User avatar in top-right |
| `Breadcrumb_BG.svg` | Breadcrumb bar background |
| `Nav_bar_BG.svg`, `Nav_bar_Bt_long_*.svg`, `Nav_bar_Bt_short_*.svg` | Top tabs (Design / Questions / Price) |
| `Bt_+.svg` | The `+` button in the carousel |
| `Bt_Prev_Proposal_BG.svg` | "Preview Proposal" button |
| `Bt_Share_BG.svg` | "Share" button |
| `Server_select_BG.svg`, `Server_select_Arrow_left/right.svg`, `Server_select_Item_normal/selected.svg` | Top-of-canvas server carousel |
| `Gray_BG.svg` | Neutral background fill |

**No** rack frame asset is in the folder yet. You mentioned you'll provide a 42U rack image — that's the missing piece (see Q-A2). - Server_BG.png heree the 42u rack image.

---

## 13. Final component filter — Assets ∩ Proposal

Applying your rule (`include only components for which we have an asset AND that exist in the proposal`):

| Component | Asset? | In proposal? | Decision |
| --- | --- | --- | --- |
| CPU | ✅ | ✅ R660 + R760 | **include** |
| Memory | ✅ | ✅ R660 + R760 | **include** |
| Hard Drive / SSD | ✅ | ✅ R660 + R760 + Unity SSDs | **include** |
| Network Card | ✅ | ✅ Broadcom 57414 + 5720 | **include** |
| Power | ✅ | ✅ Dual 800W PSU | **include** |
| M.2 Drive | ✅ | ❌ none in BoQ | **skip** |
| GPU | ✅ | ❌ none in BoQ | **skip** |
| Cooling System | ✅ | ❌ not a BoQ line | **skip** |
| HBA (Fibre Channel) | ❌ | ✅ Emulex LPe35002 | **skip** |
| RAID Controller | ❌ | ✅ PERC H355 / H755 | **skip** |
| Management (iDRAC) | ❌ | ✅ iDRAC9 | **skip** |
| Port License Kit | ❌ | ✅ DS-6610B POD | **skip** |
| I/O Module | ❌ | ✅ Unity CNA card | **skip** |

**Final categories visible on Screen C: 5** → CPU · Memory · Hard Drive / SSD · Network Card · Power.

### 13.1. What each subsystem shows on Screen C

| Subsystem | Title on Screen C | Component rows shown |
| --- | --- | --- |
| Hyper-v cluster | `14 x Dell PowerEdge R660 — Hyper-v Cluster` | CPU × 2, Memory × 4, Hard Drive / SSD × 2, Network Card × 2, Power × 2 |
| VMware cluster | `2 x Dell PowerEdge R760 — VMware Cluster` | CPU × 2, Memory × 8, Hard Drive / SSD × 2, Network Card × 2, Power × 2 |
| SAN Storage | `1 x Dell EMC Unity 380F — SAN Storage` | Hard Drive / SSD × 14 (the 3.84 TB flash drives) |
| Management Switch | `1 x Dell EMC N3248TE-ON — Management Switch` | — see Q-A3 (no components after filter) |
| ToR Switches | `2 x Dell EMC S5224F-ON — ToR Switches` | — see Q-A3 |
| SAN Switches | `2 x Connectrix DS-6610B — SAN Switches` | — see Q-A3 |

Quantities above are **per single chassis** (Q-S9 still open — see §11), labelled with `× N` so the user reads them as "each R660 has 2 CPUs, 4 memory sticks, …".

---

## 14. New questions from asset + filter analysis

### Q-A1. Server image → chassis mapping
We have **4 stylized server images** (`Server_Dell_01..04.png`) but **6 chassis types** in the proposal. Two options:
- (a) You tell me which image is which form factor (1U / 2U / storage / switch) so I can map them faithfully — best for realism.
- (b) I auto-map by form-factor heuristic: `01 → 1U server (R660)`, `02 → 2U server (R760)`, `03 → 2U storage (Unity 380F)`, `04 → 1U switch (all switches share this image)`.

### Q-A2. Rack frame asset
✅ Resolved — `Server_BG.png` in `/Verstka/` **is the 42U rack frame**. We use it for both filled and empty racks.

### Q-A3. Switches on Screen C
After the filter, the 3 switch subsystems (Mgmt / ToR / SAN) have **zero internal components** to show. Three options:
- (a) **Hide them from the left-sidebar subsystem nav** — they appear only as units in the rack but you can't open a component view for them.
- (b) **Show a chassis-only card** — Screen C displays the chassis image, title and a short spec sentence, no component rows.
- (c) Add a single placeholder "Chassis" row so the layout doesn't look broken.

### Q-A4. Empty rack rendering
For the two flanking empty racks: just render the rack frame, no servers inside, no rack label. Correct?

### Q-A5. Asset copy plan
When we start UI work, I'll copy the Verstka assets into `app/assets/hardware/verstka/` (PNGs) and `app/components/hardware/icons/` (SVGs imported as React components via `vite-plugin-svgr`). OK?

### Q-A6. Subsystem ordering in the left sidebar
Your screenshot shows this order: Hyper-v cluster → VMware cluster → SAN Storage → Management Switch → ToR Switches → SAN Switches. Keep this order verbatim?
