/**
 * Hardware configurator — ADGSA-AI (IBM / Lenovo) POD project data.
 *
 * Same tender as the Dell ADGSA project (ADGSA-AI-2026-004), re-bid as an
 * IBM Corporation + Lenovo OEM hardware + NVIDIA networking solution.
 *
 * Source of truth: `app/docs/features/adgsa-lenovo/IBM_BoQ_ADGSA-AI-2026-004_v4.xlsx`
 *   - Sheet 0 Overview  → grand total $5,455,600 (hardware only)
 *   - Sheet 1 AI GPU    → 16× Lenovo SR675 V3 (9155-G04), 4× H200 NVL each
 *   - Sheet 2 Mgmt      → 3× IBM Power S1022 (9105-22A)
 *   - Sheet 3 Network   → 2× QM9700 (IB spine) + 2× SN2201 (OOB)  [SN4600 ToR omitted — no image]
 *   - Sheet 4 NAS       → 4× IBM Storage Scale System 6000 (5149-F48)
 *   - Sheet 6 Options   → per-subsystem product alternatives (catalog)
 *
 * Layout: ADGSA-style 5-rack canvas — 4 AI racks (4× SR675 each) + 1 centre
 * Infrastructure rack (NAS + Management + switches).
 *
 * Filenames in `Chassis.image` resolve via `chassis-assets.ts`.
 */

import type {
  CatalogEntry,
  Chassis,
  ComponentCategory,
  HardwareComponent,
  HardwareProject,
  Rack,
  RackUnit,
  Subsystem,
} from "../types";

/* -------------------------------------------------------------------------- */
/*  Chassis specs                                                              */
/* -------------------------------------------------------------------------- */

const sr675Chassis: Chassis = {
  id: "chassis-sr675-v3",
  name: "Lenovo ThinkSystem SR675 V3",
  vendor: "lenovo",
  sizeU: 3,
  image: "Lenovo ThinkSystem SR675 V3.png",
  description:
    "3U 4-DW GPU node (IBM Fusion HCI 9155-G04) with 4× NVIDIA H200 NVL 141 GB GPUs, dual AMD EPYC 9555 (Zen 5, SP5), 1,152 GB DDR5-6400 and 8× U.2 NVMe AnyBay bays.",
  watts: 2500,
};

const scale6000Chassis: Chassis = {
  id: "chassis-scale-6000",
  name: "IBM Storage Scale System 6000",
  vendor: "ibm",
  sizeU: 2,
  image: "IBM Storage Scale System 6000.png",
  description:
    "2U NVMe all-flash GPFS scale-out NAS node (5149-F48) — 24× 7.68 TB Gen5 E1.S (184 TB raw/node, 736 TB cluster), 340 GB/s read, active-active HA controllers, 4× HDR100 IB client ports.",
  watts: 1800,
};

const s1022Chassis: Chassis = {
  id: "chassis-power-s1022",
  name: "IBM Power S1022",
  vendor: "ibm",
  sizeU: 2,
  image: "IBM Power S1022.png",
  description:
    "2U dual-socket IBM Power10 management server (9105-22A, 40 cores), 512 GB DDR4-3200, running the Kubernetes/OpenShift control plane, IBM MQ, Db2 and the monitoring stack.",
  watts: 1100,
};

const qm9700Chassis: Chassis = {
  id: "chassis-qm9700",
  name: "NVIDIA QM9700 NDR 400",
  vendor: "nvidia",
  sizeU: 1,
  image: "NVIDIA QM9700 NDR 400.png",
  description:
    "1U 64-port NDR 400 Gb/s QSFP112 InfiniBand spine (Quantum-3, 51.2 Tb/s, SHARP v3) — non-blocking fat-tree backbone for the 16 GPU nodes.",
  watts: 1700,
};

const sn4600Chassis: Chassis = {
  id: "chassis-sn4600",
  name: "NVIDIA Spectrum-3 SN4600",
  vendor: "nvidia",
  sizeU: 1,
  image: "NVIDIA Spectrum-3 SN4600.jpg",
  description:
    "1U 64 × 100 GbE QSFP28 Spectrum-3 Ethernet top-of-rack (Cumulus Linux / SONiC, 12.8 Tb/s) — GPU data-plane + management + NAS client traffic on an EVPN/VXLAN L3 fabric.",
  watts: 600,
};

const sn2201Chassis: Chassis = {
  id: "chassis-sn2201-ibm",
  name: "NVIDIA SN2201",
  vendor: "nvidia",
  sizeU: 1,
  image: "Nvidia-SN2201.png",
  description:
    "1U 48 × 1 GbE + 4 × 25 GbE out-of-band management switch (SONiC) — dual-plane OOB control for every XCC2/BMC/IPMI port in the cluster.",
  watts: 130,
};

/* -------------------------------------------------------------------------- */
/*  Components per chassis (verbatim selected items from BoQ §A / §B / §D)      */
/* -------------------------------------------------------------------------- */

