/**
 * Hardware configurator — right-sidebar Catalog data.
 *
 * Primary source: `dell_infrastructure_sku_master.xlsx`, extracted into
 *   app/docs/features/hardware-configurator/DELL-INFRASTRUCTURE-SKU-CATALOG.md
 *
 * A handful of entries are **NOT** in that xlsx but are still required so
 * the right panel can highlight the proposal SKU at every level:
 *
 *  - **S5224F-ON** — ToR switch used in the Avaya BoQ. The xlsx switch
 *    sheet only contains S5248F-ON and S5296F-ON; we add S5224F-ON
 *    explicitly. Note the description's "(per proposal)" tag.
 *  - **Connectrix DS-6610B / DS-7720B** — Fibre Channel SAN switches.
 *    The xlsx is Ethernet-only, so we maintain a small dedicated
 *    `sanSwitches` catalog instead of mixing FC into PowerSwitches.
 *  - **Fake ToR alternatives** — the xlsx S5296F-ON / S5248F-ON are real
 *    but we trimmed the list to the entries that meaningfully compete
 *    against the 24-port S5224F-ON.
 *
 * Every catalog entry is a fully populated `CatalogEntry` so the same
 * `<CatalogEntryCard>` can render L0 / L1 / L2 with one visual language.
 */

import type { CatalogEntry, ComponentCategory } from "./types";

/* -------------------------------------------------------------------------- */
/*  Hyper-V cluster servers — Sheet "Hyper-V Cluster"                          */
/* -------------------------------------------------------------------------- */

const hyperVServers: CatalogEntry[] = [
  {
    id: "hv-r660",
    name: "Dell PowerEdge R660",
    status: "in-proposal",
    bestFor: "Dense compute nodes",
    spec: "1U · 2S Xeon 5th/6th Gen · 2TB DDR5 · 10× 2.5\"",
    description:
      "Ultra-dense 1U two-socket rack server for high-density virtualization and Hyper-V compute nodes. Supports up to 2TB DDR5 across 16 DIMM slots and dual Xeon Scalable 5th Gen CPUs. Low 1U footprint makes it ideal for maximizing host count in standard racks.",
    price: "~$4,500",
  },
  {
    id: "hv-r760",
    name: "Dell PowerEdge R760",
    status: "not-in-proposal",
    bestFor: "General Hyper-V cluster",
    spec: "2U · 2S Xeon 5th/6th Gen · 8TB DDR5 · 16× 2.5\"",
    description:
      "Versatile 2U two-socket server optimized for mixed workloads including Hyper-V and S2D (Storage Spaces Direct) clusters. Provides up to 8TB DDR5 across 32 DIMM slots and extensive PCIe 5.0 expansion. Strong balance of compute, memory, and local storage for mid-size clusters.",
    price: "~$6,200",
  },
  {
    id: "hv-r760xa",
    name: "Dell PowerEdge R760xa",
    status: "not-in-proposal",
    bestFor: "GPU-accelerated Hyper-V",
    spec: "2U · 2S Xeon 5th Gen · 8TB DDR5 · 4× GPU bays",
    description:
      "2U two-socket GPU-accelerated server supporting up to four double-width GPUs alongside standard Hyper-V VMs. Ideal for clusters running mixed GPU-enabled and standard workloads. Equipped with PCIe 5.0 and OCP 3.0 networking for high-bandwidth VM traffic.",
    price: "~$9,000",
  },
  {
    id: "hv-r860",
    name: "Dell PowerEdge R860",
    status: "not-in-proposal",
    bestFor: "Memory-heavy Hyper-V hosts",
    spec: "2U · 4S Xeon 5th Gen · 24TB DDR5 · 96 DIMM slots",
    description:
      "High-density 2U four-socket server delivering up to 24TB DDR5 across 96 DIMM slots — ideal for large Hyper-V deployments consolidating hundreds of VMs per host. Supports up to four 5th Gen Intel Xeon Scalable CPUs for extreme core density. Designed for enterprise environments requiring maximum memory per RU.",
    price: "~$18,000",
  },
  {
    id: "hv-r960",
    name: "Dell PowerEdge R960",
    status: "not-in-proposal",
    bestFor: "Enterprise-scale clusters",
    spec: "4U · 4S Xeon 5th Gen · 24TB DDR5 · 24× 2.5\"",
    description:
      "Flagship 4U four-socket platform for enterprise-scale Hyper-V clusters demanding massive core counts and memory. Supports up to 112 cores (4× 28-core CPUs) and 24TB DDR5 with 96 DIMM slots. Offers the highest local storage capacity among rack servers with up to 24 hot-plug drives.",
    price: "~$25,000",
  },
  {
    id: "hv-r750xs",
    name: "Dell PowerEdge R750xs",
    status: "not-in-proposal",
    bestFor: "Mid-range clusters",
    spec: "2U · 2S Xeon 4th Gen · 4TB DDR5 · 24 DIMM slots",
    description:
      "Streamlined 2U two-socket server offering a cost-efficient entry point for Hyper-V clusters with a focus on simplicity. Provides 24 DIMM slots for up to 4TB DDR5 and flexible storage configurations in 2.5\" or 3.5\" formats. Excellent choice for branch-office or SMB Hyper-V deployments.",
    price: "~$5,200",
  },
  {
    id: "hv-r550",
    name: "Dell PowerEdge R550",
    status: "not-in-proposal",
    bestFor: "Storage-rich Hyper-V hosts",
    spec: "2U · 2S Xeon 4th Gen · 2TB DDR4/5 · 16 hot-plug bays",
    description:
      "2U two-socket rack server balancing compute and storage for Hyper-V clusters utilizing local storage. Supports up to 16 hot-plug drives, making it strong for S2D (Storage Spaces Direct) configurations. Up to 2TB DDR4 across 16 DIMM slots with 3rd/4th Gen Xeon support.",
    price: "~$3,800",
  },
  {
    id: "hv-r450",
    name: "Dell PowerEdge R450",
    status: "not-in-proposal",
    bestFor: "Edge / remote Hyper-V",
    spec: "1U · 2S Xeon 4th Gen · 1TB DDR4/5 · 8× 2.5\"",
    description:
      "Compact 1U two-socket server for edge deployments and small Hyper-V clusters in remote offices. Supports up to 1TB RAM and 8 hot-plug 2.5\" drives with a low-noise, low-power profile. Ideal when rack space and power budget are primary constraints.",
    price: "~$3,200",
  },
  {
    id: "hv-mx750c",
    name: "Dell PowerEdge MX750c",
    status: "not-in-proposal",
    bestFor: "Blade Hyper-V clusters",
    spec: "Blade · 2S Xeon 5th Gen · 8TB DDR5 · MX7000 fabric",
    description:
      "Full-width blade compute module for MX7000 modular chassis, delivering two-socket performance in blade form. Shares chassis fabric, networking, and power across up to 8 blades for streamlined cabling and management. Ideal for large data centers standardizing on modular infrastructure for Hyper-V.",
    price: "~$7,500",
  },
  {
    id: "hv-r660xs",
    name: "Dell PowerEdge R660xs",
    status: "not-in-proposal",
    bestFor: "SMB dense Hyper-V",
    spec: "1U · 2S Xeon 5th Gen · 2TB DDR5 · 12 DIMM slots",
    description:
      "Entry-level 1U two-socket server for small-to-medium Hyper-V deployments requiring density without premium pricing. Supports 12 DIMM slots for up to 2TB DDR5 and six hot-plug 2.5\" drives for local OS and VM storage. Simplified design with iDRAC 10 for streamlined remote management.",
    price: "~$3,600",
  },
];

