# ADGSA-AI (IBM / Lenovo) Project — Data Analysis & Build Notes

> **Source document:** `IBM_BoQ_ADGSA-AI-2026-004_v4.xlsx` (this folder)
> — 7 sheets: Overview + AI GPU Nodes + Mgmt Nodes + Network Fabric +
> Scale-Out NAS + Rack & Infra + Product Options.

Same tender as the Dell `/adgsa-ai` project (**ADGSA-AI-2026-004**), re-bid
as an **IBM Corporation + Lenovo OEM hardware + NVIDIA networking**
solution. Built by cloning the ADGSA-AI machinery (see
`../adgsa-ai/01-DATA-ANALYSIS.md` §14b "how to add a 3rd project").

- **Route:** `/adgsa-ibm`
- **Data file:** `app/features/hardware/projects/adgsa-ibm.ts`
- **Route file:** `app/routes/adgsa-ibm/index.tsx`
- **Grand total:** **$5,455,600** (Sheet 0 "TOTAL SOLUTION LIST PRICE",
  hardware only, excl. software & services).

---

## 1. Subsystems → nav groups (6)

| # | Nav group | Chassis | Real U | Qty | Section | Subsystem id |
|---|---|---|---:|---:|---|---|
| 1 | AI GPU Cluster | Lenovo ThinkSystem SR675 V3 (IBM 9155-G04), 4× H200 NVL | 3U | 16 | A | `ai-gpu-cluster` |
| 2 | NAS Storage | IBM Storage Scale System 6000 (5149-F48) | 2U | 4 | D | `nas-storage` |
| 3 | Management Nodes | IBM Power S1022 (9105-22A), Power10 | 2U | 3 | B | `management-nodes` |
| 4 | AI Fabric Switches | NVIDIA QM9700 NDR 400 (IB spine) | 1U | 2 | C | `ai-fabric-switches` |
| 5 | ToR Switches | NVIDIA Spectrum-3 SN4600 (Ethernet ToR) | 1U | 2 | C | `eth-tor-switches` |
| 6 | OOB Management Switches | NVIDIA SN2201 (OOB) | 1U | 2 | C | `oob-switches` |

Component rows per chassis are the ★ SELECTED items from the BoQ (CPU /
Memory / GPU / Storage / Network / Power). Switches carry no component
rows (same as ADGSA/Avaya). No new `ComponentCategory` was needed — the
existing six cover everything.

---

## 2. Rack layout — ADGSA-style 5 racks

```
[AI Rack 01][AI Rack 02][ Infrastructure 03 ][AI Rack 04][AI Rack 05]
   4× SR675    4× SR675   NAS + Mgmt + switch   4× SR675    4× SR675
```

- **AI racks (01/02/04/05):** 4× SR675 V3 (3U) each, bottoms U8/14/20/26
  (3U unit + 3U airflow gap). 16 nodes total.
- **Infrastructure rack 03 (centre):** bottom→top —
  - U8–15: 4× Storage Scale 6000 (2U) — NAS Storage
  - U18–23: 3× Power S1022 (2U) — Management Nodes
  - U25–26: 2× QM9700 (1U) — AI Fabric Switches
  - U28–29: 2× Spectrum-3 SN4600 (1U) — ToR Switches
  - U31–32: 2× SN2201 (1U) — OOB Management Switches

---

## 3. Decisions taken (gaps in the source material)

| Topic | Resolution |
|---|---|
| **Ethernet ToR switch (SN4600 ×2)** | **Included** (2026-06-16) as the **ToR Switches** group once the image `NVIDIA Spectrum-3 SN4600.jpg` was supplied. Subsystem id is **`eth-tor-switches`** (NOT `tor-switches`, which collides with Avaya's `platformCatalog` and would shadow the catalog with Dell SKUs). |
| **QM9700 quantity** | **2** (per BoQ Sheet 3). The positioning note said "1"; BoQ is the source of truth. |
| **Grand total** | **$5,455,600** (Sheet 0 Overview, rounded unit prices). The per-sheet SELECTED sums add to $5,641,874; the Overview is the published figure, consistent with the ADGSA-AI precedent of using the XLSX Overview number. |
| **Lead score** | **9.8** — mirrors the Dell `/adgsa-ai` project (same tender). |
| **Subsystem id `oob-switches`** | Deliberately **not** `tor-switches`: Avaya's `platformCatalog` is keyed by `tor-switches` (Dell SKUs) and would shadow this project's catalog via `useCatalogScope#resolveCatalogSource`. A fresh id keeps the catalog clean. |

---

## 4. Catalog (right sidebar) — sourced from Sheet 6 "Product Options"

- **L0:** six generic subsystem-category cards (Compute / Storage / GPU /
  Management / Network = in-proposal; Backup = not-in-proposal).
- **L1:** per-subsystem **chassis** alternatives in `productAlternatives`
  (with `price`), one in-proposal SKU + BoQ alternatives each.
- **L2:** per-component **part** alternatives in `componentAlternatives`
  (new `HardwareProject` field), keyed `subsystem id → category`. Built from
  BoQ §1/§2/§4 — EPYC 9555/9654/9755/9575F/9965 + Intel Xeon (SR675 CPU),
  H200 NVL/H100 NVL/L40S/Gaudi3 (GPU), Power10 20C/24C (S1022 CPU), the
  RAM/SSD/NIC/PSU options, etc. `CatalogPanel#resolveComponentCatalog`
  prefers this map and falls back to the shared `componentCatalog` when a
  (subsystem, category) is absent. Scoped per subsystem so the SR675 shows
  EPYC parts and the S1022 shows Power10 parts (no cross-socket mixing).

`platformCatalog` (Avaya's curated Dell catalog) has **no** keys matching
this project's subsystem ids, so `resolveCatalogSource` falls through to
`productAlternatives` — exactly the Lenovo/IBM catalog. Verified.

---

## 5. Dashboard history

The project is registered in `adapter.ts#demoProjectHistoryRows` (id 1003,
pinned at the top) so it shows on `/dashboard` next to the Dell ADGSA and
Avaya demo rows; clicking the row routes to `/adgsa-ibm`.

## 6. Verification

- `npm run typecheck` — green.
- `npm run build` — green; SPA `index.html` emits `<link rel="preload">`
  tags for all five new chassis images (SR675 V3, Power S1022, Scale 6000,
  QM9700 as PNG; SN4600 as JPEG); SN2201 reuses the existing ADGSA-AI asset.
