# Dell Infrastructure SKU Catalog

> **Source workbook:** `dell_infrastructure_sku_master.xlsx`
> **Generated:** 2026-05-12
> **Sources cited in workbook:** Dell datasheets, Intel ARK RCP, AMD official pricelists, serversupply.com, xbyte.com, expresscomputersystems.com, sanstorageworks.com
> **Note:** All prices are estimates. Contact Dell for an official quote. RCP = Recommended Customer Price (1,000-unit tray) for CPUs.

Use this document as the **single source of truth** for hardware data in the RFQ / hardware configurator demo. Each section below corresponds to one sheet in the source workbook and is reproduced verbatim from the cell values, including descriptions and prices.

---

## 1. Sheet Index

| Sheet | Category | Products Covered | SKU Count | Price Range |
| --- | --- | --- | --- | --- |
| Hyper-V Cluster | Server Platform | PowerEdge R450–R960, MX750c | 10 | $3,200 – $25,000+ |
| VMware Cluster | Server Platform | PowerEdge R550–R960, XE8545, MX750c | 10 | $3,800 – $25,000+ |
| SAN Storage | Storage Array | Unity XT 380F–680F, PowerStore 500T–3200T, ME5024/5084, SC5020 | 10 | $18,000 – $220,000+ |
| Management Switches | Network Switch | N2024P, N2248PX, N3224T, N3248TE/P/X, S5248F, S5296F, Z9264F, N4032F | 10 | $1,800 – $38,000 |
| CPUs | Processor | Intel Xeon Gold/Platinum 4th–6th Gen, AMD EPYC Genoa | 10 | $1,066 – $7,277 (RCP) |
| RAM Memory | DIMM Module | DDR4 3200 / DDR5 4800–5600 MT/s, 16GB–256GB RDIMM | 10 | $75 – $1,200 |
| Storage-SSD | Drive / HDD | SATA SSD 480GB–3.84TB, SAS SSD, NVMe PCIe 4.0, HDD 12–18TB | 10 | $150 – $1,800 |

### Color-Coding Guide (workbook tabs)

| Sheet | Header Color | Meaning |
| --- | --- | --- |
| Hyper-V Cluster | Deep blue | Microsoft Hyper-V server platforms |
| VMware Cluster | Grey | VMware vSphere / vSAN server platforms |
| SAN Storage | Purple | SAN / NAS / HCI storage arrays |
| Management Switches | Dark green | Data-center switching |
| CPUs | Dark red | Processor components |
| RAM Memory | Blue | Memory DIMM modules |
| Storage-SSD | Brown | Drives and SSDs |

---

## 2. Hyper-V Cluster — Dell PowerEdge servers

Recommended Dell PowerEdge platforms for Microsoft Hyper-V / Windows Server failover clusters and Storage Spaces Direct (S2D). Prices are base-config estimates.

| Model | Form Factor | Sockets / CPU Support | Max RAM | Drive Bays | Network | Best For | Starting Price (USD) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PowerEdge R660 | 1U Rack | 2S / Xeon 5th/6th Gen | 2TB DDR5 | 10x 2.5" | 4x 1GbE + OCP 3.0 | Dense compute nodes | ~$4,500 |
| PowerEdge R760 | 2U Rack | 2S / Xeon 5th/6th Gen | 8TB DDR5 | 16x 2.5" or 8x 3.5" | 4x 1GbE + OCP 3.0 | General Hyper-V cluster | ~$6,200 |
| PowerEdge R760xa | 2U Rack | 2S / Xeon 5th Gen | 8TB DDR5 | 12x 2.5" + GPU bays | OCP 3.0 + PCIe 5.0 | GPU-accelerated Hyper-V | ~$9,000 |
| PowerEdge R860 | 2U Rack | 4S / Xeon 5th Gen | 24TB DDR5 | 8x 2.5" | OCP 3.0 + PCIe 5.0 | Memory-heavy Hyper-V hosts | ~$18,000 |
| PowerEdge R960 | 4U Rack | 4S / Xeon 5th Gen | 24TB DDR5 | 24x 2.5" | OCP 3.0 + PCIe 5.0 | Enterprise-scale clusters | ~$25,000 |
| PowerEdge R750xs | 2U Rack | 2S / Xeon 4th Gen | 4TB DDR5 | 8x 2.5" or 4x 3.5" | 4x 1GbE + OCP 3.0 | Mid-range clusters | ~$5,200 |
| PowerEdge R550 | 2U Rack | 2S / Xeon 4th Gen | 2TB DDR4/5 | 12x 3.5" or 16x 2.5" | 4x 1GbE + OCP 3.0 | Storage-rich Hyper-V hosts | ~$3,800 |
| PowerEdge R450 | 1U Rack | 2S / Xeon 4th Gen | 1TB DDR4/5 | 8x 2.5" | 4x 1GbE | Edge / remote Hyper-V | ~$3,200 |
| PowerEdge MX750c | Blade | 2S / Xeon 5th Gen | 8TB DDR5 | 2x NVMe M.2 | MX fabric via chassis | Blade Hyper-V clusters | ~$7,500 |
| PowerEdge R660xs | 1U Rack | 2S / Xeon 5th Gen | 2TB DDR5 | 6x 2.5" | 4x 1GbE + OCP 3.0 | SMB dense Hyper-V | ~$3,600 |

