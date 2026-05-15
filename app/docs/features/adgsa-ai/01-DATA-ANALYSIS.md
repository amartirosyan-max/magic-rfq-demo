# ADGSA-AI Project — Data Analysis & Demo Plan

> **Source documents**
> - `Abu Dhabi Govt Tender - BoQ.docx` (Word — full BoQ chapters 1–9, 14 tables)
> - `ADGSA-AI-2026-004_BoQ.xlsx` (Excel — Overview + 8 detail sheets, ~211 rows)
> - `IMAGE 2026-05-15 16:37:31.jpg` (rack layout reference: **5 racks** — 4 AI Server Racks + 1 Infrastructure Rack)

This document captures everything we need to spin up a second hardware-configurator
project at **`/adgsa-ai`** (working name — confirm with PM) reusing the existing
Avaya demo machinery.

---

## 1. Project identity

| Field | Value |
|---|---|
| Customer | **Abu Dhabi Government Services Authority (ADGSA)** |
| RFP reference | **ADGSA-AI-2026-004** |
| Project name (display) | **AI-Powered Citizen Services Transformation** |
| Short name (in proposal) | *to confirm* — proposed **"ADGSA AI Cluster"** or **"ADGSA-AI POD"** |
| Issued | May 2026 |
| Deadline | 15 June 2026 |
| Budget envelope | USD **$10M – $25M** |
| Baseline BoQ total | **~$7.98M** (excl. VAT / contingency) |
| Headroom (AI dev + integration + contingency) | ~$2M – $17M |
| Lead-time gate | H200 GPUs: **14–20 weeks** from PO confirmation |
| 18-month go-live target | Order H200s immediately |

**Suggested route**: `/adgsa-ai`
(parallels the existing `/avaya` route; see `app/routes/avaya/index.tsx`)

---

## 2. Cluster shape at a glance

A **distributed AI compute cluster** — fundamentally different shape from the
Avaya telephony POD. Heavy GPU compute, dedicated storage cluster, multi-tier
networking, all built into 5 physical racks.

| Tier | Hardware | Qty | Role |
|---|---|---|---|
| **AI GPU compute** | Dell PowerEdge **XE9680** (6U) | **16** | 8× H200 SXM5 GPUs each → 128 GPUs, ~$5.86M |
| **Management / orchestration** | Dell PowerEdge **R660** (1U) | **3** | Kubernetes HA control plane, NVAIE, monitoring |
| **NAS storage** | Dell PowerScale **F710** (1U) | **7** | All-flash NVMe NAS, OneFS, 268.8 TB raw / ~537 TB+ effective |
| **GPU spine fabric** | NVIDIA **Spectrum-4 SN5600** (2U) | **3** | 800 GbE OSFP, RoCEv2 RDMA, GPU cluster backbone |
| **Storage fabric** | Dell **PowerSwitch S5232F-ON** (1U) | **2** | 100 GbE SFP28, storage cluster interconnect |
| **OOB management** | NVIDIA **SN2201** (1U) | **2** | 1 GbE OOB iDRAC/BMC |
| **Cluster DPU** | NVIDIA **BlueField-3 BF3220** | **1** | SDN control plane, zero-trust, storage offload |
| **Node DPU** | NVIDIA **BlueField-3 BF3140H** | **8** | Per-node data-plane offload (8 of 16 XE9680s) |

Total **128× NVIDIA H200 SXM5 141 GB HBM3e** → **18,048 GB cluster GPU memory**, **~253 K TOPS INT8**.

---

## 3. Rack layout — CONFIRMED 5-rack proposal layout

**Decision**: follow the proposal image (4 AI racks + 1 Infrastructure centre).
The BoQ §6.4 engineering layout (3 GPU + 1 storage + 1 mgmt) is set aside for
this demo.

