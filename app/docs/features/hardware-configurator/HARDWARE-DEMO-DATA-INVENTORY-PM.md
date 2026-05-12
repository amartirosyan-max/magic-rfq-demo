# Hardware demo — full data inventory (for product / content)

This document is a **single checklist** of everything the Avaya hardware demo currently encodes in code (`app/features/hardware/fake-data.ts`), plus how it surfaces in the UI. Use it to spot **missing proposal fields**, **wrong counts**, and **catalog gaps**.

**Source of truth in code:** `magic-ui-dev/app/features/hardware/fake-data.ts`  
**Proposal reference:** Avaya IPO200 BoQ (see `DATA-ANALYSIS.md` and proposal doc in repo).

---

## 1. Project (header / left sidebar)

| Field | Value | Notes |
|--------|--------|--------|
| Project ID (fake API) | `1001` | From `adapter.ts`, not shown in UI |
| Display name | Avaya POD Cluster – IPO200 | |
| Client (fake) | Avaya | `adapter.ts` |
| Lead score | `9.6/10` | Shown in left sidebar |
| Grand total (USD) | `644,475` | Shown as “Grand Total:” in left sidebar |
| Short description (fake API) | Avaya POD Cluster — IPO200. Two-rack Hyper-V + VMware infrastructure. | `adapter.ts` |

---

## 2. Chassis types (physical “boxes” in the rack)

Each subsystem references **one chassis type**. Rack PNG is chosen by `chassis.image` (`Server_Dell_01.png` … `04.png`).

| Chassis ID | Product name | Vendor | Height (U) | Image asset | Short description (Screen C hero) | Watts (demo placeholder) |
|------------|----------------|--------|------------|-------------|-----------------------------------|-----------------------------|
| `chassis-r660` | Dell PowerEdge R660 | dell | 1 | `Server_Dell_01.png` | 1U two-socket rack server for dense database analytics and high-density virtualization. | 800 |
| `chassis-r760` | Dell PowerEdge R760 | dell | 2 | `Server_Dell_02.png` | 2U two-socket rack server for mixed workload standardization, virtualization and analytics. | 1100 |
| `chassis-unity-380f` | Dell EMC Unity 380F | dell | 2 | `Server_Dell_03.png` | 2U dual-active-controller all-flash midrange storage array with 25 × 2.5" drive slots. | 600 |
| `chassis-ds-6610b` | Connectrix DS-6610B | dell | 1 | `Server_Dell_04.png` | 1U 24-port 16Gb Fibre Channel SAN switch, rear-to-front airflow, single PSU. | 150 |
| `chassis-s5224f` | Dell EMC S5224F-ON | dell | 1 | `Server_Dell_04.png` | 1U 24 × 25GbE SFP28 + 4 × 100GbE QSFP28 ToR switch, IO to PSU airflow, dual PSU. | 200 |
| `chassis-n3248` | Dell EMC N3248TE-ON | dell | 1 | `Server_Dell_04.png` | 1U 48 × 1GbE + 4 × 10G SFP+ + 2 × 100G QSFP28 management switch, single AC PSU. | 120 |

**PM action:** Confirm **watts** and hero **one-liners** against proposal or datasheets; today they are partly **demo placeholders** (called out in code comments).

---

## 3. “Components of the component” — per-chassis BOM lines (Screen C list)

Quantities below are **per single chassis instance** (one R660, one R760, one Unity, etc.).

### 3.1 Dell PowerEdge R660 (`r660Components`) — used by Hyper-v cluster