### Hyper-V — Long descriptions

- **PowerEdge R660 (~$4,500).** Ultra-dense 1U two-socket rack server for high-density virtualization and Hyper-V compute nodes. Supports up to 2TB DDR5 across 16 DIMM slots and dual Xeon Scalable 5th Gen CPUs. Low 1U footprint makes it ideal for maximizing host count in standard racks.
- **PowerEdge R760 (~$6,200).** Versatile 2U two-socket server optimized for mixed workloads including Hyper-V and S2D (Storage Spaces Direct) clusters. Provides up to 8TB DDR5 across 32 DIMM slots and extensive PCIe 5.0 expansion. Strong balance of compute, memory, and local storage for mid-size clusters.
- **PowerEdge R760xa (~$9,000).** 2U two-socket GPU-accelerated server supporting up to four double-width GPUs alongside standard Hyper-V VMs. Ideal for clusters running mixed GPU-enabled and standard workloads. Equipped with PCIe 5.0 and OCP 3.0 networking for high-bandwidth VM traffic.
- **PowerEdge R860 (~$18,000).** High-density 2U four-socket server delivering up to 24TB DDR5 across 96 DIMM slots — ideal for large Hyper-V deployments consolidating hundreds of VMs per host. Supports up to four 5th Gen Intel Xeon Scalable CPUs for extreme core density. Designed for enterprise environments requiring maximum memory per RU.
- **PowerEdge R960 (~$25,000).** Flagship 4U four-socket platform for enterprise-scale Hyper-V clusters demanding massive core counts and memory. Supports up to 112 cores (4x 28-core CPUs) and 24TB DDR5 with 96 DIMM slots. Offers the highest local storage capacity among rack servers with up to 24 hot-plug drives.
- **PowerEdge R750xs (~$5,200).** Streamlined 2U two-socket server offering a cost-efficient entry point for Hyper-V clusters with a focus on simplicity. Provides 24 DIMM slots for up to 4TB DDR5 and flexible storage configurations in 2.5" or 3.5" formats. Excellent choice for branch-office or SMB Hyper-V deployments.
- **PowerEdge R550 (~$3,800).** 2U two-socket rack server balancing compute and storage for Hyper-V clusters utilizing local storage. Supports up to 16 hot-plug drives, making it strong for S2D (Storage Spaces Direct) configurations. Up to 2TB DDR4 across 16 DIMM slots with 3rd/4th Gen Xeon support.
- **PowerEdge R450 (~$3,200).** Compact 1U two-socket server for edge deployments and small Hyper-V clusters in remote offices. Supports up to 1TB RAM and 8 hot-plug 2.5" drives with a low-noise, low-power profile. Ideal when rack space and power budget are primary constraints.
- **PowerEdge MX750c (~$7,500).** Full-width blade compute module for MX7000 modular chassis, delivering two-socket performance in blade form. Shares chassis fabric, networking, and power across up to 8 blades for streamlined cabling and management. Ideal for large data centers standardizing on modular infrastructure for Hyper-V.
- **PowerEdge R660xs (~$3,600).** Entry-level 1U two-socket server for small-to-medium Hyper-V deployments requiring density without premium pricing. Supports 12 DIMM slots for up to 2TB DDR5 and six hot-plug 2.5" drives for local OS and VM storage. Simplified design with iDRAC 10 for streamlined remote management.

---

## 3. VMware Cluster — Dell PowerEdge servers

Recommended platforms for VMware vSphere 8, vSAN ReadyNodes, and Horizon VDI. All entries are VMware HCL certified. Prices are base estimates.

| Model | Form Factor | Sockets / CPU Support | Max RAM | Drive Bays | Network | Best For | Starting Price (USD) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PowerEdge R760 | 2U Rack | 2S / Xeon 5th/6th Gen | 8TB DDR5 | 16x 2.5" or 8x 3.5" | 4x 1GbE + OCP 3.0 | General ESXi cluster | ~$6,200 |
| PowerEdge R760xa | 2U Rack | 2S / Xeon 5th Gen | 8TB DDR5 | 12x 2.5" + GPU bays | OCP 3.0 + PCIe 5.0 | GPU VM / VDI clusters | ~$9,000 |
| PowerEdge R860 | 2U Rack | 4S / Xeon 5th Gen | 24TB DDR5 | 8x 2.5" | OCP 3.0 + PCIe 5.0 | Max density vSphere hosts | ~$18,000 |
| PowerEdge R960 | 4U Rack | 4S / Xeon 5th Gen | 24TB DDR5 | 24x 2.5" | OCP 3.0 + PCIe 5.0 | Mission-critical vSphere | ~$25,000 |
| PowerEdge R750 | 2U Rack | 2S / Xeon 4th Gen | 4TB DDR4/5 | 26x 2.5" | 4x 1GbE + OCP 3.0 | vSAN-ready cluster nodes | ~$5,800 |
| PowerEdge R750xs | 2U Rack | 2S / Xeon 4th/5th Gen | 4TB DDR5 | 8x 2.5" or 4x 3.5" | 4x 1GbE + OCP 3.0 | Cost-efficient ESXi nodes | ~$5,200 |
| PowerEdge R660 | 1U Rack | 2S / Xeon 5th/6th Gen | 2TB DDR5 | 10x 2.5" | 4x 1GbE + OCP 3.0 | Dense ESXi node clusters | ~$4,500 |
| PowerEdge MX750c | Blade | 2S / Xeon 5th Gen | 8TB DDR5 | 2x NVMe M.2 | MX fabric via chassis | Blade VMware clusters | ~$7,500 |
| PowerEdge R550 | 2U Rack | 2S / Xeon 4th Gen | 2TB DDR4/5 | 16x 2.5" | 4x 1GbE + OCP 3.0 | Entry vSphere + vSAN | ~$3,800 |
| PowerEdge XE8545 | 4U Rack | 2S / AMD EPYC 3rd Gen | 4TB DDR4 | 4x NVMe | OCP 3.0 + PCIe 4.0 | AMD EPYC VMware + AI | ~$14,000 |

