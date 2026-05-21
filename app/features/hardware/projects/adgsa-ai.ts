/**
 * Hardware configurator — ADGSA-AI POD project data.
 *
 * Source of truth: `app/docs/features/adgsa-ai/01-DATA-ANALYSIS.md`
 *   - §3 Rack layout (5 racks; 4× AI Server + 1× Infrastructure centre)
 *   - §4 Per-node component specs (XE9680, R660, F710)
 *   - §5 Network fabric (SN5600, S5232F-ON, SN2201)
 *   - §9 Budget summary ($8,033,365 grand total)
 *   - §9b Six left-sidebar groups
 *
 * Filenames in `Chassis.image` resolve via `chassis-assets.ts`.
 */

import type {
  CatalogEntry,
  Chassis,
  HardwareComponent,
  HardwareProject,
  Rack,
  RackUnit,
  Subsystem,
} from "../types";

/* -------------------------------------------------------------------------- */
/*  Chassis specs                                                              */
/* -------------------------------------------------------------------------- */

const xe9680Chassis: Chassis = {
  id: "chassis-xe9680",
  name: "Dell PowerEdge XE9680",
  vendor: "dell",
  sizeU: 6,
  image: "PowerEdge-XE9680.png",
  description:
    "6U air-cooled AI training/inference server with 8× NVIDIA HGX H200 SXM5 GPUs (NVLink 4.0), dual Xeon Platinum, 2 TB DDR5 and 12.8 TB local NVMe.",
  watts: 8400,
};

const f710Chassis: Chassis = {
  id: "chassis-f710",
  name: "Dell PowerScale F710",
  vendor: "dell",
  sizeU: 1,
  image: "PowerScale-F710.png",
  description:
    "1U all-flash NVMe scale-out NAS node (OneFS) with 10× 3.84 TB NVMe and dual 100 GbE; building block for the 7-node cluster.",
  watts: 850,
};

const r660Chassis: Chassis = {
  id: "chassis-r660-adgsa",
  name: "Dell PowerEdge R660",
  vendor: "dell",
  sizeU: 1,
  image: "Dell-PowerEdge-R660.png",
  description:
    "1U two-socket rack server running the Kubernetes HA control plane, NVIDIA AI Enterprise, Rancher/OpenShift and observability stack.",
  watts: 800,
};

const s5232fChassis: Chassis = {
  id: "chassis-s5232f",
  name: "Dell PowerSwitch S5232F-ON",
  vendor: "dell",
  sizeU: 1,
  image: "PowerSwitch-S5232.png",
  description:
    "1U 32 × 100 GbE QSFP28 spine/leaf switch carrying the storage fabric between the F710 cluster and the GPU compute nodes.",
  watts: 350,
};

const sn2201Chassis: Chassis = {
  id: "chassis-sn2201",
  name: "NVIDIA SN2201",
  vendor: "nvidia",
  sizeU: 1,
  image: "Nvidia-SN2201.png",
  description:
    "1U 48 × 1 GbE + 4 × 10 GbE BASE-T switch dedicated to out-of-band iDRAC/BMC management of every node in the cluster.",
  watts: 130,
};

const sn5600Chassis: Chassis = {
  id: "chassis-sn5600",
  name: "NVIDIA Spectrum-4 SN5600",
  vendor: "nvidia",
  sizeU: 2,
  image: "NVIDIA Spectrum-4 SN5600.png",
  description:
    "2U 64 × OSFP 800 GbE Spectrum-4 GPU spine switch — RoCEv2 RDMA backbone for east-west traffic between the 16 XE9680 AI nodes.",
  watts: 1700,
};

/* -------------------------------------------------------------------------- */
/*  Components per chassis (verbatim from BoQ §4 / §5)                          */
/* -------------------------------------------------------------------------- */