```
┌─────────────┬─────────────┬─────────────────┬─────────────┬─────────────┐
│  AI Rack 1  │  AI Rack 2  │ Infrastructure  │  AI Rack 4  │  AI Rack 5  │
│             │             │     Rack 3      │             │             │
├─────────────┼─────────────┼─────────────────┼─────────────┼─────────────┤
│             │             │   2× SN2201     │             │             │
│             │             │     (2 U)       │             │             │
│             │             │                 │             │             │
│             │             │   3× R660       │             │             │
│ 4× XE9680   │ 4× XE9680   │     (3 U)       │ 4× XE9680   │ 4× XE9680   │
│  (24 U)     │  (24 U)     │                 │  (24 U)     │  (24 U)     │
│             │             │   3× SN5600     │             │             │
│             │             │     (6 U)       │             │             │
│             │             │                 │             │             │
│             │             │   2× S5232F-ON  │             │             │
│             │             │     (2 U)       │             │             │
│             │             │                 │             │             │
│             │             │   7× F710       │             │             │
│             │             │     (7 U)       │             │             │
└─────────────┴─────────────┴─────────────────┴─────────────┴─────────────┘
   24 / 42 U     24 / 42 U      20 / 42 U        24 / 42 U     24 / 42 U
```

**Per-rack totals** (chassis count × sizeU):

| Rack | Chassis | U used | Total |
|---|---|---:|---:|
| Rack 1 (AI) | 4× XE9680 | 4×6 | 24 U |
| Rack 2 (AI) | 4× XE9680 | 4×6 | 24 U |
| Rack 3 (Infra) | 2× SN2201 + 3× R660 + 3× SN5600 + 2× S5232F-ON + 7× F710 | 2 + 3 + 6 + 2 + 7 | 20 U |
| Rack 4 (AI) | 4× XE9680 | 4×6 | 24 U |
| Rack 5 (AI) | 4× XE9680 | 4×6 | 24 U |
| **Totals** | **16× XE9680, 7× F710, 3× R660, 2× S5232F-ON, 2× SN2201, 3× SN5600** | | |

Counts match BoQ ✓ (16 XE9680, 7 F710, 3 R660, 2 S5232F-ON, 2 SN2201, 3 SN5600).

### Rack 3 (Infrastructure) — U layout (top → bottom, ~screenshot positions)

| U range | Chassis | Subsystem |
|---:|---|---|
| 37–38 | SN2201 ×2 (stacked, 1 U each) | ToR Switches |
| 33–35 | R660 ×3 (stacked, 1 U each) | Management Nodes |
| 24–29 | SN5600 ×3 (stacked, 2 U each) | AI Fabric Switches |
| 21–22 | S5232F-ON ×2 (stacked, 1 U each) | Storage Switches |
| 9–15 | F710 ×7 (stacked, 1 U each) | NAS Storage |

(These are starting positions; final tuning will follow the screenshot pixel-for-pixel.)

### AI racks 1/2/4/5 — U layout

4× XE9680 (6 U each) stacked tightly with the bottom unit at **U8** so the
column doesn't sit on the rack floor. Top of stack at **U31**. Same layout in
all four AI racks for visual rhythm.

| U range | Chassis |
|---:|---|
| 26–31 | XE9680 #4 |
| 20–25 | XE9680 #3 |
| 14–19 | XE9680 #2 |
| 8–13 | XE9680 #1 |

---

## 4. Per-node specs

### 4.1 XE9680 GPU node (Chapter 2)

| Component | Spec | Qty/node | $/unit | $/node |
|---|---|---|---|---|
| Chassis | Dell PowerEdge XE9680 (6U) | 1 | bundled | bundled |
| CPU | Intel Xeon Platinum 8562Y+ 32C/64T, 300 W | 2 | $5,945 | $11,890 |
| RAM | 128 GB RDIMM DDR5-5600 | 16 | $550 | $8,800 |
| GPU tray | NVIDIA HGX H200 SXM5 ×8 (141 GB HBM3e each) | 1 | bundled (~$280 K) | bundled |
| Boot | BOSS-N1 2× 480 GB M.2 NVMe RAID 1 | 1 | $320 | $320 |
| Data NVMe | 1.6 TB NVMe Gen4 U.2 mixed-use | 8 | $700 | $5,600 |
| NIC | NVIDIA ConnectX-7 dual 400 GbE | 2 | $2,500 | $5,000 |
| DPU | NVIDIA BlueField-3 BF3140H 400 GbE | 1 (8 of 16 nodes) | $3,200 | $3,200* |
| PSU | 2800 W Titanium hot-plug | 3 | $680 | $2,040 |
| Rails | ReadyRails 6U sliding + CMA | 1 | $140 | $140 |
| iDRAC | iDRAC10 Datacenter (perpetual) | 1 | $599 | $599 |
| Intra-rack DAC | 400 GbE OSFP DAC 2 m | 4 | $180 | $720 |
| Cross-rack AOC | 400 GbE OSFP AOC 5 m | 2 | $320 | $640 |
| **Node configured price** | | | | **~$365,999** |
| **Cluster (×16)** | | | | **~$5,855,984** |