### VMware — Long descriptions

- **PowerEdge R760 (~$6,200).** Industry-standard 2U two-socket server and the most popular VMware vSphere ESXi host platform. Supports up to 32 DDR5 DIMMs (8TB), PCIe 5.0 expansion, and OCP 3.0 networking for flexible NIC options. Certified for VMware vSAN and vSphere 8, making it the go-to choice for general VMware clusters.
- **PowerEdge R760xa (~$9,000).** Accelerated 2U two-socket server supporting up to 4 GPUs for VMware vSphere environments running GPU-enabled workloads or Horizon VDI. Full VMware HCL certification with support for vGPU profiles via NVIDIA AI Enterprise. Suitable for mixed clusters combining standard VMs with GPU-accelerated workloads.
- **PowerEdge R860 (~$18,000).** Four-socket 2U powerhouse providing 96 DIMM slots (24TB DDR5) for ultra-dense VMware consolidation. Enables running 500+ VMs per host in memory-optimized configurations, reducing cluster node count and licensing costs. VMware vSAN ReadyNode certified for hyper-converged VMware deployments.
- **PowerEdge R960 (~$25,000).** Enterprise 4U four-socket server designed for the most demanding VMware workloads requiring extreme core counts and local storage. Supports 24 hot-plug drives for vSAN configurations and up to 24TB DDR5. Ideal for database, SAP, and ERP virtualization on VMware.
- **PowerEdge R750 (~$5,800).** Versatile 2U two-socket server featuring up to 26 hot-plug drive bays — among the highest in its class — making it ideal for vSAN all-flash or hybrid tiers. Supports 24 DIMM slots for up to 4TB memory and broad PCIe 4.0 expansion. VMware vSAN ReadyNode certified with NVMe-first drive support.
- **PowerEdge R750xs (~$5,200).** Streamlined 2U two-socket server delivering essential VMware capabilities at a lower price point. Certified for vSphere 8 and vSAN, with 24 DIMM slots and flexible drive configurations. Well-suited for SMB VMware environments, remote data centers, and budget-conscious expansion.
- **PowerEdge R660 (~$4,500).** High-density 1U platform enabling more VMware ESXi hosts per rack unit than any other 2-socket Dell server. Supports 16 DDR5 DIMM slots and ten 2.5" drives for local VM storage. Ideal for large VMware farms where maximizing host density per rack is a priority.
- **PowerEdge MX750c (~$7,500).** Full-width MX7000 blade compute module delivering two-socket VMware performance with unified chassis fabric. Eliminates top-of-rack switch cabling complexity and simplifies VMware lifecycle management via OpenManage. VMware vSphere certified with direct integration for vSAN HCI configurations.
- **PowerEdge R550 (~$3,800).** Entry-level 2U two-socket server combining adequate VMware compute with generous drive bay count for local vSAN storage. Up to 16 hot-plug drives support tiered vSAN configurations without external shared storage. A cost-effective starting point for 3-node or 4-node VMware clusters.
- **PowerEdge XE8545 (~$14,000).** 4U two-socket AMD EPYC-based server optimized for VMware deployments requiring high core density with up to 4 NVIDIA GPUs. Supports up to 128 EPYC cores and 4 double-width GPUs for AI-assisted VMware workloads. Ideal where AMD EPYC's large memory bandwidth and PCIe lane counts provide an advantage.

---

## 4. SAN Storage — Dell EMC arrays

Recommended Dell storage arrays for FC / iSCSI / NFS SAN environments. Prices are starting-config estimates; final pricing varies significantly with drive population.

