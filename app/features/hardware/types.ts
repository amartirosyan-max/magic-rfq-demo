/**
 * Hardware configurator — type definitions.
 *
 * Source of truth for the data shape rendered in the Avaya project's Design tab.
 * Data values come from the Avaya proposal BoQ (see
 * app/docs/features/hardware-configurator/source/avaya-ipo200.txt).
 * UI / structure: see app/docs/features/hardware-configurator/READY.md.
 */

/* -------------------------------------------------------------------------- */
/*  Components — the rows inside a chassis on Screen C                        */
/* -------------------------------------------------------------------------- */

/**
 * The 5 component categories surfaced on Screen C, after applying the
 * "asset ∩ proposal" filter (see DATA-ANALYSIS.md §13).
 *
 * Each category maps 1:1 to a PNG icon under
 * `app/assets/hardware/verstka/Component_*.png`.
 */
export type ComponentCategory =
  | "cpu"
  | "memory"
  | "storage"
  | "network"
  | "power"
  | "gpu";

/** A single row in the chassis component list. */
export interface HardwareComponent {
  id: string;
  category: ComponentCategory;
  /** Display label, e.g. "CPU", "Memory", "Hard Drive / SSD" */
  categoryLabel: string;
  /** Verbatim spec line from the BoQ */
  description: string;
  /** Quantity per single chassis (R660 has 2 CPUs, 4 DIMMs, etc.) */
  qty: number;
}

/* -------------------------------------------------------------------------- */
/*  Chassis — one type of physical box                                        */
/* -------------------------------------------------------------------------- */

/** Drives the rack image and the Screen-C behaviour. */
export type SubsystemKind = "compute" | "storage" | "switch";

export interface Chassis {
  id: string;
  /** Vendor + product name, e.g. "Dell PowerEdge R660" */
  name: string;
  /** Vendor short string, used for asset lookup / future theming */
  vendor: string;
  /** Height in rack units */
  sizeU: number;
  /** Filename under `app/assets/hardware/verstka/` */
  image: string;
  /** One-sentence summary for the hero card on Screen C */
  description: string;
  /** Optional power/heat numbers for the chassis hero card */
  watts?: number;
  btuPerHr?: number;
}

/* -------------------------------------------------------------------------- */
/*  Subsystem — unit of navigation in the left sidebar                        */
/* -------------------------------------------------------------------------- */

export interface Subsystem {
  id: string;
  /** Label in the left-sidebar nav, e.g. "Hyper-v cluster" */
  name: string;
  /** Suffix used on the Screen C title:
   *  `{qty} × {chassis.name} — {titleSuffix}` */
  titleSuffix: string;
  kind: SubsystemKind;
  /** How many chassis instances are in this subsystem */
  qty: number;
  /** Canonical chassis spec shared by all instances */
  chassis: Chassis;
  /** Component rows on Screen C — empty for switch subsystems */
  components: HardwareComponent[];
}

/* -------------------------------------------------------------------------- */
/*  Racks — physical placement on the canvas                                  */
/* -------------------------------------------------------------------------- */

/** A single chassis placed in a rack at a specific U position. */
export interface RackUnit {
  id: string;
  /** Which subsystem this unit belongs to */
  subsystemId: string;
  /** Bottom U position (U numbering: 1 = bottom, 42 = top) */
  positionU: number;
  /** How many U this unit consumes */
  sizeU: number;
}

/**
 * Discriminator used by the rack constructor to pick a render variant.
 *
 *   - `rack-42u` / `rack-21u` / `rack-12u`  → render with `RackFrame`
 *     (top SVG + N × unit slot + bottom SVG). `heightU` MUST match the
 *     numeric suffix.
 *   - `standalone`                          → render with `StandaloneNode`,
 *     no rack frame at all. `heightU` is ignored (use 0 or the chassis sizeU).
 *
 * The constructor accepts any kind without code changes — adding a new
 * fixed size (e.g. `"rack-24u"`) is a one-line addition here plus its
 * `heightU` value in the data.
 */