const sr675Components: HardwareComponent[] = [
  {
    id: "sr675-cpu",
    category: "cpu",
    categoryLabel: "CPU",
    description:
      "AMD EPYC 9555 64-Core 3.2 GHz (Zen 5, Turin, SP5), 256 MB L3, DDR5-6400, 280 W",
    qty: 2,
  },
  {
    id: "sr675-memory",
    category: "memory",
    categoryLabel: "Memory",
    description:
      "96 GB TruDDR5-6400 RDIMM 2Rx4 ECC (12× = 1,152 GB per node, IBM power-table validated)",
    qty: 12,
  },
  {
    id: "sr675-gpu",
    category: "gpu",
    categoryLabel: "GPU",
    description:
      "NVIDIA H200 NVL 141 GB HBM3e PCIe Gen5 (4.8 TB/s, 835 TFLOPS FP16, NVLink bridge) — 4× per node",
    qty: 4,
  },
  {
    id: "sr675-boot",
    category: "storage",
    categoryLabel: "Hard Drive / SSD",
    description: "960 GB M.2 NVMe SSD — OS boot RAID-1 pair",
    qty: 2,
  },
  {
    id: "sr675-scratch",
    category: "storage",
    categoryLabel: "Hard Drive / SSD",
    description:
      "3.84 TB NVMe Gen4 U.2 2.5\" hot-swap scratch SSD (AnyBay bays, 2 of 8 used)",
    qty: 2,
  },
  {
    id: "sr675-nic",
    category: "network",
    categoryLabel: "Network Card",
    description:
      "NVIDIA ConnectX-7 dual-port NDR200 200 Gb/s OCP 3.0 (PCIe Gen5, RoCEv2 + IB, GPUDirect)",
    qty: 1,
  },
  {
    id: "sr675-power",
    category: "power",
    categoryLabel: "Power",
    description: "2600 W 80PLUS Titanium hot-swap PSU (2+2 redundant)",
    qty: 4,
  },
];

const s1022Components: HardwareComponent[] = [
  {
    id: "s1022-cpu",
    category: "cpu",
    categoryLabel: "CPU",
    description:
      "IBM Power10 DCM 20-Core 4.0 GHz, 120 MB L3 per DCM, DDR4-3200 (2× = 40 cores total)",
    qty: 2,
  },
  {
    id: "s1022-memory",
    category: "memory",
    categoryLabel: "Memory",
    description: "32 GB DDR4-3200 RDIMM ECC (16× = 512 GB per node)",
    qty: 16,
  },
  {
    id: "s1022-storage",
    category: "storage",
    categoryLabel: "Hard Drive / SSD",
    description:
      "1.92 TB IBM NVMe PCIe SSD hot-swap SFF (OS + data, AIX/RHEL boot)",
    qty: 2,
  },
  {
    id: "s1022-nic",
    category: "network",
    categoryLabel: "Network Card",
    description:
      "IBM 2-port 25 GbE RoCE PCIe 4.0 adapter (EC67H) — Power10 validated",
    qty: 1,
  },
  {
    id: "s1022-power",
    category: "power",
    categoryLabel: "Power",
    description: "IBM 1600 W 80PLUS Platinum hot-swap PSU (N+N redundant)",
    qty: 2,
  },
];

const scale6000Components: HardwareComponent[] = [
  {
    id: "scale6000-storage",
    category: "storage",
    categoryLabel: "Hard Drive / SSD",
    description:
      "7.68 TB NVMe Gen5 E1.S hot-swap SSD (24× half-populated = 184 TB raw/node, 736 TB cluster)",
    qty: 24,
  },
  {
    id: "scale6000-nic",
    category: "network",
    categoryLabel: "Network Card",
    description:
      "NVIDIA ConnectX-6 HDR100 100 Gb/s InfiniBand dual-port client NIC (PCIe Gen4)",
    qty: 1,
  },
];

/* Switches: no component rows on Screen C — matches the ADGSA/Avaya switch
 * pattern. */
const switchComponents: HardwareComponent[] = [];

/* -------------------------------------------------------------------------- */
/*  Subsystems — 5 nav groups                                                  */
/* -------------------------------------------------------------------------- */

const subsystems: Subsystem[] = [
  {
    id: "ai-gpu-cluster",
    name: "AI GPU Cluster",
    titleSuffix: "AI GPU Cluster",
    kind: "compute",
    qty: 16,
    chassis: sr675Chassis,
    components: sr675Components,
  },
  {
    id: "nas-storage",
    name: "NAS Storage",
    titleSuffix: "NAS Storage",
    kind: "storage",
    qty: 4,
    chassis: scale6000Chassis,
    components: scale6000Components,
  },
  {
    id: "management-nodes",
    name: "Management Nodes",
    titleSuffix: "Management Nodes",
    kind: "compute",
    qty: 3,
    chassis: s1022Chassis,
    components: s1022Components,
  },
  {
    id: "ai-fabric-switches",
    name: "AI Fabric Switches",
    titleSuffix: "AI Fabric Switches",
    kind: "switch",
    qty: 2,
    chassis: qm9700Chassis,
    components: switchComponents,
  },
  {
    id: "eth-tor-switches",
    name: "ToR Switches",
    titleSuffix: "ToR Switches",
    kind: "switch",
    qty: 2,
    chassis: sn4600Chassis,
    components: switchComponents,
  },
  {
    id: "oob-switches",
    name: "OOB Management Switches",
    titleSuffix: "OOB Management Switches",
    kind: "switch",
    qty: 2,
    chassis: sn2201Chassis,
    components: switchComponents,
  },
];