/* -------------------------------------------------------------------------- */
/*  VMware cluster servers — Sheet "VMware Cluster"                            */
/* -------------------------------------------------------------------------- */

const vmwareServers: CatalogEntry[] = [
  {
    id: "vm-r760",
    name: "Dell PowerEdge R760",
    status: "in-proposal",
    bestFor: "General ESXi cluster",
    spec: "2U · 2S Xeon 5th/6th Gen · 8TB DDR5 · vSAN ReadyNode",
    description:
      "Industry-standard 2U two-socket server and the most popular VMware vSphere ESXi host platform. Supports up to 32 DDR5 DIMMs (8TB), PCIe 5.0 expansion, and OCP 3.0 networking for flexible NIC options. Certified for VMware vSAN and vSphere 8, making it the go-to choice for general VMware clusters.",
    price: "~$6,200",
  },
  {
    id: "vm-r760xa",
    name: "Dell PowerEdge R760xa",
    status: "not-in-proposal",
    bestFor: "GPU VM / VDI clusters",
    spec: "2U · 2S Xeon 5th Gen · 8TB DDR5 · 4× GPU bays",
    description:
      "Accelerated 2U two-socket server supporting up to 4 GPUs for VMware vSphere environments running GPU-enabled workloads or Horizon VDI. Full VMware HCL certification with support for vGPU profiles via NVIDIA AI Enterprise. Suitable for mixed clusters combining standard VMs with GPU-accelerated workloads.",
    price: "~$9,000",
  },
  {
    id: "vm-r860",
    name: "Dell PowerEdge R860",
    status: "not-in-proposal",
    bestFor: "Max density vSphere hosts",
    spec: "2U · 4S Xeon 5th Gen · 24TB DDR5 · 96 DIMM slots",
    description:
      "Four-socket 2U powerhouse providing 96 DIMM slots (24TB DDR5) for ultra-dense VMware consolidation. Enables running 500+ VMs per host in memory-optimized configurations, reducing cluster node count and licensing costs. VMware vSAN ReadyNode certified for hyper-converged VMware deployments.",
    price: "~$18,000",
  },
  {
    id: "vm-r960",
    name: "Dell PowerEdge R960",
    status: "not-in-proposal",
    bestFor: "Mission-critical vSphere",
    spec: "4U · 4S Xeon 5th Gen · 24TB DDR5 · 24 hot-plug drives",
    description:
      "Enterprise 4U four-socket server designed for the most demanding VMware workloads requiring extreme core counts and local storage. Supports 24 hot-plug drives for vSAN configurations and up to 24TB DDR5. Ideal for database, SAP, and ERP virtualization on VMware.",
    price: "~$25,000",
  },
  {
    id: "vm-r750",
    name: "Dell PowerEdge R750",
    status: "not-in-proposal",
    bestFor: "vSAN-ready cluster nodes",
    spec: "2U · 2S Xeon 4th Gen · 4TB DDR4/5 · 26× 2.5\"",
    description:
      "Versatile 2U two-socket server featuring up to 26 hot-plug drive bays — among the highest in its class — making it ideal for vSAN all-flash or hybrid tiers. Supports 24 DIMM slots for up to 4TB memory and broad PCIe 4.0 expansion. VMware vSAN ReadyNode certified with NVMe-first drive support.",
    price: "~$5,800",
  },
  {
    id: "vm-r750xs",
    name: "Dell PowerEdge R750xs",
    status: "not-in-proposal",
    bestFor: "Cost-efficient ESXi nodes",
    spec: "2U · 2S Xeon 4th/5th Gen · 4TB DDR5 · 24 DIMM slots",
    description:
      "Streamlined 2U two-socket server delivering essential VMware capabilities at a lower price point. Certified for vSphere 8 and vSAN, with 24 DIMM slots and flexible drive configurations. Well-suited for SMB VMware environments, remote data centers, and budget-conscious expansion.",
    price: "~$5,200",
  },
  {
    id: "vm-r660",
    name: "Dell PowerEdge R660",
    status: "not-in-proposal",
    bestFor: "Dense ESXi node clusters",
    spec: "1U · 2S Xeon 5th/6th Gen · 2TB DDR5 · 10× 2.5\"",
    description:
      "High-density 1U platform enabling more VMware ESXi hosts per rack unit than any other 2-socket Dell server. Supports 16 DDR5 DIMM slots and ten 2.5\" drives for local VM storage. Ideal for large VMware farms where maximizing host density per rack is a priority.",
    price: "~$4,500",
  },
  {
    id: "vm-mx750c",
    name: "Dell PowerEdge MX750c",
    status: "not-in-proposal",
    bestFor: "Blade VMware clusters",
    spec: "Blade · 2S Xeon 5th Gen · 8TB DDR5 · MX7000 fabric",
    description:
      "Full-width MX7000 blade compute module delivering two-socket VMware performance with unified chassis fabric. Eliminates top-of-rack switch cabling complexity and simplifies VMware lifecycle management via OpenManage. VMware vSphere certified with direct integration for vSAN HCI configurations.",
    price: "~$7,500",
  },
  {
    id: "vm-r550",
    name: "Dell PowerEdge R550",
    status: "not-in-proposal",
    bestFor: "Entry vSphere + vSAN",
    spec: "2U · 2S Xeon 4th Gen · 2TB DDR4/5 · 16 bays",
    description:
      "Entry-level 2U two-socket server combining adequate VMware compute with generous drive bay count for local vSAN storage. Up to 16 hot-plug drives support tiered vSAN configurations without external shared storage. A cost-effective starting point for 3-node or 4-node VMware clusters.",
    price: "~$3,800",
  },
  {
    id: "vm-xe8545",
    name: "Dell PowerEdge XE8545",
    status: "not-in-proposal",
    bestFor: "AMD EPYC VMware + AI",
    spec: "4U · 2S AMD EPYC 3rd Gen · 4TB DDR4 · 4× NVMe",
    description:
      "4U two-socket AMD EPYC-based server optimized for VMware deployments requiring high core density with up to 4 NVIDIA GPUs. Supports up to 128 EPYC cores and 4 double-width GPUs for AI-assisted VMware workloads. Ideal where AMD EPYC's large memory bandwidth and PCIe lane counts provide an advantage.",
    price: "~$14,000",
  },
];