> *BF3140H only installed in 8 of 16 nodes per RFP.

**Headline node specs (display on Screen C):**
- 6U · 8× H200 SXM5 141 GB HBM3e · NVLink 4.0
- 64 cores / 128 threads (2× Xeon Platinum 8562Y+)
- 2 TB DDR5-5600
- 12.8 TB local NVMe
- 4× 400 GbE RDMA + BlueField-3 DPU offload
- 3× 2800 W Titanium PSU, ~8.4 kW typical full GPU load

### 4.2 R660 management node (Chapter 3)

| Component | Spec | Qty/node | $/unit | $/node |
|---|---|---|---|---|
| Chassis | Dell PowerEdge R660 (1U) | 1 | bundled | bundled |
| CPU | Intel Xeon Gold 6526Y 16C/32T | 2 | $1,517 | $3,034 |
| RAM | 32 GB RDIMM DDR5-5600 | 16 | $120 | $1,920 |
| Boot | BOSS-N1 2× 480 GB M.2 | 1 | $320 | $320 |
| Data NVMe | 3.84 TB NVMe Gen4 U.2 read-intensive | 4 | $950 | $3,800 |
| NIC | Mellanox ConnectX-6 Dx dual 100 GbE | 1 | $850 | $850 |
| PSU | 1400 W Titanium hot-plug | 2 | $310 | $620 |
| Rails | ReadyRails 1U sliding | 1 | $95 | $95 |
| iDRAC | iDRAC10 Datacenter | 1 | $599 | $599 |
| **Node price** | | | | **~$12,500** |
| **Cluster (×3)** | | | | **~$37,500** |

**Display headline:**
- 1U · 2-socket · 32 cores / 64 threads · 512 GB DDR5
- 15.36 TB NVMe local · 2× 100 GbE RDMA
- Role: Kubernetes HA control plane, Rancher/OpenShift, Prometheus/Grafana, MLflow, ArgoCD

### 4.3 PowerScale F710 NAS node (Chapter 5)

| Component | Spec | Qty/node | $ |
|---|---|---|---|
| Chassis | Dell PowerScale F710 (1U; R660-based) | 1 | bundled |
| CPU | Dual Intel Xeon 24C 2.6 GHz (OEM factory) | 2 | bundled |
| RAM | 512 GB DDR5 | 1 set | bundled |
| NVMe | 3.84 TB NVMe TLC × 10 (~38.4 TB raw/node) | 10 | bundled |
| NIC | Dual-port 100 GbE SFP28 | 1 | bundled |
| PSU | 1400 W Titanium | 2 | $310 ea |
| OS | PowerScale OneFS (NFS/SMB/S3/HDFS) | 1 | bundled |
| **Per-node** | | | **~$85,000** |
| **Cluster (×7)** | | | **~$595,000** |

**Capacity reference:**
- Raw: 7 × 38.4 TB = **268.8 TB**
- @ 2:1 dedup/compress: **~537 TB usable**
- @ 4:1 (typical AI): **~1.07 PB usable**
- Aggregate read: **>50 GB/s**
- FEC N+2: tolerates 2 drive or node failures
- Scale-out: up to 252 nodes / 307 PB max

---

## 5. Network fabric (Chapter 4)