| Model | Type | Max Raw Capacity | Max Flash Drives | Protocols | Max Hosts | Best For | Starting Price (USD) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dell EMC Unity XT 380F | All-Flash Array | 11.5 PB | 250 NVMe/SAS SSD | FC, iSCSI, NFS, SMB | 512 | Mid-range all-flash | ~$55,000 |
| Dell EMC Unity XT 480F | All-Flash Array | 16 PB | 500 NVMe/SAS SSD | FC, iSCSI, NFS, SMB | 1,024 | Mid-range scale-out flash | ~$90,000 |
| Dell EMC Unity XT 680F | All-Flash Array | 24 PB | 750 NVMe/SAS SSD | FC, iSCSI, NFS, SMB | 2,048 | High-end unified flash | ~$150,000 |
| Dell PowerStore 500T | All-Flash Array | 2.5 PB | 80 NVMe drives | FC, iSCSI, NFS, SMB | 256 | Entry AI-driven flash | ~$35,000 |
| Dell PowerStore 1200T | All-Flash Array | 7.6 PB | 250 NVMe drives | FC, iSCSI, NFS, SMB | 512 | Mid-range NVMe flash | ~$75,000 |
| Dell PowerStore 3200T | All-Flash Array | 22.8 PB | 1,500 NVMe drives | FC, iSCSI, NFS, SMB | 2,048 | High-end NVMe flash | ~$220,000 |
| Dell PowerVault ME5024 | SAN Block Storage | 3.84 PB | 24 SAS/NVMe SSD | FC 16Gbps, iSCSI | 64 | Departmental block SAN | ~$18,000 |
| Dell PowerVault ME5084 | SAN Block Storage | 15.36 PB | 84 SAS SSD/HDD | FC 16Gbps, iSCSI | 128 | High-capacity block SAN | ~$28,000 |
| Dell PowerStore 500H | Hybrid Array | 3.8 PB | 40 NVMe SSD | FC, iSCSI, NFS, SMB | 256 | Hybrid entry storage | ~$22,000 |
| Dell SC5020 | SAN Block Storage | 4.32 PB | 120 SAS SSD/HDD | FC 16Gbps, iSCSI 10G | 512 | Proven legacy block SAN | ~$30,000 |

### SAN Storage — Long descriptions

- **Dell EMC Unity XT 380F (~$55,000).** Entry-level all-flash Unity XT array designed for mixed file and block workloads in mid-range environments. Supports up to 250 flash drives with dual-active controllers for 99.9999% availability. Ideal for VMware, Hyper-V, and Oracle workloads requiring consistent low-latency storage.
- **Dell EMC Unity XT 480F (~$90,000).** Larger Unity XT all-flash platform offering double the drive capacity and host count versus the 380F model. Features non-disruptive upgrades, Always-On encryption, and native multi-cloud tiering to AWS/Azure. Well-suited for consolidating multiple storage islands into a single unified platform.
- **Dell EMC Unity XT 680F (~$150,000).** Top-of-range Unity XT array offering maximum capacity and host scalability for large enterprise environments. Supports unified NAS and block SAN on a single system, with inline deduplication and compression delivering up to 5:1 data reduction. Certified for SAP HANA, Oracle, and Microsoft SQL Server.
- **Dell PowerStore 500T (~$35,000).** Entry-level PowerStore appliance with AppsON capability to run VMware VMs directly on the array controller. Features always-on inline compression and deduplication with predictive analytics via CloudIQ. Excellent starting point for organizations modernizing from hybrid arrays to all-NVMe.
- **Dell PowerStore 1200T (~$75,000).** Mid-range PowerStore platform delivering NVMe-first performance with autonomous data management powered by machine learning. Supports scale-out federation with up to 4 nodes and seamless workload migration between nodes without downtime. Strong fit for tier-1 databases and virtual desktop infrastructure.
- **Dell PowerStore 3200T (~$220,000).** High-performance PowerStore node supporting the largest workloads with up to 22.8 PB raw capacity per node in a scale-out cluster. Delivers sub-500µs latency under sustained load with intelligent storage tiering across NVMe tiers. Purpose-built for enterprise databases, ERP systems, and AI/ML data pipelines.
- **Dell PowerVault ME5024 (~$18,000).** Dense 2U 24-bay SAS/NVMe storage array for block-only SAN workloads in mid-market environments. Supports dual active-active controllers for high availability and is optimized for VMware, Hyper-V, and SQL Server. Scales up to 10 enclosures with 240 total drives at a lower price point than enterprise arrays.
- **Dell PowerVault ME5084 (~$28,000).** 4U 84-bay large-form-factor expansion array delivering high drive density for capacity-intensive block SAN workloads. Can serve as primary storage or expansion shelf for ME5012/ME5024 arrays. Supports both SSD and nearline SAS HDD mix for tiered storage strategies.
- **Dell PowerStore 500H (~$22,000).** Cost-optimized hybrid PowerStore node combining NVMe flash and nearline SAS HDDs for tiered performance and capacity. Data management software automatically migrates hot data to flash and cold data to HDD tiers. Suitable for secondary workloads, backup targets, and archive storage alongside primary all-flash arrays.
- **Dell SC5020 (~$30,000).** Proven mid-range block SAN array widely deployed in VMware and Hyper-V environments for reliability and simplicity. Supports up to 120 drives across SSD and HDD tiers with automated tiering (Data Progression). Still widely found in enterprise environments and supported through Dell's extended lifecycle program.

---

## 5. Management Switches — Dell PowerSwitch

Recommended Dell PowerSwitch products for management networks, top-of-rack access, and spine/leaf fabrics. Prices are list estimates.