/* -------------------------------------------------------------------------- */
/*  SAN storage — Sheet "SAN Storage"                                          */
/* -------------------------------------------------------------------------- */

const sanArrays: CatalogEntry[] = [
  {
    id: "san-unity-380f",
    name: "Dell EMC Unity XT 380F",
    status: "in-proposal",
    bestFor: "Mid-range all-flash",
    spec: "All-Flash · 11.5 PB · 250 NVMe/SAS · FC/iSCSI/NFS/SMB",
    description:
      "Entry-level all-flash Unity XT array designed for mixed file and block workloads in mid-range environments. Supports up to 250 flash drives with dual-active controllers for 99.9999% availability. Ideal for VMware, Hyper-V, and Oracle workloads requiring consistent low-latency storage.",
    price: "~$55,000",
  },
  {
    id: "san-unity-480f",
    name: "Dell EMC Unity XT 480F",
    status: "not-in-proposal",
    bestFor: "Mid-range scale-out flash",
    spec: "All-Flash · 16 PB · 500 NVMe/SAS · Multi-cloud tiering",
    description:
      "Larger Unity XT all-flash platform offering double the drive capacity and host count versus the 380F model. Features non-disruptive upgrades, Always-On encryption, and native multi-cloud tiering to AWS/Azure. Well-suited for consolidating multiple storage islands into a single unified platform.",
    price: "~$90,000",
  },
  {
    id: "san-unity-680f",
    name: "Dell EMC Unity XT 680F",
    status: "not-in-proposal",
    bestFor: "High-end unified flash",
    spec: "All-Flash · 24 PB · 750 NVMe/SAS · SAP HANA certified",
    description:
      "Top-of-range Unity XT array offering maximum capacity and host scalability for large enterprise environments. Supports unified NAS and block SAN on a single system, with inline deduplication and compression delivering up to 5:1 data reduction. Certified for SAP HANA, Oracle, and Microsoft SQL Server.",
    price: "~$150,000",
  },
  {
    id: "san-powerstore-500t",
    name: "Dell PowerStore 500T",
    status: "not-in-proposal",
    bestFor: "Entry AI-driven flash",
    spec: "All-NVMe · 2.5 PB · 80 NVMe drives · AppsON",
    description:
      "Entry-level PowerStore appliance with AppsON capability to run VMware VMs directly on the array controller. Features always-on inline compression and deduplication with predictive analytics via CloudIQ. Excellent starting point for organizations modernizing from hybrid arrays to all-NVMe.",
    price: "~$35,000",
  },
  {
    id: "san-powerstore-1200t",
    name: "Dell PowerStore 1200T",
    status: "not-in-proposal",
    bestFor: "Mid-range NVMe flash",
    spec: "All-NVMe · 7.6 PB · 250 NVMe · Scale-out (up to 4 nodes)",
    description:
      "Mid-range PowerStore platform delivering NVMe-first performance with autonomous data management powered by machine learning. Supports scale-out federation with up to 4 nodes and seamless workload migration between nodes without downtime. Strong fit for tier-1 databases and virtual desktop infrastructure.",
    price: "~$75,000",
  },
  {
    id: "san-powerstore-3200t",
    name: "Dell PowerStore 3200T",
    status: "not-in-proposal",
    bestFor: "High-end NVMe flash",
    spec: "All-NVMe · 22.8 PB · 1,500 NVMe · <500µs latency",
    description:
      "High-performance PowerStore node supporting the largest workloads with up to 22.8 PB raw capacity per node in a scale-out cluster. Delivers sub-500µs latency under sustained load with intelligent storage tiering across NVMe tiers. Purpose-built for enterprise databases, ERP systems, and AI/ML data pipelines.",
    price: "~$220,000",
  },
  {
    id: "san-me5024",
    name: "Dell PowerVault ME5024",
    status: "not-in-proposal",
    bestFor: "Departmental block SAN",
    spec: "Block · 3.84 PB · 24 SAS/NVMe SSD · FC 16Gbps + iSCSI",
    description:
      "Dense 2U 24-bay SAS/NVMe storage array for block-only SAN workloads in mid-market environments. Supports dual active-active controllers for high availability and is optimized for VMware, Hyper-V, and SQL Server. Scales up to 10 enclosures with 240 total drives at a lower price point than enterprise arrays.",
    price: "~$18,000",
  },
  {
    id: "san-me5084",
    name: "Dell PowerVault ME5084",
    status: "not-in-proposal",
    bestFor: "High-capacity block SAN",
    spec: "Block · 15.36 PB · 84 SAS SSD/HDD · FC 16Gbps + iSCSI",
    description:
      "4U 84-bay large-form-factor expansion array delivering high drive density for capacity-intensive block SAN workloads. Can serve as primary storage or expansion shelf for ME5012/ME5024 arrays. Supports both SSD and nearline SAS HDD mix for tiered storage strategies.",
    price: "~$28,000",
  },
  {
    id: "san-powerstore-500h",
    name: "Dell PowerStore 500H",
    status: "not-in-proposal",
    bestFor: "Hybrid entry storage",
    spec: "Hybrid · 3.8 PB · 40 NVMe SSD · Auto-tiering",
    description:
      "Cost-optimized hybrid PowerStore node combining NVMe flash and nearline SAS HDDs for tiered performance and capacity. Data management software automatically migrates hot data to flash and cold data to HDD tiers. Suitable for secondary workloads, backup targets, and archive storage alongside primary all-flash arrays.",
    price: "~$22,000",
  },
  {
    id: "san-sc5020",
    name: "Dell SC5020",
    status: "not-in-proposal",
    bestFor: "Proven legacy block SAN",
    spec: "Block · 4.32 PB · 120 SAS SSD/HDD · Data Progression",
    description:
      "Proven mid-range block SAN array widely deployed in VMware and Hyper-V environments for reliability and simplicity. Supports up to 120 drives across SSD and HDD tiers with automated tiering (Data Progression). Still widely found in enterprise environments and supported through Dell's extended lifecycle program.",
    price: "~$30,000",
  },
];