/* -------------------------------------------------------------------------- */
/*  Racks — ADGSA-style 5-rack layout                                          */
/* -------------------------------------------------------------------------- */

/**
 * AI rack U layout (Racks 1, 2, 4, 5).
 *
 * Each SR675 V3 is a genuine 3 U chassis (kept on `sr675Chassis.sizeU`).
 * On the canvas the four nodes are stacked with a 3 U airflow gap between
 * neighbours (pitch 6) so the rack reads as a calm stacked deck rather
 * than a solid block.
 *
 * Layout (bottom → top, 3 U per unit + 3 U gap):
 *   - Unit #1: U8  → U10
 *   - Unit #2: U14 → U16
 *   - Unit #3: U20 → U22
 *   - Unit #4: U26 → U28
 *
 * `startIndex` lets the same `ai-gpu-cluster` subsystem be split across
 * all four AI racks without RackUnit id collisions.
 */
function aiRackUnits(startIndex: number): RackUnit[] {
  const units: RackUnit[] = [];
  const bottoms = [8, 14, 20, 26];
  for (let i = 0; i < bottoms.length; i++) {
    units.push({
      id: `ai-gpu-cluster-${startIndex + i}`,
      subsystemId: "ai-gpu-cluster",
      positionU: bottoms[i],
      sizeU: 3,
    });
  }
  return units;
}

/**
 * Infrastructure (centre) rack — bottom → top:
 *   U8-15  : 4× IBM Storage Scale 6000 (2U each)  (NAS Storage)
 *   U18-23 : 3× IBM Power S1022 (2U each)          (Management Nodes)
 *   U25-26 : 2× NVIDIA QM9700 (1U each)            (AI Fabric Switches)
 *   U28-29 : 2× NVIDIA Spectrum-3 SN4600 (1U each) (ToR Switches)
 *   U31-32 : 2× NVIDIA SN2201 (1U each)            (OOB Management Switches)
 */
function infraRackUnits(): RackUnit[] {
  const units: RackUnit[] = [];
  const nasBottoms = [8, 10, 12, 14];
  for (let i = 0; i < nasBottoms.length; i++) {
    units.push({
      id: `nas-storage-${i + 1}`,
      subsystemId: "nas-storage",
      positionU: nasBottoms[i],
      sizeU: 2,
    });
  }
  const mgmtBottoms = [18, 20, 22];
  for (let i = 0; i < mgmtBottoms.length; i++) {
    units.push({
      id: `management-nodes-${i + 1}`,
      subsystemId: "management-nodes",
      positionU: mgmtBottoms[i],
      sizeU: 2,
    });
  }
  const fabricBottoms = [25, 26];
  for (let i = 0; i < fabricBottoms.length; i++) {
    units.push({
      id: `ai-fabric-switches-${i + 1}`,
      subsystemId: "ai-fabric-switches",
      positionU: fabricBottoms[i],
      sizeU: 1,
    });
  }
  const torBottoms = [28, 29];
  for (let i = 0; i < torBottoms.length; i++) {
    units.push({
      id: `eth-tor-switches-${i + 1}`,
      subsystemId: "eth-tor-switches",
      positionU: torBottoms[i],
      sizeU: 1,
    });
  }
  const oobBottoms = [31, 32];
  for (let i = 0; i < oobBottoms.length; i++) {
    units.push({
      id: `oob-switches-${i + 1}`,
      subsystemId: "oob-switches",
      positionU: oobBottoms[i],
      sizeU: 1,
    });
  }
  return units;
}