| Model | Ports | Uplinks | Speed | PoE | Layer | Best For | List Price (USD) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dell N3248TE-ON | 48x 1GbE RJ45 | 4x 10GbE SFP+ | 1GbE access / 10G uplink | No | L3 | Management & server access | ~$3,200 |
| Dell N3248P-ON | 48x 1GbE PoE+ | 4x 10GbE SFP+ | 1GbE access / 10G uplink | PoE+ 740W | L3 | PoE management network | ~$3,800 |
| Dell N2248PX-ON | 48x 1GbE/2.5GbE | 2x 10GbE SFP+ | Multi-Gig access | PoE+ 768W | L2+ | Multi-Gig PoE access | ~$4,200 |
| Dell N3224T-ON | 24x 1GbE RJ45 | 4x 10GbE SFP+ | 1GbE access / 10G uplink | No | L3 | Compact rack management | ~$2,200 |
| Dell S5248F-ON | 48x 25GbE SFP28 | 6x 100GbE QSFP28 | 25GbE access / 100G uplink | No | L3 | 25G spine / access | ~$12,000 |
| Dell N3248X-ON | 48x 10GbE SFP+ | 4x 25GbE SFP28 | 10GbE access / 25G uplink | No | L3 | 10GbE server access | ~$6,800 |
| Dell Z9264F-ON | 64x 100GbE QSFP28 | 2x 10GbE SFP+ | 100GbE spine | No | L3 | 100G spine / core | ~$38,000 |
| Dell N4032F-ON | 32x 10GbE SFP+ | 2x 40GbE QSFP+ | 10GbE aggregation | No | L3 | 10G aggregation layer | ~$5,500 |
| Dell N2024P-ON | 24x 1GbE PoE+ | 2x 10GbE SFP+ | 1GbE access | PoE+ 384W | L2+ | Small PoE management | ~$1,800 |
| Dell S5296F-ON | 96x 25GbE SFP28 | 8x 100GbE QSFP28 | 25GbE leaf | No | L3 | Large 25G leaf | ~$22,000 |

### Switches — Long descriptions

- **Dell N3248TE-ON (~$3,200).** 48-port 1GbE access switch with 4x 10GbE SFP+ uplinks for server management networks and iDRAC/BMC connectivity. Open Networking (ON) platform supports NOS-agnostic operation and full L3 routing including OSPF and BGP. Ideal as the top-of-rack management switch in a data-center cluster environment.
- **Dell N3248P-ON (~$3,800).** PoE+-enabled 48-port 1GbE switch with 740W total PoE budget for IP cameras, phones, and access points in the management plane. Same L3 feature set as N3248TE-ON with OSPF, BGP, and VRF support. Suitable for combined management and PoE infrastructure in SMB-to-enterprise deployments.
- **Dell N2248PX-ON (~$4,200).** 48-port multi-gigabit (1G/2.5G) switch with PoE+ for connecting modern Wi-Fi 6/6E access points that require 2.5GbE backhaul. Delivers 768W total PoE budget with smart classification for power-hungry devices. Suitable for the management network segment supporting wireless infrastructure and IP devices.
- **Dell N3224T-ON (~$2,200).** Compact 24-port 1GbE switch for smaller racks or auxiliary management networks requiring full L3 capability. Cost-effective footprint for dedicated iDRAC, IPMI, or out-of-band management VLANs. Shares the same OS10 software platform as larger N-series switches for operational consistency.
- **Dell S5248F-ON (~$12,000).** High-performance 48-port 25GbE switch with 6x 100GbE QSFP28 uplinks for data-plane leaf switching in VMware or Hyper-V clusters. Open Networking design supports SONiC, OS10, or customer NOS for maximum flexibility. Delivers line-rate non-blocking switching at 2.56 Tbps aggregate throughput.
- **Dell N3248X-ON (~$6,800).** Dense 48-port 10GbE SFP+ switch for connecting servers via 10G fiber in mid-size VMware/Hyper-V clusters. Provides L3 routing (OSPF, BGP, ECMP) and full VLAN/VRF support for multi-tenant data center environments. 4x 25GbE uplinks allow cost-effective aggregation to a higher-layer spine.
- **Dell Z9264F-ON (~$38,000).** High-capacity 100GbE spine switch delivering 6.4 Tbps aggregate switching for large-scale data-center fabrics. 64-port 100GbE design supports CLOS fabric architectures connecting multiple 25GbE leaf switches in VMware NSX or BGP EVPN underlay networks. Designed for cloud-scale data-center networking.
- **Dell N4032F-ON (~$5,500).** 32-port 10GbE aggregation switch providing high-density server connectivity with 40GbE uplinks for spine connection. Full L3 feature set including VXLAN, EVPN, and ECMP for modern virtualized data centers. Often deployed as a second-tier aggregation switch feeding a 40G or 100G spine.
- **Dell N2024P-ON (~$1,800).** Entry 24-port PoE+ switch for small cluster management networks needing power delivery to IP devices. 384W total PoE budget covers up to 24 IEEE 802.3af/at powered devices simultaneously. Suitable for small data-center racks or remote office server management networks.
- **Dell S5296F-ON (~$22,000).** Double-density 25GbE leaf switch with 96 server-facing ports and 8x 100GbE uplinks for large VMware or Hyper-V clusters needing high port-count leaf nodes. Ideal for hyperscale-style leaf-spine architectures where a single switch must serve a full rack of 25GbE-connected servers.

---

## 6. CPU options — Intel Xeon & AMD EPYC

Intel RCP = 1,000-unit tray price from Intel ARK. AMD prices from official AMD pricelists. Both Intel (FCLGA4677 / FCLGA4710) and AMD (SP5) platforms are covered.