/* -------------------------------------------------------------------------- */
/*  Management switches — Sheet "Management Switches"                          */
/* -------------------------------------------------------------------------- */

const managementSwitches: CatalogEntry[] = [
  {
    id: "sw-n3248te",
    name: "Dell N3248TE-ON",
    status: "in-proposal",
    bestFor: "Management & server access",
    spec: "48× 1GbE RJ45 · 4× 10GbE SFP+ · L3",
    description:
      "48-port 1GbE access switch with 4× 10GbE SFP+ uplinks for server management networks and iDRAC/BMC connectivity. Open Networking (ON) platform supports NOS-agnostic operation and full L3 routing including OSPF and BGP. Ideal as the top-of-rack management switch in a data-center cluster environment.",
    price: "~$3,200",
  },
  {
    id: "sw-n3248p",
    name: "Dell N3248P-ON",
    status: "not-in-proposal",
    bestFor: "PoE management network",
    spec: "48× 1GbE PoE+ · 4× 10GbE SFP+ · PoE+ 740W · L3",
    description:
      "PoE+-enabled 48-port 1GbE switch with 740W total PoE budget for IP cameras, phones, and access points in the management plane. Same L3 feature set as N3248TE-ON with OSPF, BGP, and VRF support. Suitable for combined management and PoE infrastructure in SMB-to-enterprise deployments.",
    price: "~$3,800",
  },
  {
    id: "sw-n2248px",
    name: "Dell N2248PX-ON",
    status: "not-in-proposal",
    bestFor: "Multi-Gig PoE access",
    spec: "48× 1G/2.5G · 2× 10GbE SFP+ · PoE+ 768W · L2+",
    description:
      "48-port multi-gigabit (1G/2.5G) switch with PoE+ for connecting modern Wi-Fi 6/6E access points that require 2.5GbE backhaul. Delivers 768W total PoE budget with smart classification for power-hungry devices. Suitable for the management network segment supporting wireless infrastructure and IP devices.",
    price: "~$4,200",
  },
  {
    id: "sw-n3224t",
    name: "Dell N3224T-ON",
    status: "not-in-proposal",
    bestFor: "Compact rack management",
    spec: "24× 1GbE RJ45 · 4× 10GbE SFP+ · L3",
    description:
      "Compact 24-port 1GbE switch for smaller racks or auxiliary management networks requiring full L3 capability. Cost-effective footprint for dedicated iDRAC, IPMI, or out-of-band management VLANs. Shares the same OS10 software platform as larger N-series switches for operational consistency.",
    price: "~$2,200",
  },
  {
    id: "sw-n2024p",
    name: "Dell N2024P-ON",
    status: "not-in-proposal",
    bestFor: "Small PoE management",
    spec: "24× 1GbE PoE+ · 2× 10GbE SFP+ · PoE+ 384W · L2+",
    description:
      "Entry 24-port PoE+ switch for small cluster management networks needing power delivery to IP devices. 384W total PoE budget covers up to 24 IEEE 802.3af/at powered devices simultaneously. Suitable for small data-center racks or remote office server management networks.",
    price: "~$1,800",
  },
  {
    id: "sw-n4032f",
    name: "Dell N4032F-ON",
    status: "not-in-proposal",
    bestFor: "10G aggregation layer",
    spec: "32× 10GbE SFP+ · 2× 40GbE QSFP+ · L3 · VXLAN / EVPN",
    description:
      "32-port 10GbE aggregation switch providing high-density server connectivity with 40GbE uplinks for spine connection. Full L3 feature set including VXLAN, EVPN, and ECMP for modern virtualized data centers. Often deployed as a second-tier aggregation switch feeding a 40G or 100G spine.",
    price: "~$5,500",
  },
];

/* -------------------------------------------------------------------------- */
/*  ToR switches — proposal SKU S5224F-ON + curated alternatives               */
/*  Note: S5224F-ON is NOT in the xlsx Switch sheet; added explicitly so the   */
/*  catalog reflects the Avaya BoQ.                                            */
/* -------------------------------------------------------------------------- */