const xe9680Components: HardwareComponent[] = [
  {
    id: "xe9680-cpu",
    category: "cpu",
    categoryLabel: "CPU",
    description:
      "Intel Xeon Platinum 8562Y+ 2.8G, 32C/64T, 20GT/s, 60M Cache, Turbo, HT (300W) DDR5-5600",
    qty: 2,
  },
  {
    id: "xe9680-memory",
    category: "memory",
    categoryLabel: "Memory",
    description: "128GB RDIMM DDR5-5600, Dual Rank",
    qty: 16,
  },
  {
    id: "xe9680-gpu",
    category: "gpu",
    categoryLabel: "GPU",
    description:
      "NVIDIA HGX H200 SXM5 141 GB HBM3e GPU on NVLink 4.0 baseboard (8× per chassis)",
    qty: 8,
  },
  {
    id: "xe9680-storage-boot",
    category: "storage",
    categoryLabel: "Hard Drive / SSD",
    description: "BOSS-N1 boot — 2 × 480 GB M.2 NVMe RAID 1",
    qty: 1,
  },
  {
    id: "xe9680-storage-data",
    category: "storage",
    categoryLabel: "Hard Drive / SSD",
    description:
      "1.6 TB NVMe Gen4 U.2 mixed-use 2.5\" hot-plug data drive (~12.8 TB local)",
    qty: 8,
  },
  {
    id: "xe9680-nic",
    category: "network",
    categoryLabel: "Network Card",
    description:
      "NVIDIA ConnectX-7 dual-port 400 GbE OSFP RDMA NIC (RoCEv2, GPUDirect)",
    qty: 2,
  },
  {
    id: "xe9680-dpu",
    category: "network",
    categoryLabel: "DPU",
    description:
      "NVIDIA BlueField-3 BF3140H 400 GbE DPU — per-node data-plane offload (installed on 8 of 16 nodes)",
    qty: 1,
  },
  {
    id: "xe9680-power",
    category: "power",
    categoryLabel: "Power",
    description: "2800 W Titanium hot-plug AC PSU (2+1 redundant)",
    qty: 3,
  },
];

const r660Components: HardwareComponent[] = [
  {
    id: "r660-mgmt-cpu",
    category: "cpu",
    categoryLabel: "CPU",
    description:
      "Intel Xeon Gold 6526Y 2.8G, 16C/32T, 20GT/s, 37.5M Cache, Turbo, HT (195W) DDR5-5200",
    qty: 2,
  },
  {
    id: "r660-mgmt-memory",
    category: "memory",
    categoryLabel: "Memory",
    description: "32GB RDIMM DDR5-5600, Dual Rank",
    qty: 16,
  },
  {
    id: "r660-mgmt-storage-boot",
    category: "storage",
    categoryLabel: "Hard Drive / SSD",
    description: "BOSS-N1 boot — 2 × 480 GB M.2 NVMe RAID 1",
    qty: 1,
  },
  {
    id: "r660-mgmt-storage-data",
    category: "storage",
    categoryLabel: "Hard Drive / SSD",
    description:
      "3.84 TB NVMe Gen4 U.2 read-intensive 2.5\" hot-plug drive (15.36 TB local)",
    qty: 4,
  },
  {
    id: "r660-mgmt-nic",
    category: "network",
    categoryLabel: "Network Card",
    description:
      "Mellanox ConnectX-6 Dx dual-port 100 GbE SFP28 (RoCEv2 cluster mgmt)",
    qty: 1,
  },
  {
    id: "r660-mgmt-power",
    category: "power",
    categoryLabel: "Power",
    description: "1400 W Titanium hot-plug AC PSU (1+1 redundant)",
    qty: 2,
  },
];