| Row ID | Category | UI label | Qty | Description (verbatim in app) |
|--------|----------|----------|-----|--------------------------------|
| `r660-cpu` | cpu | CPU | 2 | Intel Xeon Gold 6548Y+ 2.5G, 32C/64T, 20GT/s, 60M Cache, Turbo, HT (250W) DDR5-5200 |
| `r660-memory` | memory | Memory | 4 | 32GB RDIMM, 5600MT/s, Dual Rank |
| `r660-storage` | storage | Hard Drive / SSD | 2 | 480GB SSD SATA Read Intensive 6Gbps 512 2.5in Hot-plug AG Drive, 1 DWPD |
| `r660-nic-1` | network | Network Card | 1 | Broadcom 57414 Dual Port 10/25GbE SFP28, OCP NIC 3.0 |
| `r660-nic-2` | network | Network Card | 1 | Broadcom 5720 Dual Port 1GbE LOM |
| `r660-power` | power | Power | 1 | Dual, Hot-plug, Power Supply Redundant (1+1), 800W, Mixed Mode, NAF |

### 3.2 Dell PowerEdge R760 (`r760Components`) — used by VMware cluster

| Row ID | Category | UI label | Qty | Description |
|--------|----------|----------|-----|----------------|
| `r760-cpu` | cpu | CPU | 2 | Intel Xeon Platinum 8568Y+ 2.3G, 48C/96T, 20GT/s, 300M Cache, Turbo, HT (350W) DDR5-5600 |
| `r760-memory` | memory | Memory | 8 | 32GB RDIMM, 5600MT/s, Dual Rank |
| `r760-storage` | storage | Hard Drive / SSD | 2 | 480GB SSD SATA Read Intensive 6Gbps 512 2.5in Hot-plug AG Drive, 1 DWPD |
| `r760-nic-1` | network | Network Card | 1 | Broadcom 57414 Dual Port 10/25GbE SFP28, OCP NIC 3.0 |
| `r760-nic-2` | network | Network Card | 1 | Broadcom 5720 Dual Port 1GbE LOM |
| `r760-power` | power | Power | 1 | Dual, Hot-plug, Power Supply Redundant (1+1), 800W, Mixed Mode, NAF |

### 3.3 Dell EMC Unity 380F (`unity380fComponents`) — used by SAN Storage

| Row ID | Category | UI label | Qty | Description |
|--------|----------|----------|-----|----------------|
| `unity-storage` | storage | Hard Drive / SSD | 14 | Unity F 3.84TB ALL FLASH 25X2.5 SSD |

### 3.4 Switches (Management / ToR / SAN)

| Subsystem | Chassis | Screen C component rows |
|-----------|---------|-------------------------|
| Management Switch | N3248TE-ON | **None** (`components: []`) — Screen C shows empty-state copy |
| ToR Switches | S5224F-ON | **None** |
| SAN Switches | DS-6610B | **None** |

**PM action:** Decide whether switches need **fake “line items”** (ports, licenses, optics) for demo parity with compute/storage.

---

## 4. Subsystems (left nav + Screen C title)

Screen C title format: **`{qty} × {chassis.name}`** + **`{titleSuffix}`**.

| Subsystem ID | Left nav label | titleSuffix | Kind | Cluster qty (instances) | Chassis | # BOM lines |
|--------------|----------------|--------------|------|-------------------------|---------|-------------|
| `hyper-v-cluster` | Hyper-v cluster | Hyper-v Cluster | compute | 14 | R660 | 6 |
| `vmware-cluster` | VMWare cluster | VMware Cluster | compute | 2 | R760 | 6 |
| `san-storage` | SAN Storage | SAN Storage | storage | 1 | Unity 380F | 1 |
| `mgmt-switch` | Management Switch | Management Switch | switch | 1 | N3248TE-ON | 0 |
| `tor-switches` | ToR Switches | ToR Switches | switch | 2 | S5224F-ON | 0 |
| `san-switches` | SAN Switches | SAN Switches | switch | 2 | DS-6610B | 0 |

**Fleet totals (for PM math checks):**

- **R660:** 14 chassis (all Hyper-v).
- **R760:** 2 chassis (VMware).
- **Unity 380F:** 1.
- **N3248:** 1, **S5224F:** 2, **DS-6610B:** 2.

---

## 5. Racks — placement (42U racks, U1 = bottom)

Canvas order: **`[empty left][Rack 01][Rack 02][empty right]`**.

### 5.1 Infrastructure Rack 01 (`rack-01`)