const torSwitches: CatalogEntry[] = [
  {
    id: "sw-s5224f",
    name: "Dell EMC S5224F-ON",
    status: "in-proposal",
    bestFor: "24-port 25GbE ToR",
    spec: "24× 25GbE SFP28 · 4× 100GbE QSFP28 · L3 · IO→PSU airflow",
    description:
      "1U 24-port 25GbE ToR switch currently in the Avaya BoQ. Dual PSU, IO-to-PSU airflow, full L3 with OSPF/BGP. Sized for a single-rack VMware or Hyper-V leaf when 48 ports would be over-provisioned.",
    price: "~$8,400",
  },
  {
    id: "sw-s5248f",
    name: "Dell EMC S5248F-ON",
    status: "not-in-proposal",
    bestFor: "48-port 25GbE leaf",
    spec: "48× 25GbE SFP28 · 6× 100GbE QSFP28 · L3 · 2.56 Tbps",
    description:
      "Higher-density 48-port 25GbE leaf for clusters that have outgrown the 24-port S5224F-ON. Same Open Networking design (SONiC / OS10 / customer NOS) and L3 feature set, with 6× 100GbE uplinks for spine aggregation.",
    price: "~$12,000",
  },
  {
    id: "sw-s5296f",
    name: "Dell EMC S5296F-ON",
    status: "not-in-proposal",
    bestFor: "Hyperscale 25GbE leaf",
    spec: "96× 25GbE SFP28 · 8× 100GbE QSFP28 · L3",
    description:
      "Double-density 25GbE leaf serving a full rack of 25GbE-connected servers from a single switch. Best when the cluster grows beyond a 48-port leaf and reaches hyperscale port counts.",
    price: "~$22,000",
  },
  {
    id: "sw-s5232f",
    name: "Dell EMC S5232F-ON",
    status: "not-in-proposal",
    bestFor: "100GbE spine / leaf",
    spec: "32× 100GbE QSFP28 · L3 · 6.4 Tbps",
    description:
      "32-port 100GbE switch suited as either a small spine or a leaf where every server uplinks at 100GbE. Drop-in upgrade path from 25GbE leaf-spine fabrics when bandwidth per server grows.",
    price: "~$24,000",
  },
  {
    id: "sw-s4148f",
    name: "Dell EMC S4148F-ON",
    status: "not-in-proposal",
    bestFor: "10GbE legacy ToR",
    spec: "48× 10GbE SFP+ · 4× 100GbE QSFP28 · L3",
    description:
      "10GbE ToR alternative for clusters still standardising on 10GbE NICs. Same OS10 / Open Networking story as the S5000 family with a clear 100GbE uplink path.",
    price: "~$7,200",
  },
];

/* -------------------------------------------------------------------------- */
/*  SAN switches — Fibre Channel (not in xlsx, sourced from BoQ + family lib)  */
/* -------------------------------------------------------------------------- */

const sanSwitches: CatalogEntry[] = [
  {
    id: "sw-ds6610b",
    name: "Connectrix DS-6610B",
    status: "in-proposal",
    bestFor: "24-port 16Gb FC SAN",
    spec: "24× 16Gb FC · Single PSU · Rear-to-front airflow · 1U",
    description:
      "1U 24-port 16Gb Fibre Channel SAN switch currently in the Avaya BoQ. Brocade-based Connectrix DS family with optional ports-on-demand licensing to expand from 12 → 24 active ports. Compatible with Dell PowerVault, Unity and PowerStore back-end SAN fabrics.",
    price: "~$11,500",
  },
  {
    id: "sw-ds7720b",
    name: "Connectrix DS-7720B",
    status: "not-in-proposal",
    bestFor: "48-port 32Gb FC SAN",
    spec: "48× 32Gb FC · Dual PSU · 1U",
    description:
      "Higher-end 48-port 32Gb FC switch for larger SAN fabrics. Doubles bandwidth per port and roughly doubles port count vs. the DS-6610B — recommended once SAN traffic outgrows 16Gb / 24 ports.",
    price: "~$22,000",
  },
  {
    id: "sw-ds7730b",
    name: "Connectrix DS-7730B",
    status: "not-in-proposal",
    bestFor: "Director-class FC core",
    spec: "Modular · up to 384× 32Gb FC · Dual control modules",
    description:
      "Director-class modular FC switch for enterprise SAN cores. Hot-plug control and IO modules deliver up to 384 32Gb FC ports with non-disruptive code upgrades. For deployments that require zero scheduled downtime on the storage fabric.",
    price: "~$110,000",
  },
  {
    id: "sw-ds5300b",
    name: "Connectrix DS-5300B",
    status: "not-in-proposal",
    bestFor: "Legacy 8Gb FC migration",
    spec: "80× 8Gb FC · 1U",
    description:
      "80-port 8Gb FC switch retained mainly as a migration target for older fabrics. Useful when a phased migration from 8Gb → 16Gb / 32Gb FC is required without disrupting in-flight workloads.",
    price: "~$6,000",
  },
];

/* -------------------------------------------------------------------------- */
/*  Master platform map — per Subsystem.id                                     */
/* -------------------------------------------------------------------------- */

export const platformCatalog: Record<string, CatalogEntry[]> = {
  "hyper-v-cluster": hyperVServers,
  "vmware-cluster": vmwareServers,
  "san-storage": sanArrays,
  "mgmt-switch": managementSwitches,
  "tor-switches": torSwitches,
  "san-switches": sanSwitches,
};

/**
 * Which entry id in each platform list is the one currently in the
 * proposal. Single source of truth for "highlight this entry" + makes the
 * self-healing fallback in `useCatalogScope` deterministic.
 */
export const inProposalCatalogId: Record<string, string> = {
  "hyper-v-cluster": "hv-r660",
  "vmware-cluster": "vm-r760",
  "san-storage": "san-unity-380f",
  "mgmt-switch": "sw-n3248te",
  "tor-switches": "sw-s5224f",
  "san-switches": "sw-ds6610b",
};

/* -------------------------------------------------------------------------- */
/*  Component catalogs — CPU / RAM / Storage / Network / Power                 */
/*  Sheets "CPUs", "RAM Memory", "Storage-SSD" verbatim; Network and Power     */
/*  synthesised from the Avaya BoQ + family library (xlsx didn't enumerate     */
/*  these). Each entry's `description` carries the long blurb from the source. */
/* -------------------------------------------------------------------------- */

