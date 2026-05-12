/**
 * Hardware configurator — fake data tree for the Avaya project.
 *
 * Every spec value is verbatim from the Avaya proposal BoQ.
 * Filter applied (assets ∩ proposal) → 5 component categories survive
 * on Screen C: CPU, Memory, Hard Drive / SSD, Network Card, Power.
 * See app/docs/features/hardware-configurator/DATA-ANALYSIS.md §13 / §8.1.
 */

import type {
  CatalogEntry,
  Chassis,
  HardwareComponent,
  HardwareProject,
  Rack,
  RackUnit,
  Subsystem,
} from "./types";

/* -------------------------------------------------------------------------- */
/*  Chassis specs                                                              */
/* -------------------------------------------------------------------------- */

/* Power numbers (watts) are typical-load placeholders for the demo —
 * good enough to make the hero card feel populated. BTU/hr is derived
 * inline on the Screen C hero (watts × 3.412). */

const r660Chassis: Chassis = {
  id: "chassis-r660",
  name: "Dell PowerEdge R660",
  vendor: "dell",
  sizeU: 1,
  image: "Server_Dell_01.png",
  description:
    "1U two-socket rack server for dense database analytics and high-density virtualization.",
  watts: 800,
};

const r760Chassis: Chassis = {
  id: "chassis-r760",
  name: "Dell PowerEdge R760",
  vendor: "dell",
  sizeU: 2,
  image: "Server_Dell_02.png",
  description:
    "2U two-socket rack server for mixed workload standardization, virtualization and analytics.",
  watts: 1100,
};

const unity380fChassis: Chassis = {
  id: "chassis-unity-380f",
  name: "Dell EMC Unity 380F",
  vendor: "dell",
  sizeU: 2,
  image: "Server_Dell_03.png",
  description:
    "2U dual-active-controller all-flash midrange storage array with 25 × 2.5\" drive slots.",
  watts: 600,
};

const ds6610bChassis: Chassis = {
  id: "chassis-ds-6610b",
  name: "Connectrix DS-6610B",
  vendor: "dell",
  sizeU: 1,
  image: "Server_Dell_04.png",
  description:
    "1U 24-port 16Gb Fibre Channel SAN switch, rear-to-front airflow, single PSU.",
  watts: 150,
};

const s5224fChassis: Chassis = {
  id: "chassis-s5224f",
  name: "Dell EMC S5224F-ON",
  vendor: "dell",
  sizeU: 1,
  image: "Server_Dell_04.png",
  description:
    "1U 24 × 25GbE SFP28 + 4 × 100GbE QSFP28 ToR switch, IO to PSU airflow, dual PSU.",
  watts: 200,
};

const n3248Chassis: Chassis = {
  id: "chassis-n3248",
  name: "Dell EMC N3248TE-ON",
  vendor: "dell",
  sizeU: 1,
  image: "Server_Dell_04.png",
  description:
    "1U 48 × 1GbE + 4 × 10G SFP+ + 2 × 100G QSFP28 management switch, single AC PSU.",
  watts: 120,
};

/* -------------------------------------------------------------------------- */
/*  Components per chassis                                                     */
/* -------------------------------------------------------------------------- */

const r660Components: HardwareComponent[] = [
  {
    id: "r660-cpu",
    category: "cpu",
    categoryLabel: "CPU",
    description:
      "Intel Xeon Gold 6548Y+ 2.5G, 32C/64T, 20GT/s, 60M Cache, Turbo, HT (250W) DDR5-5200",
    qty: 2,
  },
  {
    id: "r660-memory",
    category: "memory",
    categoryLabel: "Memory",
    description: "32GB RDIMM, 5600MT/s, Dual Rank",
    qty: 4,
  },
  {
    id: "r660-storage",
    category: "storage",
    categoryLabel: "Hard Drive / SSD",
    description:
      "480GB SSD SATA Read Intensive 6Gbps 512 2.5in Hot-plug AG Drive, 1 DWPD",
    qty: 2,
  },
  {
    id: "r660-nic-1",
    category: "network",
    categoryLabel: "Network Card",
    description: "Broadcom 57414 Dual Port 10/25GbE SFP28, OCP NIC 3.0",
    qty: 1,
  },
  {
    id: "r660-nic-2",
    category: "network",
    categoryLabel: "Network Card",
    description: "Broadcom 5720 Dual Port 1GbE LOM",
    qty: 1,
  },
  {
    id: "r660-power",
    category: "power",
    categoryLabel: "Power",
    description: "Dual, Hot-plug, Power Supply Redundant (1+1), 800W, Mixed Mode, NAF",
    qty: 1,
  },
];