const racks: Rack[] = [
  {
    id: "ai-rack-01",
    name: "AI Server Rack 01",
    shortLabel: "AI Server Rack 01",
    kind: "rack-42u",
    heightU: 42,
    units: aiRackUnits(1),
    isEmpty: false,
    columnLabel: { line1: "AI Server Rack", line2: "Rack 01" },
  },
  {
    id: "ai-rack-02",
    name: "AI Server Rack 02",
    shortLabel: "AI Server Rack 02",
    kind: "rack-42u",
    heightU: 42,
    units: aiRackUnits(5),
    isEmpty: false,
    columnLabel: { line1: "AI Server Rack", line2: "Rack 02" },
  },
  {
    id: "infra-rack-03",
    name: "Infrastructure Rack 03",
    shortLabel: "Infrastructure Rack 03",
    kind: "rack-42u",
    heightU: 42,
    units: infraRackUnits(),
    isEmpty: false,
    columnLabel: { line1: "Infrastructure Rack", line2: "Rack 03" },
  },
  {
    id: "ai-rack-04",
    name: "AI Server Rack 04",
    shortLabel: "AI Server Rack 04",
    kind: "rack-42u",
    heightU: 42,
    units: aiRackUnits(9),
    isEmpty: false,
    columnLabel: { line1: "AI Server Rack", line2: "Rack 04" },
  },
  {
    id: "ai-rack-05",
    name: "AI Server Rack 05",
    shortLabel: "AI Server Rack 05",
    kind: "rack-42u",
    heightU: 42,
    units: aiRackUnits(13),
    isEmpty: false,
    columnLabel: { line1: "AI Server Rack", line2: "Rack 05" },
  },
];

/* -------------------------------------------------------------------------- */
/*  Catalog — right sidebar                                                    */
/* -------------------------------------------------------------------------- */

/* Screen A/B catalog: same six subsystem categories as ADGSA/Avaya, with
 * statuses reflecting the IBM/Lenovo proposal scope. */
const subsystemCategories: CatalogEntry[] = [
  {
    id: "cat-compute-server",
    name: "Compute Server",
    status: "in-proposal",
    description:
      "The Compute Server subsystem is the part of a data center made up of powerful computers that do most of the processing work. These servers can handle many different tasks, such as running business programs or managing data. They can also be expanded with special parts to work faster. This subsystem is important for making sure the data center can serve the needs of an organization efficiently.",
  },
  {
    id: "cat-server-storage",
    name: "Server Storage",
    status: "in-proposal",
    description:
      "The Server Storage subsystem is the part of a data center that safely stores and organizes large amounts of data. It uses special equipment to make sure information can be saved, found, and protected quickly and reliably. This system helps organizations keep their data available for many uses, such as running programs, storing backups, and analyzing information.",
  },
  {
    id: "cat-server-gpu",
    name: "Server GPU",
    status: "in-proposal",
    description:
      "The Server GPU subsystem is the part of a data center that uses special computer chips to speed up demanding tasks, like artificial intelligence and scientific calculations. These chips help the data center handle complex work more quickly and efficiently, making it easier to process large amounts of information.",
  },
  {
    id: "cat-management-node",
    name: "Management Node Server",
    status: "in-proposal",
    description:
      "The Management Node Server subsystem is the part of a data center responsible for orchestration, monitoring, and remote administration. It provides operators with a single pane of glass to provision workloads, apply updates, and inspect system health across compute, storage, and networking.",
  },
  {
    id: "cat-network-switch",
    name: "Network Switch",
    status: "in-proposal",
    description:
      "The Network Switch subsystem connects servers, storage, and management equipment inside the rack and to the wider data center fabric. It moves data between devices with low latency and high throughput, and provides segmentation, redundancy, and bandwidth scaling for east-west and north-south traffic.",
  },
  {
    id: "cat-backup-appliance",
    name: "Backup Appliance",
    status: "not-in-proposal",
    description:
      "The Backup Appliance subsystem keeps independent copies of critical workloads so they can be restored after corruption, ransomware or hardware failure. It typically pairs deduplicated storage with policy-based scheduling and integration with the hypervisor and SAN.",
  },
];

/* Screen C catalog: per-subsystem alternative products, taken from BoQ
 * Sheet 6 "Product Options". The ★ SELECTED row is in-proposal; the rest
 * are available alternatives. */