| Switch / DPU | Part | Qty | $/u | Total |
|---|---|---|---|---|
| NVIDIA Spectrum-4 SN5600 (2U, 64× OSFP 800 GbE) | 920-9N42F-00RI-KC0 | 3 | $62,000 | $186,000 |
| Dell PowerSwitch S5232F-ON (1U, 32× SFP28 100 GbE) | 210-AQKM | 2 | $18,500 | $37,000 |
| NVIDIA SN2201 (1U, 48× 1 GbE + 4× 10 GbE) | 920-9N33A-00RV | 2 | $4,200 | $8,400 |
| NVIDIA BlueField-3 BF3220 DPU (cluster) | 900-9D3B6-00CV-AA0 | 1 | $6,800 | $6,800 |
| NVIDIA BlueField-3 BF3140H DPU (per-node) | 900-9D3B6-00CV-BB0 | 8 | $3,200 | $25,600 |
| 400 GbE OSFP DAC 2 m (intra-rack) | MCP1650-H002E30 | 64 | $180 | $11,520 |
| 400 GbE OSFP AOC 5 m (cross-rack) | MFS1S00-H005E | 32 | $320 | $10,240 |
| 100 GbE SFP28 DAC 1 m (storage) | MCP2M00-A001 | 14 | $65 | $910 |
| 10 GbE SFP+ DAC 1 m (mgmt) | MC3309130-001 | 24 | $22 | $528 |
| Cat6A 1 GbE 2 m (iDRAC/OOB) | — | 40 | $8 | $320 |
| **Network total** | | | | **$287,318** |

---

## 6. Physical infrastructure (Chapter 6)

| Item | Qty | $/u | Total |
|---|---|---|---|
| APC 750×1200 42U Smart Rack (A6921473) | 5 | $4,800 | $24,000 |
| APC Rack PDU 3-phase metered (AC021024) | 18 | $1,200 | $21,600 |
| PDU power whip 3-phase 10 m | 10 | $350 | $3,500 |
| 400 GbE OSFP DAC 2 m | 64 | $180 | $11,520 |
| 400 GbE OSFP AOC 5 m | 32 | $320 | $10,240 |
| 100 GbE SFP28 DAC 1 m | 14 | $65 | $910 |
| 10 GbE SFP+ DAC 1 m | 24 | $22 | $528 |
| Cat6A 1 GbE patch 2 m | 40 | $8 | $320 |
| CMA 1U/2U | 22 | $65 | $1,430 |
| 1U blanking panels | 60 | $4 | $240 |
| Anti-static ground bonding kit | 5 | $85 | $425 |
| Rack mounting hardware kit | 5 | $120 | $600 |
| **Physical infra total** | | | **$75,313** |

Peak power: **~176 kW** · typical load: **130–150 kW** · GPU rack: **42–50 kW each**.

---

## 7. Software licenses (Year 1) — Chapter 7

| Product | Vendor | Qty | $/yr | Total Y1 |
|---|---|---|---|---|
| Ubuntu Server 24.04 LTS — Canonical Pro | Canonical | 19 | $750 | $14,250 |
| SUSE Rancher Prime (Kubernetes cluster) | SUSE | 1 | $48,000 | $48,000 |
| NVIDIA AI Enterprise (NVAIE) per GPU | NVIDIA | 128 | $4,500 | **$576,000** |
| NVIDIA BCMe | NVIDIA | — | incl. NVAIE | — |
| Cumulus Linux NOS (SN5600) | NVIDIA | 3 | $3,500 | $10,500 |
| Dell OpenManage Enterprise (OME) | Dell | 1 | $2,500 | $2,500 |
| PowerScale OneFS | Dell | 7 | incl. | — |
| **Year-1 total** | | | | **$651,250** |

3-year software cost ~$1.95 M.

**NVAIE stack** (1 line item, big surface): NeMo Microservices, NVIDIA NIMs, RAG
pipelines, Base Command Manager Enterprise (BCMe), Triton Inference Server,
TensorRT-LLM, RAPIDS.

---

## 8. Professional services (Chapter 8)

| Service | Vendor | Price |
|---|---|---|
| Dell ProDeploy Enterprise | Dell | $85,000 |
| Dell ProConsult | Dell | $35,000 |
| Dell ProSupport+ 3-Year 24×7 Mission-Critical | Dell | $320,000 |
| NVIDIA AI Platform Setup & Commissioning | NVIDIA | $45,000 |
| Hypercare 90 days post-go-live | Dell + NVIDIA | $28,000 |
| End-user & administrator training (8 days) | Dell + NVIDIA | $18,000 |
| **Services total** | | **$531,000** |

> The DOCX lists $503 K (no hypercare); XLSX lists $531 K (with hypercare 90 days,
> RFP-mandated). **Use XLSX figure** as the SoT.

---

## 9. Budget summary (XLSX Overview)