const cpus: CatalogEntry[] = [
  {
    id: "338-CPBT",
    name: "Intel Xeon Platinum 8562Y+",
    status: "not-in-proposal",
    bestFor: "High-core HPC & virtualization",
    spec: "32C / 64T · 2.8/4.0 GHz · 300W · 60MB L3 · DDR5-5600 · FCLGA4677",
    description:
      "5th Gen / Emerald Rapids — high-core HPC and virtualization workhorse with DDR5-5600 8-channel memory support.",
    price: "$5,945",
  },
  {
    id: "338-CHTM",
    name: "Intel Xeon Platinum 8462Y+",
    status: "not-in-proposal",
    bestFor: "Dense VMware / Hyper-V hosts",
    spec: "32C / 64T · 2.8/4.0 GHz · 300W · 60MB L3 · DDR5-4800 · FCLGA4677",
    description:
      "4th Gen / Sapphire Rapids — dense VMware and Hyper-V host CPU. Strong all-rounder for cluster compute nodes.",
    price: "$5,945",
  },
  {
    id: "338-CSKK",
    name: "Intel Xeon 6747P",
    status: "not-in-proposal",
    bestFor: "Extreme core density AI+virt",
    spec: "48C / 96T · 2.7/3.8 GHz · 500W · 128MB L3 · DDR5-5600 · FCLGA4710",
    description:
      "6th Gen / Granite Rapids — extreme-core CPU for combined AI and virtualization workloads. DDR5-5600 8-channel.",
    price: "$7,277",
  },
  {
    id: "338-CHTB",
    name: "Intel Xeon Platinum 8468",
    status: "not-in-proposal",
    bestFor: "Highest-core Sapphire host",
    spec: "48C / 96T · 2.1/3.8 GHz · 350W · 105MB L3 · DDR5-4800 · FCLGA4677",
    description:
      "4th Gen / Sapphire Rapids — highest-core Sapphire Rapids host CPU. 48 cores at 350W for memory-bound consolidation.",
    price: "$7,121",
  },
  {
    id: "338-CHSJ",
    name: "Intel Xeon Gold 6442Y",
    status: "in-proposal",
    bestFor: "Balanced mid-range cluster node",
    spec: "24C / 48T · 2.6/4.0 GHz · 225W · 60MB L3 · DDR5-4800 · FCLGA4677",
    description:
      "4th Gen / Sapphire Rapids — balanced mid-range cluster-node CPU. Closest catalog match to the Xeon Gold 6548Y+ family used in the proposal.",
    price: "$2,878",
  },
  {
    id: "338-CPBV",
    name: "Intel Xeon Gold 6526Y",
    status: "not-in-proposal",
    bestFor: "Cost-efficient 5th Gen node",
    spec: "16C / 32T · 2.8/4.0 GHz · 195W · 37.5MB L3 · DDR5-5200 · FCLGA4677",
    description:
      "5th Gen / Emerald Rapids — cost-efficient 5th Gen node CPU. DDR5-5200 8-channel; ideal for entry / mid-range cluster builds.",
    price: "$1,517",
  },
  {
    id: "338-CHSS",
    name: "Intel Xeon Gold 5415+",
    status: "not-in-proposal",
    bestFor: "Entry cluster / edge compute",
    spec: "8C / 16T · 2.9/4.1 GHz · 150W · 22.5MB L3 · DDR5-4400 · FCLGA4677",
    description:
      "4th Gen / Sapphire Rapids — entry-class cluster CPU for edge compute and lightweight virtualization.",
    price: "$1,066",
  },
  {
    id: "338-BWMS",
    name: "AMD EPYC 9354",
    status: "not-in-proposal",
    bestFor: "High memory BW VMware nodes",
    spec: "32C / 64T · 2.4/3.8 GHz · 280W · 256MB L3 · DDR5-4800 · SP5",
    description:
      "4th Gen / Genoa — high memory-bandwidth VMware node. DDR5-4800 12-channel; strong choice for memory-bound vSAN workloads.",
    price: "$2,337",
  },
  {
    id: "338-BWNK",
    name: "AMD EPYC 9454",
    status: "not-in-proposal",
    bestFor: "Dense vSphere / HPC workloads",
    spec: "48C / 96T · 2.75/3.8 GHz · 290W · 256MB L3 · DDR5-4800 · SP5",
    description:
      "4th Gen / Genoa — dense vSphere and HPC CPU. 48 cores per socket at 290W in the SP5 platform.",
    price: "$3,619",
  },
  {
    id: "338-BWND",
    name: "AMD EPYC 9554",
    status: "not-in-proposal",
    bestFor: "Max core AMD cluster node",
    spec: "64C / 128T · 3.1/3.75 GHz · 360W · 256MB L3 · DDR5-4800 · SP5",
    description:
      "4th Gen / Genoa — maximum core count per socket on the AMD platform. 64 cores at 360W for the densest AMD cluster nodes.",
    price: "$5,765",
  },
];