| Bottom U (`positionU`) | Size U | Subsystem | Unit ID pattern | Notes |
|-------------------------|--------|-----------|-----------------|--------|
| 42 | 1 | Management Switch | `mgmt-switch-1` | |
| 41 | 1 | ToR Switches | `tor-switches-1` | Instance 1 of 2 |
| 40 | 1 | SAN Switches | `san-switches-1` | Instance 1 of 2 |
| 39–33 | 1 each | Hyper-v cluster | `hyper-v-cluster-1` … `hyper-v-cluster-7` | **First half** of 14 nodes |
| 31–30 | 2 | SAN Storage | `san-storage-1` | Unity (2U), bottom at U31 |

### 5.2 Infrastructure Rack 02 (`rack-02`)

| Bottom U | Size U | Subsystem | Unit ID pattern | Notes |
|----------|--------|-----------|-----------------|--------|
| 42 | 1 | ToR Switches | `tor-switches-2` | Instance 2 of 2 |
| 41 | 1 | SAN Switches | `san-switches-2` | Instance 2 of 2 |
| 40–34 | 1 each | Hyper-v cluster | `hyper-v-cluster-8` … `hyper-v-cluster-14` | **Second half** of 14 nodes |
| 32–31 | 2 | VMware cluster | `vmware-cluster-1` | R760 #1 |
| 30–29 | 2 | VMware cluster | `vmware-cluster-2` | R760 #2 |

### 5.3 Empty racks

| Rack ID | Label | Contents |
|---------|--------|----------|
| `rack-empty-left` | Empty | No units |
| `rack-empty-right` | Empty | No units |

**PM action:** Confirm this **split of Hyper-v across two racks** is acceptable for customer story vs. literal rack photos.

---

## 6. Right sidebar — Catalog (what exists in data)

There are **two different catalog concepts** in `HardwareProject`:

### 6.1 What the UI shows **today** (`subsystemCategories`)

`HardwareLayout.tsx` passes **`hardwareProject.subsystemCategories`** into the right sidebar **Catalog** tab for **all screens** (Screen A and Screen C). These are **high-level categories** with a **status badge** (`in-proposal` | `removed` | `not-in-proposal`).

| Entry ID | Name | Status | Purpose (short) |
|----------|------|--------|------------------|
| `cat-compute-server` | Compute Server | in-proposal | Generic blurb |
| `cat-server-storage` | Server Storage | in-proposal | Generic blurb |
| `cat-server-gpu` | Server GPU | removed | Struck / not proceeding |
| `cat-management-node` | Management Node Server | not-in-proposal | Optional add |
| `cat-network-switch` | Network Switch | in-proposal | Generic blurb |
| `cat-backup-appliance` | Backup Appliance | not-in-proposal | Optional add |

Full marketing descriptions live in `fake-data.ts` on each object’s `description` field.

**PM action:** Replace generic blurbs with **proposal-aligned** copy; add/remove rows; align statuses with sales story.

### 6.2 Prepared but **not wired in UI yet** (`productAlternatives`)

`fake-data.ts` also defines **`productAlternatives[subsystemId]`** — alternative SKUs per subsystem (intended for **Screen C** catalog swap per `PROGRESS.md`). **Current app still shows `subsystemCategories` on Screen C**; this map is **data-only** until implemented.

Use the tables below as the **intended** right-panel options when a subsystem is active.

#### `hyper-v-cluster`

| Alt ID | Name | Status | Description |
|--------|------|--------|-------------|
| `alt-r660` | Dell PowerEdge R660 | in-proposal | The chassis currently in the proposal. 1U dual-socket server for dense virtualization. |
| `alt-r6615` | Dell PowerEdge R6615 | not-in-proposal | 1U single-socket AMD EPYC server. Lower licensing footprint when per-core cost matters. |
| `alt-r6625` | Dell PowerEdge R6625 | not-in-proposal | 1U dual-socket AMD EPYC server. Higher core density alternative to the R660. |
| `alt-r670` | Dell PowerEdge R670 | not-in-proposal | Next-generation 1U Intel Xeon server with PCIe 5 expansion and CXL memory support. |