| Dell SKU | Processor | Cores / Threads | Base / Boost GHz | TDP | Cache | Memory Support | Socket | Gen / Platform | Best For | RCP Price (USD) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 338-CPBT | Intel Xeon Platinum 8562Y+ | 32C / 64T | 2.8 / 4.0 GHz | 300W | 60MB L3 | DDR5-5600 8-ch | FCLGA4677 | 5th Gen / Emerald Rapids | High-core HPC & virtualization | $5,945 |
| 338-CHTM | Intel Xeon Platinum 8462Y+ | 32C / 64T | 2.8 / 4.0 GHz | 300W | 60MB L3 | DDR5-4800 8-ch | FCLGA4677 | 4th Gen / Sapphire Rapids | Dense VMware / Hyper-V hosts | $5,945 |
| 338-CSKK | Intel Xeon 6747P | 48C / 96T | 2.7 / 3.8 GHz | 500W | 128MB L3 | DDR5-5600 8-ch | FCLGA4710 | 6th Gen / Granite Rapids | Extreme core density AI+virt | $7,277 |
| 338-CHTB | Intel Xeon Platinum 8468 | 48C / 96T | 2.1 / 3.8 GHz | 350W | 105MB L3 | DDR5-4800 8-ch | FCLGA4677 | 4th Gen / Sapphire Rapids | Highest-core Sapphire host | $7,121 |
| 338-CHSJ | Intel Xeon Gold 6442Y | 24C / 48T | 2.6 / 4.0 GHz | 225W | 60MB L3 | DDR5-4800 8-ch | FCLGA4677 | 4th Gen / Sapphire Rapids | Balanced mid-range cluster node | $2,878 |
| 338-CPBV | Intel Xeon Gold 6526Y | 16C / 32T | 2.8 / 4.0 GHz | 195W | 37.5MB L3 | DDR5-5200 8-ch | FCLGA4677 | 5th Gen / Emerald Rapids | Cost-efficient 5th Gen node | $1,517 |
| 338-CHSS | Intel Xeon Gold 5415+ | 8C / 16T | 2.9 / 4.1 GHz | 150W | 22.5MB L3 | DDR5-4400 8-ch | FCLGA4677 | 4th Gen / Sapphire Rapids | Entry cluster / edge compute | $1,066 |
| 338-BWMS | AMD EPYC 9354 | 32C / 64T | 2.4 / 3.8 GHz | 280W | 256MB L3 | DDR5-4800 12-ch | SP5 | 4th Gen / Genoa | High memory BW VMware nodes | $2,337 |
| 338-BWNK | AMD EPYC 9454 | 48C / 96T | 2.75 / 3.8 GHz | 290W | 256MB L3 | DDR5-4800 12-ch | SP5 | 4th Gen / Genoa | Dense vSphere / HPC workloads | $3,619 |
| 338-BWND | AMD EPYC 9554 | 64C / 128T | 3.1 / 3.75 GHz | 360W | 256MB L3 | DDR5-4800 12-ch | SP5 | 4th Gen / Genoa | Max core AMD cluster node | $5,765 |

---

## 7. RAM Memory — DDR4 & DDR5 ECC RDIMM

All modules are ECC Registered DIMMs (RDIMM). DDR5 5600 MT/s requires 5th/6th Gen Intel (FCLGA4677 / FCLGA4710). Prices are market estimates.

| Dell SKU | Capacity | Type | Speed | Ranks | Voltage | ECC | Compatible Sockets | Best For | Est. Price (USD) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 370-BCKK | 16GB RDIMM DDR5 | RDIMM | 5600 MT/s | 1Rx8 SR | 1.1V | ECC Reg | FCLGA4677 / FCLGA4710 | Entry Hyper-V / VMware nodes | ~$75 |
| 370-BCLF | 32GB RDIMM DDR5 | RDIMM | 5600 MT/s | 1Rx4 SR | 1.1V | ECC Reg | FCLGA4677 / FCLGA4710 | Standard cluster nodes 512GB+ | ~$120 |
| 370-BBQQ | 64GB RDIMM DDR5 | RDIMM | 4800 MT/s | 2Rx4 DR | 1.1V | ECC Reg | FCLGA4677 / FCLGA4710 | High-density vSphere hosts | ~$220 |
| 370-BCJN | 128GB RDIMM DDR5 | RDIMM | 5600 MT/s | 2Rx4 DR | 1.1V | ECC Reg | FCLGA4677 / FCLGA4710 | Max memory R760 / R860 hosts | ~$550 |
| 370-BCQW | 96GB RDIMM DDR5 | RDIMM | 5600 MT/s | 2Rx4 DR | 1.1V | ECC Reg | FCLGA4677 / FCLGA4710 | Balanced large-memory configs | ~$380 |
| 370-BCJO | 256GB RDIMM DDR5 | RDIMM | 5600 MT/s | 4Rx4 QR | 1.1V | ECC Reg | FCLGA4677 / FCLGA4710 | R860 / R960 24TB builds | ~$1,200 |
| 370-AGLS | 32GB RDIMM DDR4 | RDIMM | 3200 MT/s | 2Rx4 DR | 1.2V | ECC Reg | FCLGA4189 | 3rd Gen Ice Lake server upgrade | ~$85 |
| 370-AGLT | 64GB RDIMM DDR4 | RDIMM | 3200 MT/s | 2Rx4 DR | 1.2V | ECC Reg | FCLGA4189 | Ice Lake density expansion | ~$160 |
| 370-AGLU | 128GB RDIMM DDR4 | RDIMM | 3200 MT/s | 4Rx4 QR | 1.2V | ECC Reg | FCLGA4189 | Max memory 3rd Gen systems | ~$420 |
| 370-BCJP | 64GB RDIMM DDR5 | RDIMM | 4800 MT/s | 2Rx4 DR | 1.1V | ECC Reg | SP5 (EPYC 9xxx) | AMD EPYC Genoa cluster nodes | ~$220 |