const memory: CatalogEntry[] = [
  {
    id: "370-BCKK",
    name: "16GB RDIMM DDR5",
    status: "not-in-proposal",
    bestFor: "Entry Hyper-V / VMware nodes",
    spec: "5600 MT/s · 1Rx8 SR · 1.1V · ECC Reg · FCLGA4677 / FCLGA4710",
    description:
      "Entry-tier DDR5 module for first-generation 5th/6th Gen Intel cluster nodes.",
    price: "~$75",
  },
  {
    id: "370-BCLF",
    name: "32GB RDIMM DDR5",
    status: "in-proposal",
    bestFor: "Standard cluster nodes 512GB+",
    spec: "5600 MT/s · 1Rx4 SR · 1.1V · ECC Reg · FCLGA4677 / FCLGA4710",
    description:
      "Standard high-density DDR5 RDIMM matching the 32GB modules used per R660 node in the Avaya BoQ.",
    price: "~$120",
  },
  {
    id: "370-BBQQ",
    name: "64GB RDIMM DDR5",
    status: "not-in-proposal",
    bestFor: "High-density vSphere hosts",
    spec: "4800 MT/s · 2Rx4 DR · 1.1V · ECC Reg · FCLGA4677 / FCLGA4710",
    description:
      "Dual-rank 64GB module for vSphere hosts that need >1TB per chassis without populating every slot.",
    price: "~$220",
  },
  {
    id: "370-BCJN",
    name: "128GB RDIMM DDR5",
    status: "not-in-proposal",
    bestFor: "Max memory R760 / R860 hosts",
    spec: "5600 MT/s · 2Rx4 DR · 1.1V · ECC Reg · FCLGA4677 / FCLGA4710",
    description:
      "Highest-capacity 5600 MT/s module for R760 / R860 hosts requiring multi-TB memory footprints.",
    price: "~$550",
  },
  {
    id: "370-BCQW",
    name: "96GB RDIMM DDR5",
    status: "not-in-proposal",
    bestFor: "Balanced large-memory configs",
    spec: "5600 MT/s · 2Rx4 DR · 1.1V · ECC Reg · FCLGA4677 / FCLGA4710",
    description:
      "Balanced 96GB module for hosts that want >2TB memory without paying the 128GB-per-DIMM premium.",
    price: "~$380",
  },
  {
    id: "370-BCJO",
    name: "256GB RDIMM DDR5",
    status: "not-in-proposal",
    bestFor: "R860 / R960 24TB builds",
    spec: "5600 MT/s · 4Rx4 QR · 1.1V · ECC Reg · FCLGA4677 / FCLGA4710",
    description:
      "Quad-rank 256GB module used only on R860 / R960 builds that aim for the platform-maximum 24TB DDR5.",
    price: "~$1,200",
  },
  {
    id: "370-AGLS",
    name: "32GB RDIMM DDR4",
    status: "not-in-proposal",
    bestFor: "3rd Gen Ice Lake server upgrade",
    spec: "3200 MT/s · 2Rx4 DR · 1.2V · ECC Reg · FCLGA4189",
    description:
      "DDR4 upgrade module for 3rd Gen Ice Lake PowerEdge servers still in service.",
    price: "~$85",
  },
  {
    id: "370-AGLT",
    name: "64GB RDIMM DDR4",
    status: "not-in-proposal",
    bestFor: "Ice Lake density expansion",
    spec: "3200 MT/s · 2Rx4 DR · 1.2V · ECC Reg · FCLGA4189",
    description:
      "DDR4 density upgrade for Ice Lake hosts moving from 32GB to 64GB DIMM standardisation.",
    price: "~$160",
  },
  {
    id: "370-AGLU",
    name: "128GB RDIMM DDR4",
    status: "not-in-proposal",
    bestFor: "Max memory 3rd Gen systems",
    spec: "3200 MT/s · 4Rx4 QR · 1.2V · ECC Reg · FCLGA4189",
    description:
      "Maximum DDR4 capacity module for 3rd Gen Xeon systems that cannot be upgraded to DDR5.",
    price: "~$420",
  },
  {
    id: "370-BCJP",
    name: "64GB RDIMM DDR5 (EPYC)",
    status: "not-in-proposal",
    bestFor: "AMD EPYC Genoa cluster nodes",
    spec: "4800 MT/s · 2Rx4 DR · 1.1V · ECC Reg · SP5 (EPYC 9xxx)",
    description:
      "DDR5 module compatible with AMD EPYC Genoa SP5 platform. Used when the cluster standardises on EPYC sockets instead of Intel.",
    price: "~$220",
  },
];

const storage: CatalogEntry[] = [
  {
    id: "400-BDPF",
    name: "480GB SATA SSD",
    status: "in-proposal",
    bestFor: "Boot / OS drives",
    spec: 'SATA 6Gbps · 2.5" Hot-Plug AG · 1 DWPD · 560/340 MB/s',
    description:
      "Entry SATA SSD used as boot / OS drives — matches the 480GB SATA 6Gbps Read Intensive AG drives in the Avaya BoQ.",
    price: "~$150",
  },
  {
    id: "400-BDWN",
    name: "960GB SATA SSD",
    status: "not-in-proposal",
    bestFor: "VM datastores (SATA tier)",
    spec: 'SATA 6Gbps · 2.5" Hot-Plug AG · 1 DWPD · 560/380 MB/s',
    description:
      "1TB-class SATA SSD for budget VMware and Hyper-V datastores; doubles up as a vSAN capacity tier.",
    price: "~$220",
  },
  {
    id: "400-BDWO",
    name: "1.92TB SATA SSD",
    status: "not-in-proposal",
    bestFor: "High-capacity SATA tier",
    spec: 'SATA 6Gbps · 2.5" Hot-Plug AG · 1 DWPD · 560/390 MB/s',
    description:
      "Read-intensive SATA SSD prioritising capacity per bay — useful for log archival and warm-tier datastores.",
    price: "~$380",
  },
  {
    id: "400-BDWP",
    name: "3.84TB SATA SSD",
    status: "not-in-proposal",
    bestFor: "Dense SATA capacity",
    spec: 'SATA 6Gbps · 2.5" Hot-Plug AG · 1 DWPD · 560/390 MB/s',
    description:
      "4TB-class SATA SSD enabling ~30TB usable per 1U server (8 bays). Backup-to-disk and dense NFS / CSV datastores.",
    price: "~$700",
  },
  {
    id: "345-BEOZ",
    name: "1.6TB SAS Mixed-Use SSD",
    status: "not-in-proposal",
    bestFor: "Mixed read/write workloads",
    spec: 'SAS 24Gbps · 2.5" Hot-Plug · 3 DWPD · 2,400/2,000 MB/s',
    description:
      "Enterprise SAS mixed-use SSD with dual-port reliability — chosen for OLTP databases and mission-critical workloads.",
    price: "~$800",
  },
  {
    id: "345-BELG",
    name: "7.68TB SAS Read-Intensive SSD",
    status: "not-in-proposal",
    bestFor: "High-capacity SAS SSD",
    spec: 'SAS 24Gbps · 2.5" Hot-Plug · 1 DWPD · 2,200/700 MB/s',
    description:
      "8TB-class SAS SSD for read-heavy consolidated workloads — largest per-2.5\" bay capacity on the SAS interface.",
    price: "~$1,800",
  },
  {
    id: "400-BRPH",
    name: "1.6TB NVMe Mixed-Use SSD",
    status: "not-in-proposal",
    bestFor: "NVMe performance tier",
    spec: "NVMe PCIe 4.0 U.2 · 3 DWPD · 6,800/4,000 MB/s",
    description:
      "PCIe Gen4 NVMe U.2 mixed-use SSD — vSAN cache and all-flash capacity tier in modern PowerEdge servers.",
    price: "~$700",
  },
  {
    id: "400-BMTN",
    name: "3.84TB NVMe Read-Intensive SSD",
    status: "not-in-proposal",
    bestFor: "Large NVMe capacity tier",
    spec: "NVMe PCIe 4.0 U.2 · 1 DWPD · 6,500/3,500 MB/s",
    description:
      "4TB PCIe Gen4 NVMe U.2 SSD for tier-1 all-NVMe vSAN datastores on R750 / R760 / R760xa.",
    price: "~$950",
  },
  {
    id: "400-AUWK",
    name: "12TB Nearline SATA HDD",
    status: "not-in-proposal",
    bestFor: "Bulk capacity / backup tier",
    spec: 'SATA 6Gbps · 3.5" LFF Hot-Plug · 7,200 RPM · 250/240 MB/s',
    description:
      "Bulk nearline SATA HDD for capacity-tier vSAN, NFS backup targets, and cold archive workloads.",
    price: "~$280",
  },
  {
    id: "400-BLLF",
    name: "18TB Nearline SAS HDD",
    status: "not-in-proposal",
    bestFor: "Max-capacity archive / SAN",
    spec: 'SAS 12Gbps · 3.5" LFF Hot-Plug · 7,200 RPM · 260/250 MB/s',
    description:
      "Maximum-capacity nearline SAS HDD for PowerVault ME5-series arrays and LFF PowerEdge backup tiers.",
    price: "~$430",
  },
];