export type RackKind = "rack-42u" | "rack-21u" | "rack-12u" | "standalone";

export interface Rack {
  id: string;
  /** Long name shown on Screen B title, e.g. "Infrastructure Rack 01" */
  name: string;
  /** Short label shown above the rack column on Screen A */
  shortLabel: string;
  /**
   * Render variant. Discriminates between framed racks (42U / 21U / 12U)
   * and frameless `standalone` chassis groups. See `RackKind`.
   */
  kind: RackKind;
  /** Total rack height in U (ignored when `kind === "standalone"`). */
  heightU: number;
  /** Physical units placed in the rack (empty for flanking racks) */
  units: RackUnit[];
  /** If true the rack renders as a frame only (no contents, no label) */
  isEmpty: boolean;
  /**
   * Two-line title rendered above the rack column on Screen A.
   * When omitted (e.g. empty flanking racks) no title is drawn.
   */
  columnLabel?: { line1: string; line2: string };
}

/* -------------------------------------------------------------------------- */
/*  Catalog — the right sidebar                                                */
/* -------------------------------------------------------------------------- */

export type CatalogStatus = "in-proposal" | "removed" | "not-in-proposal";

export interface CatalogEntry {
  id: string;
  name: string;
  status: CatalogStatus;
  description: string;
  /** Optional image filename under `app/assets/hardware/verstka/` */
  image?: string;

  /* -------------- Optional enrichments (Catalog L1 / L2) -----------------
   * These let the same `<CatalogEntryCard>` represent project-level
   * subsystem categories AND product-level alternatives (servers, SAN,
   * switches, CPUs, RAM, …) without forking the visual identity. */
  /** Formatted price string, e.g. "~$4,500" or "$5,945" (RCP). */
  price?: string;
  /** Short marketing tag — "Dense compute nodes", "5th Gen". */
  bestFor?: string;
  /** Optional one-liner spec row above the description, e.g.
   *  "32C / 64T · 300W · 60MB L3". */
  spec?: string;
}

/* -------------------------------------------------------------------------- */
/*  Project — the top of the tree                                              */
/* -------------------------------------------------------------------------- */

export interface HardwareProject {
  id: string;
  name: string;
  /** Short customer label, e.g. "Avaya" or "ADGSA" */
  clientName: string;
  /** One-paragraph description for the left-sidebar `ProjectResponse` payload */
  description: string;
  /** Industry tag for the `ProjectResponse` payload */
  industry: string;
  /** Route path that hosts this project, e.g. "/avaya" or "/adgsa-ai" */
  routePath: string;
  /** Display string, e.g. "9.6/10" */
  leadScore: string;
  /** Single number shown next to "Grand Total" in the left sidebar */
  grandTotalUSD: number;
  /** Display order matches the left-sidebar nav */
  subsystems: Subsystem[];
  /** Display order matches Screen A: [empty, Rack 01, Rack 02, empty] */
  racks: Rack[];
  /**
   * Right sidebar — Screen A/B context.
   * High-level "subsystem categories" with status badges.
   */
  subsystemCategories: CatalogEntry[];
  /**
   * Right sidebar — Screen C context, scoped by subsystem id.
   * Each list is the set of alternative products shown when that subsystem
   * is open in the cluster component view.
   */
  productAlternatives: Record<string, CatalogEntry[]>;
  /**
   * Right sidebar — L2 component-swap catalog, scoped by `subsystem id →
   * component category`. When a (subsystem, category) is present here, the
   * "swap this part" list for that chassis uses these project-specific
   * SKUs instead of the shared `componentCatalog` in `catalog-data.ts`.
   * Falls back to the shared catalog for any (subsystem, category) absent
   * from this map. Optional — projects that don't define it behave exactly
   * as before (shared catalog everywhere).
   */
  componentAlternatives?: Record<
    string,
    Partial<Record<ComponentCategory, CatalogEntry[]>>
  >;
}