| Category | Baseline (USD) | % |
|---|---:|---:|
| AI GPU Servers (XE9680 ×16) | $5,855,984 | 73.4 % |
| Management Servers (R660 ×3) | $37,500 | 0.5 % |
| Network Fabric | $287,318 | 3.6 % |
| NAS Storage (F710 ×7) | $595,000 | 7.5 % |
| Physical Infrastructure | $75,313 | 0.9 % |
| Software Licenses (Year 1) | $651,250 | 8.2 % |
| Professional Services | $531,000 | 6.7 % |
| **GRAND TOTAL** | **$8,033,365** | 100 % |

(The DOCX gives $7,984,634 in Table 0 and $8,004,365 in Table 13; the XLSX
Overview gives $8,033,365. Discrepancy = hypercare item ± rounding.
**Demo grand total: `$8,033,365`** unless PM says otherwise.)

---

## 9b. Left-sidebar nav — 6 confirmed groups

| # | Nav label | Chassis behind it | Qty | Total U |
|---:|---|---|---:|---:|
| 1 | **AI GPU Cluster** | Dell PowerEdge **XE9680** (8× H200 each) | 16 | 96 U |
| 2 | **NAS Storage** | Dell PowerScale **F710** | 7 | 7 U |
| 3 | **Management Nodes** | Dell PowerEdge **R660** | 3 | 3 U |
| 4 | **Storage Switches** | Dell PowerSwitch **S5232F-ON** | 2 | 2 U |
| 5 | **ToR Switches** | NVIDIA **SN2201** | 2 | 2 U |
| 6 | **AI Fabric Switches** | NVIDIA Spectrum-4 **SN5600** | 3 | 6 U |

Click any group in the left sidebar → goes to Screen C for that chassis (same
mechanism as Avaya).

---

## 10. Mapping to the existing demo architecture — REALISED

The Avaya demo files were the template; the multi-project refactor of
2026-05-15 split shared structure (types, components, context, asset
map) from per-project data. Final mapping:

| Avaya concept (file) | ADGSA-AI equivalent | Notes |
|---|---|---|
| `app/features/hardware/fake-data.ts` → `hardwareProject` | `app/features/hardware/projects/avaya.ts` → `avayaProject` and `app/features/hardware/projects/adgsa-ai.ts` → `adgsaProject` | Both export a `HardwareProject`. `fake-data.ts` is now a thin re-export kept only for the documentation samples; can be deleted after PM review. |
| `Subsystem` (Hyper-v / VMware / SAN Storage / Mgmt / ToR / SAN switches) | **AI GPU Cluster** (XE9680), **NAS Storage** (F710), **Management Nodes** (R660), **Storage Switches** (S5232F-ON), **ToR Switches** (SN2201), **AI Fabric Switches** (SN5600) | Six confirmed groups, see §9b. DPU rows render under the existing `network` category until a dedicated DPU icon ships. |
| `Rack` (4 columns: 2 empty + Rack 01 + Rack 02 + empty) | 5 columns: **AI Server Rack 01**, **AI Server Rack 02**, **Infrastructure Rack 03** (centre), **AI Server Rack 04**, **AI Server Rack 05** | Rack column titles now come from `Rack.columnLabel` instead of a hardcoded `labelFor()` in `ScreenA`. |
| `RackUnit` (positionU, sizeU, subsystemId) | Same shape; 5 new chassis images registered in `app/features/hardware/chassis-assets.ts` | XE9680 (6U), F710 (1U), R660 (1U, shared with Avaya), SN5600 (2U), S5232F-ON (1U), SN2201 (1U). |
| `CatalogPanel` data via `catalog-data.ts#platformCatalog` | Falls back to `project.productAlternatives[subsystemId]` defined inside each project file when the global catalog has no matching entry | Avaya keeps the curated `platformCatalog` rows; ADGSA-AI ships its own alternatives next to its subsystem definitions. |
| Project header card | Same component; data flows in via `HardwareProjectContext` | Card shows **ADGSA / ADGSA-AI POD / Lead score 9.8 / Grand Total $8,033,365 / Preview Proposal**. |
| `useActiveSubsystem` / Screen A → C navigation | Reused as-is | All eight call sites that imported `hardwareProject` now read from `useHardwareProject()`. |
| `ScreenC` chassis hero | Per-subsystem hero image + description card | New `gpu` `ComponentCategory` (Component_GPU.png) renders inside XE9680 nodes. |