const productAlternatives: Record<string, CatalogEntry[]> = {
  "ai-gpu-cluster": [
    {
      id: "alt-sr675-v3-4dw",
      name: "Lenovo SR675 V3 4-DW (IBM 9155-G04)",
      status: "in-proposal",
      price: "$65,000",
      description:
        "The chassis currently in the proposal. 3U 4-DW Base Module with 4× NVIDIA H200 NVL GPUs, dual AMD EPYC SP5 and 8× U.2 NVMe AnyBay bays.",
    },
    {
      id: "alt-sr675-v3-sxm5",
      name: "Lenovo SR675 V3 SXM5 HGX (9155-G04-SXM5)",
      status: "not-in-proposal",
      price: "$78,000",
      description:
        "SXM5 NVLink variant — 4× H200 SXM5 in a 900 GB/s NVLink mesh with Neptune hybrid liquid cooling for maximum training bandwidth.",
    },
    {
      id: "alt-sr680a-v3",
      name: "Lenovo ThinkSystem SR680a V3 (7DHM)",
      status: "not-in-proposal",
      price: "$120,000",
      description:
        "8U 4-socket SP5 chassis with 8× SXM5 NVLink full mesh — 8 nodes deliver the same 64-GPU count in a larger, denser form factor.",
    },
  ],
  "nas-storage": [
    {
      id: "alt-scale-6000",
      name: "IBM Storage Scale System 6000 (5149-F48)",
      status: "in-proposal",
      price: "$280,000",
      description:
        "The array currently in the proposal. 2U NVMe all-flash GPFS scale-out NAS — 48× Gen5 E1.S bays, 340 GB/s read, HA active-active controllers.",
    },
    {
      id: "alt-scale-5000",
      name: "IBM Storage Scale System 5000 (5147-ESS)",
      status: "not-in-proposal",
      price: "$180,000",
      description:
        "Hybrid NVMe + SAS/SATA scale-out node — lower $/TB entry tier for archived or cold AI datasets.",
    },
    {
      id: "alt-flashsystem-7300",
      name: "IBM FlashSystem 7300 (2076-AF7)",
      status: "not-in-proposal",
      price: "$120,000",
      description:
        "Block + file NVMe all-flash with Spectrum Virtualize (up to 4.6 PB) — ideal if block storage is also required alongside the NAS tier.",
    },
    {
      id: "alt-netapp-a900",
      name: "NetApp AFF A900",
      status: "not-in-proposal",
      price: "$145,000",
      description:
        "Non-IBM all-NVMe alternative — 384 TB max, 450 GB/s, 15.4M IOPS, NFS/S3/iSCSI; best-in-class NAS performance for AI storage.",
    },
  ],
  "management-nodes": [
    {
      id: "alt-power-s1022",
      name: "IBM Power S1022 (9105-22A)",
      status: "in-proposal",
      price: "$35,000",
      description:
        "The chassis currently in the proposal. 2U dual-socket IBM Power10 server (40 cores) for the Kubernetes/OpenShift control plane, IBM MQ and Db2.",
    },
    {
      id: "alt-power-s1014",
      name: "IBM Power S1014 (9105-41B)",
      status: "not-in-proposal",
      price: "$18,000",
      description:
        "1U single-socket Power10 entry node (up to 24 cores) — lower-cost control-plane option.",
    },
    {
      id: "alt-sr650-v3",
      name: "Lenovo SR650 V3 (IBM 9155-C14)",
      status: "not-in-proposal",
      price: "$28,000",
      description:
        "2U Intel Xeon IBM Fusion HCI compute node — use if an x86 management OS is required instead of Power.",
    },
    {
      id: "alt-sr630-v3",
      name: "Lenovo SR630 V3 (IBM 9155-C10)",
      status: "not-in-proposal",
      price: "$18,500",
      description:
        "Compact 1U Intel Xeon Fusion HCI compute-storage node for the management plane.",
    },
  ],
  "ai-fabric-switches": [
    {
      id: "alt-qm9700",
      name: "NVIDIA QM9700 NDR 400",
      status: "in-proposal",
      price: "$55,000",
      description:
        "The switch currently in the proposal. 1U 64-port NDR 400 Gb/s Quantum-3 InfiniBand spine (51.2 Tb/s, SHARP v3) — non-blocking fat-tree for 16 GPU nodes.",
    },
    {
      id: "alt-qm9790",
      name: "NVIDIA QM9790 NDR800",
      status: "not-in-proposal",
      price: "$72,000",
      description:
        "1U 80-port NDR800 800 Gb/s Quantum-4 spine — future-proof scale-out; requires NDR800 adapters.",
    },
    {
      id: "alt-qm9600",
      name: "NVIDIA QM9600 NDR 400",
      status: "not-in-proposal",
      price: "$38,000",
      description:
        "1U 40-port NDR 400 Gb/s Quantum-3 spine — smaller, lower-cost alternative that still covers 16 GPU nodes.",
    },
  ],
  "eth-tor-switches": [
    {
      id: "alt-sn4600",
      name: "NVIDIA Spectrum-3 SN4600 100 GbE",
      status: "in-proposal",
      price: "$22,000",
      description:
        "The switch currently in the proposal. 1U 64× 100 GbE Spectrum-3 Ethernet top-of-rack (Cumulus/SONiC, 12.8 Tb/s) — GPU/NAS data-plane on an EVPN/VXLAN L3 fabric.",
    },
    {
      id: "alt-arista-7280r3",
      name: "Arista 7280R3 100 GbE",
      status: "not-in-proposal",
      price: "$32,000",
      description:
        "48× 100 GbE + 8× 400 GbE Arista EOS top-of-rack — preferred if Arista EOS management is the standard.",
    },
    {
      id: "alt-cisco-nexus-93600",
      name: "Cisco Nexus 93600CD-GX",
      status: "not-in-proposal",
      price: "$28,000",
      description:
        "28× 100 GbE + 8× 400 GbE Cisco NX-OS / ACI-compatible top-of-rack — strong fit for existing Cisco estates in the UAE/ME market.",
    },
  ],
  "oob-switches": [
    {
      id: "alt-sn2201",
      name: "NVIDIA SN2201 OOB",
      status: "in-proposal",
      price: "$4,500",
      description:
        "The switch currently in the proposal. 1U 48× 1 GbE + 4× 25 GbE OOB management switch (SONiC) for BMC/XCC/IPMI control.",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  L2 component-swap catalog — per subsystem → category (BoQ §1 / §2 / §4)     */
/* -------------------------------------------------------------------------- */

/* The "swap this part" list shown when a single component row (CPU / GPU /
 * RAM / SSD / NIC / PSU) is opened on Screen C. One ★ in-proposal SKU per
 * category plus its BoQ alternatives, so the deepest catalog level reflects
 * the IBM/Lenovo BoQ rather than the shared Dell catalog. */
const componentAlternatives: Record<
  string,
  Partial<Record<ComponentCategory, CatalogEntry[]>>
> = {
  "ai-gpu-cluster": {
    cpu: [
      {
        id: "cpu-epyc-9555",
        name: "AMD EPYC 9555 64-Core",
        status: "in-proposal",
        price: "$7,500",
        spec: "64C/128T · 3.2/4.35 GHz · 256 MB L3 · DDR5-6400 · SP5 · 280 W",
        description:
          "The CPU currently in the proposal. IBM 9155-G04-validated Zen 5 (Turin) part — 2× per node = 128 cores.",
      },
      {
        id: "cpu-epyc-9654",
        name: "AMD EPYC 9654 96-Core",
        status: "not-in-proposal",
        price: "$11,805",
        spec: "96C/192T · 2.4/3.7 GHz · 384 MB L3 · DDR5-4800 · SP5 · 360 W",
        description:
          "Previous-gen Zen 4 (Genoa) max-core alternative — more cores at lower clocks.",
      },
      {
        id: "cpu-epyc-9755",
        name: "AMD EPYC 9755 128-Core",
        status: "not-in-proposal",
        price: "$12,984",
        spec: "128C/256T · 2.7/4.1 GHz · 512 MB L3 · DDR5-6400 · SP5 · 500 W",
        description:
          "Highest core count Zen 5. ⚠ 500 W TDP — requires the 3000 W PSU option.",
      },
      {
        id: "cpu-epyc-9575f",
        name: "AMD EPYC 9575F 64-Core",
        status: "not-in-proposal",
        price: "$10,176",
        spec: "64C/128T · 3.3/5.0 GHz · 512 MB L3 · DDR5-6400 · SP5 · 400 W",
        description:
          "High-frequency Zen 5 — best single-thread and inference latency.",
      },
      {
        id: "cpu-epyc-9965",
        name: "AMD EPYC 9965 192-Core",
        status: "not-in-proposal",
        price: "$14,813",
        spec: "192C/384T · 2.25/3.7 GHz · 384 MB L3 · DDR5-5600 · SP5 · 500 W",
        description:
          "Zen 5c dense for extreme parallelism. ⚠ 500 W TDP — requires the 3000 W PSU.",
      },
      {
        id: "cpu-xeon-6746p",
        name: "Intel Xeon 6746P 24-Core",
        status: "not-in-proposal",
        price: "$3,120",
        spec: "24C/48T · 2.8/3.9 GHz · 90 MB L3 · DDR5-5600 · LGA7529 · 195 W",
        description:
          "Granite Rapids option with AMX BF16. ⚠ LGA7529 ≠ SP5 — verify Lenovo ServerProven Intel SR675 V3 config.",
      },
    ],
    memory: [
      {
        id: "mem-96gb-6400-x12",
        name: "96 GB TruDDR5-6400 RDIMM ×12",
        status: "in-proposal",
        price: "$820",
        spec: "96 GB · DDR5-6400 · 2Rx4 · ECC · 12× = 1,152 GB/node",
        description:
          "The memory currently in the proposal. IBM power-table validated config for 9155-G04 + 4× H200 NVL.",
      },
      {
        id: "mem-96gb-6400-x24",
        name: "96 GB TruDDR5-6400 RDIMM ×24",
        status: "not-in-proposal",
        price: "$820",
        spec: "96 GB · DDR5-6400 · 24× = 2,304 GB/node",
        description: "Max-memory config — all 24 DIMM slots populated.",
      },
      {
        id: "mem-128gb-4800-x12",
        name: "128 GB DDR5-4800 RDIMM ×12",
        status: "not-in-proposal",
        price: "$2,100",
        spec: "128 GB · DDR5-4800 · 2Rx4 · 12× = 1,536 GB/node",
        description: "Higher-density alternative at a lower data rate.",
      },
      {
        id: "mem-64gb-5600-x12",
        name: "64 GB DDR5-5600 RDIMM ×12",
        status: "not-in-proposal",
        price: "$480",
        spec: "64 GB · DDR5-5600 · 2Rx4 · 12× = 768 GB/node",
        description: "Cost-saving option for lighter memory footprints.",
      },
    ],
    gpu: [
      {
        id: "gpu-h200-nvl",
        name: "NVIDIA H200 NVL 141 GB",
        status: "in-proposal",
        price: "$35,000",
        spec: "141 GB HBM3e · 4.8 TB/s · 835 TFLOPS FP16 · PCIe Gen5 · 350 W",
        description:
          "The GPU currently in the proposal. 4× per 4-DW node = 64 H200 NVL total, NVLink bridge between pairs.",
      },
      {
        id: "gpu-h100-nvl",
        name: "NVIDIA H100 NVL 94 GB",
        status: "not-in-proposal",
        price: "$28,000",
        spec: "94 GB HBM2e · 3.9 TB/s · 756 TFLOPS FP16 · PCIe Gen4 · 400 W",
        description:
          "Previous-gen Hopper — ~20% less performance at ~20% lower cost.",
      },
      {
        id: "gpu-l40s",
        name: "NVIDIA L40S 48 GB",
        status: "not-in-proposal",
        price: "$10,500",
        spec: "48 GB GDDR6 · 864 GB/s · 733 TFLOPS FP16 · PCIe Gen4 · 350 W",
        description:
          "Inference- and visual-AI-optimised; no NVLink, lower cost per node.",
      },
      {
        id: "gpu-gaudi3",
        name: "Intel Gaudi 3 96 GB",
        status: "not-in-proposal",
        price: "$19,000",
        spec: "96 GB HBM2e · 3.7 TB/s · 1835 TFLOPS BF16 · PCIe Gen5",
        description:
          "IBM-Intel partnership accelerator; requires the Habana SynapseAI stack.",
      },
    ],
    storage: [
      {
        id: "ssd-384-u2",
        name: "3.84 TB NVMe Gen4 U.2 (scratch)",
        status: "in-proposal",
        price: "$1,800",
        spec: "3.84 TB · NVMe Gen4 · U.2 2.5\" · AnyBay · 2×/node",
        description:
          "The scratch drive currently in the proposal. Uses 2 of 8 AnyBay bays.",
      },
      {
        id: "ssd-768-u2",
        name: "7.68 TB NVMe Gen4 U.2 (scratch)",
        status: "not-in-proposal",
        price: "$3,400",
        spec: "7.68 TB · NVMe Gen4 · U.2 2.5\" · AnyBay",
        description: "Double-capacity scratch per node.",
      },
      {
        id: "ssd-960-m2-boot",
        name: "960 GB M.2 NVMe (boot RAID-1)",
        status: "not-in-proposal",
        price: "$220",
        spec: "960 GB · M.2 2280 · PCIe Gen3 · RAID-1",
        description:
          "OS boot pair (also in the proposal alongside the scratch drives) — supported on all SR675 V3 models.",
      },
    ],
    network: [
      {
        id: "nic-cx7-ndr200",
        name: "NVIDIA ConnectX-7 NDR200 OCP 3.0",
        status: "in-proposal",
        price: "$2,800",
        spec: "2× 200 Gb/s NDR200 QSFP112 · PCIe Gen5 / OCP 3.0 · RoCEv2 + IB",
        description:
          "The NIC currently in the proposal. GPUDirect RDMA + SHARP; connects to the NDR spine.",
      },
      {
        id: "nic-cx7-ndr400",
        name: "NVIDIA ConnectX-7 NDR 400",
        status: "not-in-proposal",
        price: "$4,200",
        spec: "2× 400 Gb/s NDR QSFP112 · PCIe Gen5 x16",
        description: "Full NDR 400 Gb/s — highest host fabric bandwidth.",
      },
      {
        id: "nic-cx6-dx",
        name: "NVIDIA ConnectX-6 Dx 200 GbE",
        status: "not-in-proposal",
        price: "$1,200",
        spec: "2× 100 Gb/s HDR100 · PCIe Gen4 x16 · RoCEv2",
        description: "Cost-optimised Gen4 option; Gen5 slot is backwards compatible.",
      },
    ],
    power: [
      {
        id: "psu-2600w",
        name: "2600 W Titanium PSU ×4",
        status: "in-proposal",
        price: "$980",
        spec: "2600 W · 80+ Titanium · hot-swap · 2+2 redundant",
        description:
          "The PSU currently in the proposal. 4× = 10.4 kW capacity vs ~2.5 kW draw.",
      },
      {
        id: "psu-3000w",
        name: "3000 W Titanium PSU ×4",
        status: "not-in-proposal",
        price: "$1,150",
        spec: "3000 W · 80+ Titanium · hot-swap",
        description:
          "Required when selecting a 500 W TDP CPU (EPYC 9755 / 9965).",
      },
    ],
  },
  "management-nodes": {
    cpu: [
      {
        id: "mgmt-cpu-power10-20c",
        name: "IBM Power10 DCM 20-Core",
        status: "in-proposal",
        price: "$6,500",
        spec: "20C · 4.0 GHz · 120 MB L3/DCM · DDR4-3200 · 2× = 40 cores",
        description:
          "The CPU currently in the proposal. Standard S1022 dual-DCM config with on-chip AES/SHA.",
      },
      {
        id: "mgmt-cpu-power10-24c",
        name: "IBM Power10 DCM 24-Core",
        status: "not-in-proposal",
        price: "$8,200",
        spec: "24C · 3.7 GHz · 120 MB L3/DCM · DDR4-3200 · 2× = 48 cores",
        description: "Higher core-count Power10 for heavier control-plane loads.",
      },
    ],
    memory: [
      {
        id: "mgmt-mem-32gb-x16",
        name: "32 GB DDR4-3200 RDIMM ×16",
        status: "in-proposal",
        price: "$95",
        spec: "32 GB · DDR4-3200 · ECC · 16× = 512 GB/node",
        description:
          "The memory currently in the proposal. Native Power10 DDR4.",
      },
      {
        id: "mgmt-mem-64gb-x16",
        name: "64 GB DDR4-3200 RDIMM ×16",
        status: "not-in-proposal",
        price: "$180",
        spec: "64 GB · DDR4-3200 · ECC · 16× = 1,024 GB/node",
        description: "Double memory for heavy Db2 / IBM MQ workloads.",
      },
    ],
    storage: [
      {
        id: "mgmt-ssd-192",
        name: "1.92 TB IBM NVMe PCIe SSD",
        status: "in-proposal",
        price: "$900",
        spec: "1.92 TB · NVMe · hot-swap SFF · AIX/RHEL boot",
        description:
          "The drive currently in the proposal. Power S1022 validated; 2× per node.",
      },
    ],
    network: [
      {
        id: "mgmt-nic-25gbe",
        name: "IBM 2-Port 25 GbE RoCE (EC67H)",
        status: "in-proposal",
        price: "$1,800",
        spec: "2× 25 GbE SFP28 · RoCEv2 · PCIe 4.0 x8",
        description:
          "The NIC currently in the proposal. Power10-validated; connects to the Ethernet ToR.",
      },
      {
        id: "mgmt-nic-100gbe",
        name: "IBM 2-Port 100 GbE RoCE (EC68H)",
        status: "not-in-proposal",
        price: "$3,200",
        spec: "2× 100 GbE QSFP28 · RoCEv2 · PCIe 4.0 x16",
        description: "Higher-bandwidth management NIC option.",
      },
    ],
    power: [
      {
        id: "mgmt-psu-1600w",
        name: "IBM 1600 W Platinum PSU ×2",
        status: "in-proposal",
        price: "$850",
        spec: "1600 W · 80+ Platinum · hot-swap · N+N",
        description:
          "The PSU currently in the proposal. IBM standard for the Power S1022.",
      },
    ],
  },
  "nas-storage": {
    storage: [
      {
        id: "nas-ssd-768",
        name: "7.68 TB NVMe Gen5 E1.S ×24",
        status: "in-proposal",
        price: "$2,800",
        spec: "7.68 TB · NVMe Gen5 · E1.S · 24× = 184 TB raw/node",
        description:
          "The drive currently in the proposal. Half-populated (24/48 bays); 736 TB raw across 4 nodes.",
      },
      {
        id: "nas-ssd-1536",
        name: "15.36 TB NVMe Gen5 E1.S ×24",
        status: "not-in-proposal",
        price: "$5,200",
        spec: "15.36 TB · NVMe Gen5 · E1.S · 24× = 368 TB raw/node",
        description: "Double capacity per drive (~1.47 PB raw across 4 nodes).",
      },
      {
        id: "nas-ssd-3072",
        name: "30.72 TB NVMe Gen5 E1.S ×12",
        status: "not-in-proposal",
        price: "$9,200",
        spec: "30.72 TB · NVMe Gen5 · E1.S · 12× = 368 TB raw/node",
        description: "Max-density drives — fewer drives for the same capacity.",
      },
    ],
    network: [
      {
        id: "nas-nic-cx6-hdr100",
        name: "NVIDIA ConnectX-6 HDR100 IB",
        status: "in-proposal",
        price: "$1,800",
        spec: "2× 100 Gb/s HDR100 IB QSFP56 · PCIe Gen4 x16",
        description:
          "The client NIC currently in the proposal. IBM Scale 6000 standard; connects to the IB spine.",
      },
    ],
  },
};

/* -------------------------------------------------------------------------- */
/*  The project                                                                */
/* -------------------------------------------------------------------------- */

export const adgsaIbmProject: HardwareProject = {
  id: "adgsa-ibm-pod",
  name: "ADGSA-AI POD — IBM / Lenovo",
  clientName: "ADGSA",
  description:
    "AI-Powered Citizen Services Transformation (IBM + Lenovo OEM + NVIDIA) — 16× Lenovo SR675 V3 nodes with 64× NVIDIA H200 NVL GPUs, IBM Power10 control plane, IBM Storage Scale 6000 NVMe NAS and an NDR 400 Gb/s InfiniBand fabric.",
  industry: "Government",
  routePath: "/adgsa-ibm",
  leadScore: "9.8",
  grandTotalUSD: 5_455_600,
  subsystems,
  racks,
  subsystemCategories,
  productAlternatives,
  componentAlternatives,
};