#### `vmware-cluster`

| Alt ID | Name | Status | Description |
|--------|------|--------|-------------|
| `alt-r760` | Dell PowerEdge R760 | in-proposal | The chassis currently in the proposal. 2U dual-socket server for mixed workloads. |
| `alt-r760xa` | Dell PowerEdge R760xa | not-in-proposal | 2U accelerator-optimized variant. Up to 4 double-wide GPUs. |
| `alt-r860` | Dell PowerEdge R860 | not-in-proposal | 4-socket 2U server for the largest in-memory and OLTP databases. |

#### `san-storage`

| Alt ID | Name | Status | Description |
|--------|------|--------|-------------|
| `alt-unity-380f` | Dell EMC Unity 380F | in-proposal | The storage currently in the proposal. 2U all-flash midrange array. |
| `alt-unity-680f` | Dell EMC Unity 680F | not-in-proposal | Higher-tier all-flash variant with more cache and bandwidth. |
| `alt-powerstore-1200t` | Dell PowerStore 1200T | not-in-proposal | NVMe-first replacement family with active/active scale-out. |

#### `mgmt-switch`

| Alt ID | Name | Status | Description |
|--------|------|--------|-------------|
| `alt-n3248` | Dell EMC N3248TE-ON | in-proposal | 1U 48 × 1GbE management switch currently in the proposal. |
| `alt-n3208` | Dell EMC N3208PX-ON | not-in-proposal | 8-port 1GbE PoE alternative for smaller management domains. |

#### `tor-switches`

| Alt ID | Name | Status | Description |
|--------|------|--------|-------------|
| `alt-s5224f` | Dell EMC S5224F-ON | in-proposal | 1U 24 × 25GbE ToR currently in the proposal. |
| `alt-s5248f` | Dell EMC S5248F-ON | not-in-proposal | 1U 48 × 25GbE ToR for higher port density. |
| `alt-s5232f` | Dell EMC S5232F-ON | not-in-proposal | 1U 32 × 100GbE spine/leaf alternative. |

#### `san-switches`

| Alt ID | Name | Status | Description |
|--------|------|--------|-------------|
| `alt-ds-6610b` | Connectrix DS-6610B | in-proposal | 24-port 16Gb FC SAN switch currently in the proposal, expanded with POD upgrade kits. |
| `alt-ds-7720b` | Connectrix DS-7720B | not-in-proposal | Higher-end 48-port 32Gb FC switch for larger SAN fabrics. |

**PM action:**

1. Confirm each **alternative** matches what sales is allowed to quote.
2. Track engineering task: **swap right catalog** on Screen C from `subsystemCategories` → `productAlternatives[activeSubsystemId]` (see `PROGRESS.md` Step 6).

---

## 7. Screen C row icons (asset filenames)

Component list tries (in order) paths under `PNG+SVG` and `verstka`; see `ScreenC.tsx` → `CATEGORY_ICON_CANDIDATES`.

**Confirmed mapped by PM request:**

- Memory → `PNG+SVG/Component_RAM.png`
- Hard Drive / SSD → `PNG+SVG/Component_HDD.png`

**Still using Lucide fallback until files exist:** CPU, Network, Power (and any missing optional names like `Component_SSD.png`).

**PM action:** Drop in `Component_CPU.png`, `Component_Network.png`, `Component_Power.png` (or `.svg`) under `app/assets/hardware/PNG+SVG/` using the names in code.

---

## 8. Engineering / content checklist (quick)

- [ ] Reconcile **every BOM line** with latest proposal export.
- [ ] Replace **chassis watts** and hero blurbs if legal/sales require exact specs.
- [ ] Decide **switch subsystem** line items for Screen C (or keep empty).
- [ ] Refresh **subsystemCategories** copy + statuses for catalog tab.
- [ ] Align **productAlternatives** with allowed upsell matrix; then wire UI.
- [ ] Confirm **rack split** story vs. physical rack diagrams.

---

*Generated from codebase state; update this file when `fake-data.ts` changes.*