### Routes

| Route | File | Project |
|---|---|---|
| `/avaya` | `app/routes/avaya/index.tsx` | `avayaProject` |
| `/adgsa-ai` | `app/routes/adgsa-ai/index.tsx` | `adgsaProject` |

Both pass `project={…}` to `<HardwareLayout>`, which wraps the tree in
`<HardwareProjectProvider>` so every descendent component can read its
project via `useHardwareProject()`.

---

## 11. Asset readiness — CONFIRMED (all 6 chassis present)

All product images already uploaded to `app/assets/hardware/products/`:

| File | Used for | Status |
|---|---|---|
| `PowerEdge-XE9680.png` | AI GPU Cluster (6 U) | ✅ present |
| `PowerScale-F710.png` | NAS Storage (1 U) | ✅ present |
| `Dell-PowerEdge-R660.png` | Management Nodes (1 U) | ✅ present (shared w/ Avaya) |
| `PowerSwitch-S5232.png` | Storage Switches (1 U) | ✅ present |
| `Nvidia-SN2201.png` | ToR Switches (1 U) | ✅ present |
| `NVIDIA Spectrum-4 SN5600.png` | AI Fabric Switches (2 U) | ✅ present |

> **Note on filenames** — two of the new images have spaces / mixed case
> (`Nvidia-SN2201.png`, `NVIDIA Spectrum-4 SN5600.png`). Vite imports them
> as-is in `chassis-assets.ts`. Optional dash-case cleanup
> (`NVIDIA-SN2201.png`, `NVIDIA-Spectrum-4-SN5600.png`) deferred — not
> blocking and the asset map is the only place that references the
> filenames.

Rack frame (`Server_BG.png`, 342×912, 42 U interior) — reused as-is.

---

## 12. Routing

| Route | File | Purpose |
|---|---|---|
| `/avaya` (existing) | `app/routes/avaya/index.tsx` | Avaya hardware demo |
| `/adgsa-ai` (new) | `app/routes/adgsa-ai/index.tsx` | ADGSA AI Cluster demo |

Both reuse `HardwareLayout` + `HardwareCanvas` + sidebars; only the **data source**
(`fake-data.ts` equivalent) and **chassis assets** differ.

Possible extension: make `HardwareCanvas` accept a `project` prop so we can have
multiple route entry points without duplicating the layout shell.

---

## 13. Open questions — RESOLVED (kept for reference)

| # | Question | Suggested answer |
|---:|---|---|
| 1 | **Project short name** — appears in the left sidebar header card and the canvas breadcrumb. | **"ADGSA-AI POD"** (parallels "Avaya POD Cluster – IPO200"); long name: *"AI-Powered Citizen Services Transformation"* |
| 2 | **Customer short label** (Avaya shows "Avaya") | **"ADGSA"** |
| 3 | **Lead score** (Avaya shows 9.6) | **9.8** — strong RFP fit, big headroom, 18-month gate, government scope |
| 4 | **GPU component category** — the XE9680 has 8× H200 SXM5 GPUs. Add a new `gpu` category to `ComponentCategory` so Screen C lists "GPU" as its own row (matches the existing `Component_GPU.png` asset)? | **Yes — add `gpu` category** (already have icon) |
| 5 | **Multi-NIC / DPU display** on Screen C — group the 2× CX-7 + 1× BF-3 into one "Network" row or list them separately? | Two rows: "Network Card" + "DPU" (use existing `network` category for both; differentiated by description) |
| 6 | **Right-sidebar catalog** — Screen A/B subsystem-category cards: same six categories as Avaya (Compute / Storage / GPU / Mgmt / Switch / Backup) with new "in proposal" mappings? | Yes — reuse same six categories; flip Server GPU to "in proposal", flip Management Node Server to "in proposal" |
| 7 | **Pricing on the project card** — show $8,033,365 grand total only, or also "Budget: $10M–$25M / Headroom: ~$2M–$17M"? | Grand total only on the card; budget/headroom can appear on the Preview Proposal page |
| 8 | **Route name** — `/adgsa-ai` vs `/adgsa` vs `/abu-dhabi-ai`? | **`/adgsa-ai`** |