const r760Components: HardwareComponent[] = [
  {
    id: "r760-cpu",
    category: "cpu",
    categoryLabel: "CPU",
    description:
      "Intel Xeon Platinum 8568Y+ 2.3G, 48C/96T, 20GT/s, 300M Cache, Turbo, HT (350W) DDR5-5600",
    qty: 2,
  },
  {
    id: "r760-memory",
    category: "memory",
    categoryLabel: "Memory",
    description: "32GB RDIMM, 5600MT/s, Dual Rank",
    qty: 8,
  },
  {
    id: "r760-storage",
    category: "storage",
    categoryLabel: "Hard Drive / SSD",
    description:
      "480GB SSD SATA Read Intensive 6Gbps 512 2.5in Hot-plug AG Drive, 1 DWPD",
    qty: 2,
  },
  {
    id: "r760-nic-1",
    category: "network",
    categoryLabel: "Network Card",
    description: "Broadcom 57414 Dual Port 10/25GbE SFP28, OCP NIC 3.0",
    qty: 1,
  },
  {
    id: "r760-nic-2",
    category: "network",
    categoryLabel: "Network Card",
    description: "Broadcom 5720 Dual Port 1GbE LOM",
    qty: 1,
  },
  {
    id: "r760-power",
    category: "power",
    categoryLabel: "Power",
    description: "Dual, Hot-plug, Power Supply Redundant (1+1), 800W, Mixed Mode, NAF",
    qty: 1,
  },
];

const unity380fComponents: HardwareComponent[] = [
  {
    id: "unity-storage",
    category: "storage",
    categoryLabel: "Hard Drive / SSD",
    description: "Unity F 3.84TB ALL FLASH 25X2.5 SSD",
    qty: 14,
  },
];

/* -------------------------------------------------------------------------- */
/*  Subsystems — 6 BoQ groups → 6 nav items                                    */
/* -------------------------------------------------------------------------- */

const subsystems: Subsystem[] = [
  {
    id: "hyper-v-cluster",
    name: "Hyper-v cluster",
    titleSuffix: "Hyper-v Cluster",
    kind: "compute",
    qty: 14,
    chassis: r660Chassis,
    components: r660Components,
  },
  {
    id: "vmware-cluster",
    name: "VMWare cluster",
    titleSuffix: "VMware Cluster",
    kind: "compute",
    qty: 2,
    chassis: r760Chassis,
    components: r760Components,
  },
  {
    id: "san-storage",
    name: "SAN Storage",
    titleSuffix: "SAN Storage",
    kind: "storage",
    qty: 1,
    chassis: unity380fChassis,
    components: unity380fComponents,
  },
  {
    id: "mgmt-switch",
    name: "Management Switch",
    titleSuffix: "Management Switch",
    kind: "switch",
    qty: 1,
    chassis: n3248Chassis,
    components: [],
  },
  {
    id: "tor-switches",
    name: "ToR Switches",
    titleSuffix: "ToR Switches",
    kind: "switch",
    qty: 2,
    chassis: s5224fChassis,
    components: [],
  },
  {
    id: "san-switches",
    name: "SAN Switches",
    titleSuffix: "SAN Switches",
    kind: "switch",
    qty: 2,
    chassis: ds6610bChassis,
    components: [],
  },
];

/* -------------------------------------------------------------------------- */
/*  Racks — U layout per DATA-ANALYSIS.md §8.1                                 */
/* -------------------------------------------------------------------------- */

/** Generate sequential same-size units for a server cluster, top-down.
 *  `startIndex` lets us split a single subsystem across multiple racks
 *  without colliding on unit IDs (e.g. half of the Hyper-v cluster in
 *  Rack 01 → 1..7, the other half in Rack 02 → 8..14). */