const f710Components: HardwareComponent[] = [
  {
    id: "f710-cpu",
    category: "cpu",
    categoryLabel: "CPU",
    description:
      "Intel Xeon Scalable 24-core 2.6 GHz (OEM factory config, PowerScale OneFS bundle)",
    qty: 2,
  },
  {
    id: "f710-memory",
    category: "memory",
    categoryLabel: "Memory",
    description: "512 GB DDR5 (OEM factory config)",
    qty: 1,
  },
  {
    id: "f710-storage",
    category: "storage",
    categoryLabel: "Hard Drive / SSD",
    description:
      "3.84 TB NVMe TLC SSD — 38.4 TB raw per node, ~268.8 TB cluster raw across 7 nodes",
    qty: 10,
  },
  {
    id: "f710-nic",
    category: "network",
    categoryLabel: "Network Card",
    description:
      "Dual-port 100 GbE SFP28 storage NIC for the S5232F-ON storage fabric",
    qty: 1,
  },
  {
    id: "f710-power",
    category: "power",
    categoryLabel: "Power",
    description: "1400 W Titanium hot-plug AC PSU (1+1 redundant)",
    qty: 2,
  },
];

/* Switches: show no component rows on Screen C — matches the Avaya
 * Management/ToR/SAN switch pattern. */
const switchComponents: HardwareComponent[] = [];

/* -------------------------------------------------------------------------- */
/*  Subsystems — 6 confirmed nav groups (BoQ analysis §9b)                     */
/* -------------------------------------------------------------------------- */

const subsystems: Subsystem[] = [
  {
    id: "ai-gpu-cluster",
    name: "AI GPU Cluster",
    titleSuffix: "AI GPU Cluster",
    kind: "compute",
    qty: 16,
    chassis: xe9680Chassis,
    components: xe9680Components,
  },
  {
    id: "nas-storage",
    name: "NAS Storage",
    titleSuffix: "NAS Storage",
    kind: "storage",
    qty: 7,
    chassis: f710Chassis,
    components: f710Components,
  },
  {
    id: "management-nodes",
    name: "Management Nodes",
    titleSuffix: "Management Nodes",
    kind: "compute",
    qty: 3,
    chassis: r660Chassis,
    components: r660Components,
  },
  {
    id: "storage-switches",
    name: "Storage Switches",
    titleSuffix: "Storage Switches",
    kind: "switch",
    qty: 2,
    chassis: s5232fChassis,
    components: switchComponents,
  },
  {
    id: "tor-switches",
    name: "ToR Switches",
    titleSuffix: "ToR Switches",
    kind: "switch",
    qty: 2,
    chassis: sn2201Chassis,
    components: switchComponents,
  },
  {
    id: "ai-fabric-switches",
    name: "AI Fabric Switches",
    titleSuffix: "AI Fabric Switches",
    kind: "switch",
    qty: 3,
    chassis: sn5600Chassis,
    components: switchComponents,
  },
];

/* -------------------------------------------------------------------------- */
/*  Racks — 5-rack layout per data analysis §3                                  */
/* -------------------------------------------------------------------------- */

/**
 * AI rack U layout (Racks 1, 2, 4, 5).
 *
 * Hardware spec: the XE9680 is a 6 U chassis (kept on `xe9680Chassis.sizeU`
 * — that's the BoQ truth, don't change it).  On the canvas, however,
 * each chassis is RENDERED at 5 U with a 2 U airflow gap between
 * neighbours, so the rack reads as a calmer "stacked-deck" instead of
 * a solid block of six-U units glued together.
 *
 * Layout (bottom → top, 5 U per unit + 2 U gap):
 *   - Unit #1: U8  → U12   (gap: U13–U14)
 *   - Unit #2: U15 → U19   (gap: U20–U21)
 *   - Unit #3: U22 → U26   (gap: U27–U28)
 *   - Unit #4: U29 → U33
 *
 * `startIndex` lets the same `ai-gpu-cluster` subsystem be split
 * across all four AI racks without RackUnit id collisions.
 */
function aiRackUnits(startIndex: number): RackUnit[] {
  const units: RackUnit[] = [];
  const bottoms = [8, 15, 22, 29];
  for (let i = 0; i < bottoms.length; i++) {
    units.push({
      id: `ai-gpu-cluster-${startIndex + i}`,
      subsystemId: "ai-gpu-cluster",
      positionU: bottoms[i],
      sizeU: 5,
    });
  }
  return units;
}