---

## 8. Storage & SSD — SATA / SAS / NVMe / HDD

Covers SATA SSD (budget), SAS SSD (enterprise reliability), NVMe U.2 PCIe (performance), and nearline HDD (bulk capacity). **DWPD** = Drive Writes Per Day.

| Dell SKU | Capacity | Type | Interface | Form Factor | DWPD | Seq Read | Seq Write | Best For | Est. Price (USD) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 400-BDPF | 480GB SSD | SATA Read Intensive | SATA 6Gbps | 2.5" Hot-Plug AG | 1 DWPD | 560 MB/s | 340 MB/s | Boot / OS drives | ~$150 |
| 400-BDWN | 960GB SSD | SATA Read Intensive | SATA 6Gbps | 2.5" Hot-Plug AG | 1 DWPD | 560 MB/s | 380 MB/s | VM datastores (SATA tier) | ~$220 |
| 400-BDWO | 1.92TB SSD | SATA Read Intensive | SATA 6Gbps | 2.5" Hot-Plug AG | 1 DWPD | 560 MB/s | 390 MB/s | High-capacity SATA tier | ~$380 |
| 400-BDWP | 3.84TB SSD | SATA Read Intensive | SATA 6Gbps | 2.5" Hot-Plug AG | 1 DWPD | 560 MB/s | 390 MB/s | Dense SATA capacity | ~$700 |
| 345-BEOZ | 1.6TB SAS SSD | SAS Mixed Use | SAS 24Gbps | 2.5" Hot-Plug | 3 DWPD | 2,400 MB/s | 2,000 MB/s | Mixed read/write workloads | ~$800 |
| 345-BELG | 7.68TB SAS SSD | SAS Read Intensive | SAS 24Gbps | 2.5" Hot-Plug | 1 DWPD | 2,200 MB/s | 700 MB/s | High-capacity SAS SSD | ~$1,800 |
| 400-BRPH | 1.6TB NVMe SSD | NVMe Mixed Use | NVMe PCIe 4.0 U.2 | U.2 Hot-Plug | 3 DWPD | 6,800 MB/s | 4,000 MB/s | NVMe performance tier | ~$700 |
| 400-BMTN | 3.84TB NVMe SSD | NVMe Read Intensive | NVMe PCIe 4.0 U.2 | U.2 Hot-Plug | 1 DWPD | 6,500 MB/s | 3,500 MB/s | Large NVMe capacity tier | ~$950 |
| 400-AUWK | 12TB HDD | Nearline SATA | SATA 6Gbps | 3.5" LFF Hot-Plug | — | 250 MB/s | 240 MB/s | Bulk capacity / backup tier | ~$280 |
| 400-BLLF | 18TB HDD | Nearline SAS | SAS 12Gbps | 3.5" LFF Hot-Plug | — | 260 MB/s | 250 MB/s | Max-capacity archive / SAN | ~$430 |

### Storage — Long descriptions

- **400-BDPF — 480GB SATA SSD (~$150).** Entry-level SATA SSD for server OS boot drives and low-write application storage. 2.5" hot-plug drive carrier included for tool-less installation in PowerEdge hot-plug bays. 1 DWPD endurance rating is ideal for read-heavy database logs and virtual machine templates.
- **400-BDWN — 960GB SATA SSD (~$220).** 1TB-class SATA SSD balancing capacity and cost for VMware and Hyper-V datastores in budget-conscious deployments. 1 DWPD endurance suitable for mixed read/write VM workloads with moderate write intensity. Can serve as a cost-effective vSAN capacity tier alongside NVMe performance tier.
- **400-BDWO — 1.92TB SATA SSD (~$380).** 2TB-class SATA read-intensive SSD for applications where capacity density per bay is more important than peak write performance. Suitable for log archival, read-heavy analytics, and warm-tier VMware datastores. 1 DWPD endurance and competitive cost-per-TB make this a strong vSAN capacity drive.
- **400-BDWP — 3.84TB SATA SSD (~$700).** 4TB-class SATA SSD enabling very high storage density in PowerEdge servers without sacrificing drive bay count. 8 bays × 3.84TB = 30.7TB usable per 1U server before RAID overhead. Ideal for NFS datastores, Hyper-V CSV volumes, and backup-to-disk targets.
- **345-BEOZ — 1.6TB SAS Mixed-Use SSD (~$800).** Enterprise SAS 24Gbps mixed-use SSD delivering up to 2.4 GB/s sequential read with 3 DWPD endurance for sustained write workloads. SAS dual-port design provides path redundancy for mission-critical database and OLTP workloads. Compatible with SAS 12/24Gbps HBAs and PERC RAID controllers.
- **345-BELG — 7.68TB SAS Read-Intensive SSD (~$1,800).** 8TB-class SAS read-intensive SSD delivering the highest capacity per 2.5" bay for read-heavy consolidated workloads. Dual-port SAS design ensures availability in redundant RAID configurations. Well-suited for large read-intensive databases, warm analytics tiers, and NFS capacity pools.
- **400-BRPH — 1.6TB NVMe Mixed-Use SSD (~$700).** PCIe Gen4 NVMe U.2 mixed-use SSD for the highest-performance storage tier in VMware vSAN or Hyper-V S2D clusters. 6.8 GB/s sequential read and 3 DWPD endurance make it suitable as both a vSAN cache tier and all-flash capacity tier. Requires NVMe U.2 backplane or NVMe HBA in the host server.
- **400-BMTN — 3.84TB NVMe Read-Intensive SSD (~$950).** 4TB PCIe Gen4 NVMe U.2 SSD offering excellent capacity at NVMe speeds for vSAN all-flash capacity tiers. 6.5 GB/s reads at under 100µs latency outperform any SAS or SATA SSD by a significant margin. Ideal for tier-1 all-NVMe vSAN datastores in R750, R760, and R760xa servers.
- **400-AUWK — 12TB Nearline SATA HDD (~$280).** 12TB 7,200 RPM nearline SATA HDD for cost-effective bulk storage in capacity-tier vSAN, NFS backup targets, and archive workloads. Hot-plug LFF drive carrier included for tool-less replacement in PowerEdge LFF bays. Lowest cost-per-TB option suitable for cold data and backup repositories.
- **400-BLLF — 18TB Nearline SAS HDD (~$430).** 18TB SAS nearline HDD for maximum capacity density in PowerVault ME5-series arrays and LFF-configured PowerEdge servers. Dual-port SAS ensures continued access during path failures in redundant HBA configurations. Excellent economics for cold archive, backup, and compliance storage tiers.