function fillCluster(
  subsystemId: string,
  count: number,
  startTopU: number,
  sizeU = 1,
  startIndex = 1,
): RackUnit[] {
  const units: RackUnit[] = [];
  for (let i = 0; i < count; i++) {
    const positionU = startTopU - i * sizeU - (sizeU - 1);
    units.push({
      id: `${subsystemId}-${startIndex + i}`,
      subsystemId,
      positionU,
      sizeU,
    });
  }
  return units;
}

/* Rack 01 — Hyper-v pod A + Shared storage, 12U used.
 *  U42        N3248TE-ON         (Management Switch)
 *  U41        S5224F-ON #1       (ToR Switches)
 *  U40        DS-6610B #1        (SAN Switches)
 *  U39..U33   R660 × 7           (Hyper-v cluster, half) — #1 topmost @ U39
 *  U32..U31   Unity 380F         (SAN Storage)           — 2U, positionU = 31
 *
 * The 14-node Hyper-v cluster is intentionally split across the two racks
 * so neither rack is overstuffed; the BoQ totals (14× R660, 1× Unity, etc.)
 * are unchanged.
 */
const rack01Units: RackUnit[] = [
  { id: "mgmt-switch-1", subsystemId: "mgmt-switch", positionU: 42, sizeU: 1 },
  { id: "tor-switches-1", subsystemId: "tor-switches", positionU: 41, sizeU: 1 },
  { id: "san-switches-1", subsystemId: "san-switches", positionU: 40, sizeU: 1 },
  ...fillCluster("hyper-v-cluster", 7, 39, 1, 1),
  { id: "san-storage-1", subsystemId: "san-storage", positionU: 31, sizeU: 2 },
];

/* Rack 02 — Hyper-v pod B + VMware, 13U used.
 *  U42        S5224F-ON #2       (ToR Switches)
 *  U41        DS-6610B #2        (SAN Switches)
 *  U40..U34   R660 × 7           (Hyper-v cluster, second half, #8 @ U40)
 *  U33..U32   R760 #1            (VMware cluster, 2U, positionU = 32)
 *  U31..U30   R760 #2            (VMware cluster, 2U, positionU = 30)
 */
const rack02Units: RackUnit[] = [
  { id: "tor-switches-2", subsystemId: "tor-switches", positionU: 42, sizeU: 1 },
  { id: "san-switches-2", subsystemId: "san-switches", positionU: 41, sizeU: 1 },
  ...fillCluster("hyper-v-cluster", 7, 40, 1, 8),
  { id: "vmware-cluster-1", subsystemId: "vmware-cluster", positionU: 32, sizeU: 2 },
  { id: "vmware-cluster-2", subsystemId: "vmware-cluster", positionU: 30, sizeU: 2 },
];

const racks: Rack[] = [
  {
    id: "rack-empty-left",
    name: "Empty Rack",
    shortLabel: "",
    heightU: 42,
    units: [],
    isEmpty: true,
  },
  {
    id: "rack-01",
    name: "Infrastructure Rack 01",
    shortLabel: "Infrastructure Rack 01",
    heightU: 42,
    units: rack01Units,
    isEmpty: false,
  },
  {
    id: "rack-02",
    name: "Infrastructure Rack 02",
    shortLabel: "Infrastructure Rack 02",
    heightU: 42,
    units: rack02Units,
    isEmpty: false,
  },
  {
    id: "rack-empty-right",
    name: "Empty Rack",
    shortLabel: "",
    heightU: 42,
    units: [],
    isEmpty: true,
  },
];

/* -------------------------------------------------------------------------- */
/*  Catalog — right sidebar                                                    */
/* -------------------------------------------------------------------------- */