/* Network NICs and PSUs are synthesised — the xlsx does not enumerate them. */

const network: CatalogEntry[] = [
  {
    id: "nic-bcm-57414",
    name: "Broadcom 57414 Dual Port",
    status: "in-proposal",
    bestFor: "10/25GbE data plane",
    spec: "10/25GbE SFP28 · OCP NIC 3.0",
    description:
      "Workhorse OCP 3.0 NIC used per R660 node in the Avaya BoQ. Dual-port 10/25GbE with line-rate offload.",
    price: "~$420",
  },
  {
    id: "nic-bcm-5720",
    name: "Broadcom 5720 Dual Port LOM",
    status: "in-proposal",
    bestFor: "iDRAC / management",
    spec: "1GbE · LOM",
    description:
      "Dual-port 1GbE LOM also present per R660 node in the Avaya BoQ — handles iDRAC and 1GbE management traffic.",
    price: "~$95",
  },
  {
    id: "nic-intel-e810",
    name: "Intel E810-XXVDA2",
    status: "not-in-proposal",
    bestFor: "Intel-stack 25GbE",
    spec: "2× 25GbE SFP28 · PCIe 4.0",
    description:
      "Intel Ethernet 800-series with ADQ + RDMA — alternative when an Intel-only NIC stack is mandated.",
    price: "~$520",
  },
  {
    id: "nic-mlx-cx6",
    name: "NVIDIA ConnectX-6 Dx",
    status: "not-in-proposal",
    bestFor: "100GbE SmartNIC",
    spec: "2× 100GbE QSFP56 · PCIe 4.0",
    description:
      "Dual-port 100GbE SmartNIC with RoCEv2 and GPUDirect — common in GPU-accelerated and storage-fabric servers.",
    price: "~$1,250",
  },
  {
    id: "nic-bcm-57508",
    name: "Broadcom BCM57508",
    status: "not-in-proposal",
    bestFor: "Dual 100GbE",
    spec: "2× 100GbE QSFP56 · PCIe 4.0",
    description:
      "Dual-port 100GbE NIC for spine-leaf data paths in R760xa / R960 high-throughput configurations.",
    price: "~$1,100",
  },
];

const power: CatalogEntry[] = [
  {
    id: "psu-800w-redundant",
    name: "800W Power Supply (1+1)",
    status: "in-proposal",
    bestFor: "Dense 1U redundant",
    spec: "Hot-plug · Mixed Mode · 80+ Platinum",
    description:
      "Dual hot-plug 800W PSU pair — the PSU configuration shipped on the R660 in the Avaya BoQ.",
    price: "~$320",
  },
  {
    id: "psu-1100w-redundant",
    name: "1100W Power Supply (1+1)",
    status: "not-in-proposal",
    bestFor: "Mixed 2U workloads",
    spec: "Hot-plug · Titanium · 80+",
    description:
      "Titanium-class 1100W pair for 2U mixed-workload servers — higher efficiency at part-load conditions.",
    price: "~$420",
  },
  {
    id: "psu-1400w-redundant",
    name: "1400W Power Supply (1+1)",
    status: "not-in-proposal",
    bestFor: "GPU-loaded 2U / 4U",
    spec: "Hot-plug · Platinum · 80+",
    description:
      "Redundant 1400W PSU pair for GPU-loaded 2U / 4U builds such as R760xa and XE8545.",
    price: "~$560",
  },
  {
    id: "psu-2400w-redundant",
    name: "2400W Power Supply (1+1)",
    status: "not-in-proposal",
    bestFor: "4-socket flagships",
    spec: "Hot-plug · Platinum",
    description:
      "Maximum-output redundant PSU pair for fully-loaded 4-socket flagships (R860 / R960).",
    price: "~$890",
  },
  {
    id: "psu-cabled-450w",
    name: "450W Cabled Power Supply",
    status: "not-in-proposal",
    bestFor: "Edge / single PSU",
    spec: "Non-redundant · Bronze",
    description:
      "Single cabled PSU for edge / low-cost configurations (R450 entry SKUs). Non-redundant.",
    price: "~$110",
  },
];

/* -------------------------------------------------------------------------- */
/*  Per-category component catalog                                             */
/* -------------------------------------------------------------------------- */

export const componentCatalog: Record<ComponentCategory, CatalogEntry[]> = {
  cpu: cpus,
  memory,
  storage,
  network,
  power,
  gpu: [],
};

export const componentCategoryLabel: Record<ComponentCategory, string> = {
  cpu: "CPU",
  memory: "Memory",
  storage: "Storage",
  network: "Network",
  power: "Power",
  gpu: "GPU",
};

export const componentCategoryOrder: ComponentCategory[] = [
  "cpu",
  "memory",
  "gpu",
  "storage",
  "network",
  "power",
];