---

## 8b. Notes & deviations from xlsx

The xlsx is the **primary source** for this catalog, but a few entries had to be added or trimmed so the UI can faithfully reflect the Avaya BoQ. Each deviation is called out in `catalog-data.ts` with an inline comment.

| Item | Status | Why |
| --- | --- | --- |
| **Dell EMC S5224F-ON** (ToR Switches) | **Added** | Avaya BoQ ships this 24-port 25GbE ToR. xlsx switch sheet only contains S5248F-ON (48-port) and S5296F-ON (96-port). |
| Curated ToR alternatives (S5232F-ON, S4148F-ON) | **Added** | Provide a coherent family ladder around S5224F-ON. S5248F-ON / S5296F-ON come straight from the xlsx Switch sheet. |
| Management-only switches (N3248P-ON, N2248PX-ON, N3224T-ON, N2024P-ON) | **Kept** under Management Switch subsystem only | Dropping them from the ToR list keeps that catalog meaningful (no 1GbE PoE rows under a 25GbE ToR). |
| **Connectrix DS-6610B / DS-7720B / DS-7730B / DS-5300B** (SAN Switches) | **Added** as a dedicated FC list | The xlsx Switch sheet is Ethernet-only. SAN switches in the Avaya BoQ are Brocade-based Fibre Channel; mixing them into PowerSwitches would have been misleading. |
| Network NIC SKUs (`nic-*`) | **Synthesised** | xlsx does not enumerate NICs. SKUs reflect the Broadcom 57414 / 5720 in the Avaya BoQ plus three industry-standard alternatives. |
| Power supply SKUs (`psu-*`) | **Synthesised** | xlsx does not enumerate PSUs. SKUs reflect the 800W redundant config in the Avaya BoQ plus four family alternatives. |

Each synthesised entry's `description` notes the provenance so the data trail stays honest.

---

## 9. Usage notes (for the configurator codebase)

- **Server platforms** (sections 2–3) share many models between Hyper-V and VMware sheets — when modelling them in `fake-data.ts`, prefer a **single `Server` record** keyed by model name and tag with supported cluster types (`["hyperv"]`, `["vmware"]`, or both) so we don't duplicate descriptions.
- **CPU / RAM / Storage** sheets are the **component catalog** — they map cleanly to the existing `HardwareComponent` shape (`category`, `qty`, `name`, `subtitle`, etc.). Use the **Dell SKU** column as a stable `id`.
- **Switches** (section 5) are infrastructure-level items that live in the **rack** rather than a single subsystem. They can be modelled as their own subsystem (`category: "network"`) at the top of the rack.
- **SAN Storage** (section 4) belongs to **shared infrastructure** (typically a dedicated storage rack). Treat each array as its own subsystem with `category: "storage-array"`.
- Prices that begin with `~$` are **rough estimates** — render them with a leading "~" in the UI so users understand they are not contractual.
- Intel CPU prices are **RCP** (tray, 1,000-unit), not street price — note this in any UI tooltip alongside the value.

---

## 10. Quick reference — price extremes

| Range | Lowest | Highest |
| --- | --- | --- |
| **Servers (Hyper-V)** | R450 — ~$3,200 | R960 — ~$25,000 |
| **Servers (VMware)** | R550 — ~$3,800 | R960 — ~$25,000 |
| **SAN Storage** | PowerVault ME5024 — ~$18,000 | PowerStore 3200T — ~$220,000 |
| **Switches** | N2024P-ON — ~$1,800 | Z9264F-ON — ~$38,000 |
| **CPUs (RCP)** | Xeon Gold 5415+ — $1,066 | Xeon 6747P — $7,277 |
| **RAM** | 16GB DDR5 RDIMM (370-BCKK) — ~$75 | 256GB DDR5 RDIMM (370-BCJO) — ~$1,200 |
| **Storage** | 480GB SATA SSD (400-BDPF) — ~$150 | 7.68TB SAS SSD (345-BELG) — ~$1,800 |