/* Screen A/B catalog: subsystem-category cards with status badges.
 * "In proposal" = something in the Avaya BoQ matches it.
 * "Removed"     = customer used to want this but it was struck out.
 * "Not in proposal" = available to add later. */
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
    status: "removed",
    description:
      "The Server GPU subsystem is the part of a data center that uses special computer chips to speed up demanding tasks, like artificial intelligence and scientific calculations. These chips help the data center handle complex work more quickly and efficiently, making it easier to process large amounts of information.",
  },
  {
    id: "cat-management-node",
    name: "Management Node Server",
    status: "not-in-proposal",
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

/* Screen C catalog: per-subsystem alternative products. Hardcoded fake list
 * to make the right panel look populated, per Q-S5 / Q-S6. */
const productAlternatives: Record<string, CatalogEntry[]> = {
  "hyper-v-cluster": [
    {
      id: "alt-r660",
      name: "Dell PowerEdge R660",
      status: "in-proposal",
      description:
        "The chassis currently in the proposal. 1U dual-socket server for dense virtualization.",
    },
    {
      id: "alt-r6615",
      name: "Dell PowerEdge R6615",
      status: "not-in-proposal",
      description:
        "1U single-socket AMD EPYC server. Lower licensing footprint when per-core cost matters.",
    },
    {
      id: "alt-r6625",
      name: "Dell PowerEdge R6625",
      status: "not-in-proposal",
      description:
        "1U dual-socket AMD EPYC server. Higher core density alternative to the R660.",
    },
    {
      id: "alt-r670",
      name: "Dell PowerEdge R670",
      status: "not-in-proposal",
      description:
        "Next-generation 1U Intel Xeon server with PCIe 5 expansion and CXL memory support.",
    },
  ],
  "vmware-cluster": [
    {
      id: "alt-r760",
      name: "Dell PowerEdge R760",
      status: "in-proposal",
      description:
        "The chassis currently in the proposal. 2U dual-socket server for mixed workloads.",
    },
    {
      id: "alt-r760xa",
      name: "Dell PowerEdge R760xa",
      status: "not-in-proposal",
      description: "2U accelerator-optimized variant. Up to 4 double-wide GPUs.",
    },
    {
      id: "alt-r860",
      name: "Dell PowerEdge R860",
      status: "not-in-proposal",
      description: "4-socket 2U server for the largest in-memory and OLTP databases.",
    },
  ],
  "san-storage": [
    {
      id: "alt-unity-380f",
      name: "Dell EMC Unity 380F",
      status: "in-proposal",
      description:
        "The storage currently in the proposal. 2U all-flash midrange array.",
    },
    {
      id: "alt-unity-680f",
      name: "Dell EMC Unity 680F",
      status: "not-in-proposal",
      description: "Higher-tier all-flash variant with more cache and bandwidth.",
    },
    {
      id: "alt-powerstore-1200t",
      name: "Dell PowerStore 1200T",
      status: "not-in-proposal",
      description: "NVMe-first replacement family with active/active scale-out.",
    },
  ],
  "mgmt-switch": [
    {
      id: "alt-n3248",
      name: "Dell EMC N3248TE-ON",
      status: "in-proposal",
      description: "1U 48 × 1GbE management switch currently in the proposal.",
    },
    {
      id: "alt-n3208",
      name: "Dell EMC N3208PX-ON",
      status: "not-in-proposal",
      description: "8-port 1GbE PoE alternative for smaller management domains.",
    },
  ],
  "tor-switches": [
    {
      id: "alt-s5224f",
      name: "Dell EMC S5224F-ON",
      status: "in-proposal",
      description: "1U 24 × 25GbE ToR currently in the proposal.",
    },
    {
      id: "alt-s5248f",
      name: "Dell EMC S5248F-ON",
      status: "not-in-proposal",
      description: "1U 48 × 25GbE ToR for higher port density.",
    },
    {
      id: "alt-s5232f",
      name: "Dell EMC S5232F-ON",
      status: "not-in-proposal",
      description: "1U 32 × 100GbE spine/leaf alternative.",
    },
  ],
  "san-switches": [
    {
      id: "alt-ds-6610b",
      name: "Connectrix DS-6610B",
      status: "in-proposal",
      description:
        "24-port 16Gb FC SAN switch currently in the proposal, expanded with POD upgrade kits.",
    },
    {
      id: "alt-ds-7720b",
      name: "Connectrix DS-7720B",
      status: "not-in-proposal",
      description: "Higher-end 48-port 32Gb FC switch for larger SAN fabrics.",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  The project                                                                */
/* -------------------------------------------------------------------------- */

export const avayaProject: HardwareProject = {
  id: "avaya-ipo200",
  name: "Avaya POD Cluster – IPO200",
  leadScore: "9.6/10",
  grandTotalUSD: 644_475,
  subsystems,
  racks,
  subsystemCategories,
  productAlternatives,
};

/** The whole demo runs against this one constant. */
export const hardwareProject = avayaProject;