All eight answered before implementation; values landed in
`projects/adgsa-ai.ts`.

---

## 14. Implementation plan — DONE (2026-05-15)

Delivered in the multi-project refactor; see commit history on the
`adgsa-ai-route` branch. Summary of what shipped:

1. **Types + icon wiring** — `gpu` added to `ComponentCategory`,
   `columnLabel?` added to `Rack`, `Component_GPU.png` wired into
   `ScreenC` (`CATEGORY_ICON_URLS` + Lucide fallback).
2. **Shared chassis asset map** — `app/features/hardware/chassis-assets.ts`
   replaces the per-component `SERVER_IMAGES` maps in `Rack.tsx` and
   `ScreenC.tsx`; one static import per chassis PNG.
3. **Per-project data files** — `projects/avaya.ts` (moved from
   `fake-data.ts`) and `projects/adgsa-ai.ts` (new, populated from this
   document). Each rack carries its own `columnLabel`; no hardcoded
   labels remain in `ScreenA`.
4. **`HardwareProjectContext`** — new context + `useHardwareProject()`
   hook replace eight direct `hardwareProject` imports
   (`HardwareLayout`, `Rack`, `ScreenA`, `TopChrome`, `CatalogPanel`,
   `useActiveSubsystem`, `useCatalogScope`, plus indirect via
   `adapter.ts`). The adapter functions now take a `project: HardwareProject`
   parameter so they remain plain functions safe to call inside
   `useMemo`.
5. **Routes + preload** — `/adgsa-ai` registered in `app/routes.ts`;
   both routes pass their project to `<HardwareLayout>`. The five
   ADGSA chassis images join the `critical` preload tier and
   `Component_GPU.png` joins the `deferred` tier in
   `app/features/hardware/preload-assets.ts`.
6. **Smoke check** — `npm run typecheck` + `npm run build` are green;
   manual carousel/rack alignment verified across N=4 (Avaya) and
   N=5 (ADGSA-AI) rack rows.

## 14b. How to add a 3rd project (quick recipe)

1. Drop new chassis PNGs into `app/assets/hardware/products/`.
2. Add static imports + entries for them to
   `app/features/hardware/chassis-assets.ts#CHASSIS_IMAGE_URLS` (key by
   the filename you'll reference from `Chassis.image`).
3. Create `app/features/hardware/projects/<my-project>.ts` exporting a
   `HardwareProject`. Use `projects/adgsa-ai.ts` as a template — set
   `id`, `name`, `clientName`, `description`, `industry`, `routePath`,
   `leadScore`, `grandTotalUSD`, plus `subsystems`, `racks`,
   `subsystemCategories` and `productAlternatives`.
4. Create `app/routes/<my-project>/index.tsx` mirroring
   `app/routes/adgsa-ai/index.tsx`; pass your project to
   `<HardwareLayout project={myProject}>`.
5. Add `route("<my-project>", "routes/<my-project>/index.tsx")` to
   `app/routes.ts`.
6. Register the chassis images in
   `app/features/hardware/preload-assets.ts#critical` so the first
   paint of the new route doesn't show empty rack frames; add any new
   component icons (e.g. a dedicated DPU icon) to `deferred`.

No component changes, no context plumbing, no asset map gymnastics —
just data files and a route entry.

---

## 15. Source of truth

When BoQ docs disagree:

| Conflict | Resolution |
|---|---|
| Grand total (DOCX $7.98 M vs XLSX $8.03 M) | **Use XLSX `$8,033,365`** |
| Services total (DOCX $503 K vs XLSX $531 K) | **Use XLSX $531 K** (includes hypercare) |
| Rack layout (3+1+1 BoQ vs 4+1 image) | **Use image** (4 AI + 1 Infra) per design intent |

---

## 16. Appendix — Raw text dumps

- `/tmp/boq_docx.txt` — full Word doc paragraph + table dump
- `/tmp/boq_xlsx.txt` — full XLSX dump (all 9 sheets, every row)

These live outside the repo; rerun the extraction scripts in `/tmp/extract_*.py`
to regenerate after source-doc updates.

---

**End of data analysis. Next step:** confirm answers to §13, then start data layer.