/**
 * Infrastructure (centre) rack — bottom→top:
 *   U9-15  : 7× F710                       (NAS Storage)
 *   U21-22 : 2× S5232F-ON                  (Storage Switches)
 *   U24-29 : 3× SN5600 (2U each, stacked)  (AI Fabric Switches)
 *   U33-35 : 3× R660                       (Management Nodes)
 *   U37-38 : 2× SN2201                     (ToR Switches)
 */
function infraRackUnits(): RackUnit[] {
  const units: RackUnit[] = [];
  for (let i = 0; i < 7; i++) {
    units.push({
      id: `nas-storage-${i + 1}`,
      subsystemId: "nas-storage",
      positionU: 9 + i,
      sizeU: 1,
    });
  }
  for (let i = 0; i < 2; i++) {
    units.push({
      id: `storage-switches-${i + 1}`,
      subsystemId: "storage-switches",
      positionU: 21 + i,
      sizeU: 1,
    });
  }
  for (let i = 0; i < 3; i++) {
    units.push({
      id: `ai-fabric-switches-${i + 1}`,
      subsystemId: "ai-fabric-switches",
      positionU: 24 + i * 2,
      sizeU: 2,
    });
  }
  for (let i = 0; i < 3; i++) {
    units.push({
      id: `management-nodes-${i + 1}`,
      subsystemId: "management-nodes",
      positionU: 33 + i,
      sizeU: 1,
    });
  }
  for (let i = 0; i < 2; i++) {
    units.push({
      id: `tor-switches-${i + 1}`,
      subsystemId: "tor-switches",
      positionU: 37 + i,
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

/* Screen A/B catalog: same six subsystem categories as Avaya, but with
 * statuses flipped to reflect the ADGSA-AI proposal scope (per data
 * analysis §13 / Q6). */
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

/* Screen C catalog: per-subsystem alternative products. v1 mirrors the
 * Avaya shape — one in-proposal entry plus a few "not in proposal"
 * suggestions to make the panel feel populated. PM review later. */
const productAlternatives: Record<string, CatalogEntry[]> = {
  "ai-gpu-cluster": [
    {
      id: "alt-xe9680",
      name: "Dell PowerEdge XE9680",
      status: "in-proposal",
      description:
        "The chassis currently in the proposal. 6U air-cooled XE9680 with 8× NVIDIA H200 SXM5 GPUs, NVLink 4.0 and dual Xeon Platinum 8562Y+.",
    },
    {
      id: "alt-xe9680l",
      name: "Dell PowerEdge XE9680L",
      status: "not-in-proposal",
      description:
        "Liquid-cooled variant of the XE9680 — same 8× H200 SXM5 GPUs at higher sustained clocks; requires CDU + rear-door heat-exchanger.",
    },
    {
      id: "alt-xe9712",
      name: "Dell PowerEdge XE9712",
      status: "not-in-proposal",
      description:
        "Next-generation rack-scale Blackwell GB200 NVL72 system — extreme throughput tier for very-large model training.",
    },
    {
      id: "alt-r760xa",
      name: "Dell PowerEdge R760xa",
      status: "not-in-proposal",
      description:
        "2U accelerator-optimized PCIe alternative — up to 4 double-wide H100/H200 PCIe GPUs per node for smaller inference fleets.",
    },
  ],
  "nas-storage": [
    {
      id: "alt-f710",
      name: "Dell PowerScale F710",
      status: "in-proposal",
      description:
        "The chassis currently in the proposal. 1U all-flash NVMe OneFS scale-out NAS — 10× 3.84 TB per node, dual 100 GbE.",
    },
    {
      id: "alt-f910",
      name: "Dell PowerScale F910",
      status: "not-in-proposal",
      description:
        "Top-of-line all-NVMe variant. Higher per-node throughput and capacity for very-large training corpora.",
    },
    {
      id: "alt-powerscale-h710",
      name: "Dell PowerScale H710",
      status: "not-in-proposal",
      description:
        "Hybrid HDD + SSD scale-out NAS — lower $/TB tier for archived/cold AI datasets.",
    },
  ],
  "management-nodes": [
    {
      id: "alt-r660-mgmt",
      name: "Dell PowerEdge R660",
      status: "in-proposal",
      description:
        "The chassis currently in the proposal. 1U dual-socket Xeon Gold node for the Kubernetes HA control plane.",
    },
    {
      id: "alt-r6615",
      name: "Dell PowerEdge R6615",
      status: "not-in-proposal",
      description:
        "1U single-socket AMD EPYC alternative — lower per-core licensing footprint if NVAIE scaling becomes the cost gate.",
    },
    {
      id: "alt-r6625",
      name: "Dell PowerEdge R6625",
      status: "not-in-proposal",
      description:
        "1U dual-socket AMD EPYC alternative — higher core density for the orchestration plane.",
    },
  ],
  "storage-switches": [
    {
      id: "alt-s5232f",
      name: "Dell PowerSwitch S5232F-ON",
      status: "in-proposal",
      description:
        "The switch currently in the proposal. 1U 32× 100 GbE QSFP28 spine carrying the F710 storage fabric.",
    },
    {
      id: "alt-z9432f",
      name: "Dell PowerSwitch Z9432F-ON",
      status: "not-in-proposal",
      description:
        "1U 32× 400 GbE QSFP56-DD spine for future PowerScale F910 / 400 GbE storage upgrades.",
    },
    {
      id: "alt-s5248f",
      name: "Dell EMC S5248F-ON",
      status: "not-in-proposal",
      description:
        "1U 48 × 25 GbE leaf — cheaper alternative if storage traffic ever shifts off 100 GbE.",
    },
  ],
  "tor-switches": [
    {
      id: "alt-sn2201",
      name: "NVIDIA SN2201",
      status: "in-proposal",
      description:
        "The switch currently in the proposal. 1U 48× 1 GbE + 4× 10 GbE BASE-T OOB management for iDRAC/BMC.",
    },
    {
      id: "alt-n3248te",
      name: "Dell EMC N3248TE-ON",
      status: "not-in-proposal",
      description:
        "1U 48× 1 GbE Dell-branded OOB management alternative — same role, single-vendor support model.",
    },
  ],
  "ai-fabric-switches": [
    {
      id: "alt-sn5600",
      name: "NVIDIA Spectrum-4 SN5600",
      status: "in-proposal",
      description:
        "The switch currently in the proposal. 2U 64× OSFP 800 GbE Spectrum-4 spine for the GPU east-west RoCEv2 fabric.",
    },
    {
      id: "alt-quantum-2-qm9700",
      name: "NVIDIA Quantum-2 QM9700",
      status: "not-in-proposal",
      description:
        "InfiniBand NDR 400 Gb/s alternative — preferred when very-large training jobs need lossless IB instead of RoCEv2.",
    },
    {
      id: "alt-sn5400",
      name: "NVIDIA Spectrum-4 SN5400",
      status: "not-in-proposal",
      description:
        "1U 64× QSFP-DD 400 GbE step-down for clusters that don't need the full 800 GbE per-port headroom.",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  The project                                                                */
/* -------------------------------------------------------------------------- */

export const adgsaProject: HardwareProject = {
  id: "adgsa-ai-pod",
  name: "ADGSA-AI POD",
  clientName: "ADGSA",
  description:
    "AI-Powered Citizen Services Transformation — distributed AI compute cluster (128× H200 GPUs across 16× XE9680 nodes, NAS storage, multi-tier RoCEv2 fabric).",
  industry: "Government",
  routePath: "/adgsa-ai",
  leadScore: "9.8",
  grandTotalUSD: 8_033_365,
  subsystems,
  racks,
  subsystemCategories,
  productAlternatives,
};
