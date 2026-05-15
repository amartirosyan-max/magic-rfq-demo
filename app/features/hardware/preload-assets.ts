/**
 * Hardware-configurator asset preload manifest.
 *
 * Every image / SVG that the hardware feature paints into the canvas is
 * imported once here. Each import returns the Vite-hashed asset URL,
 * which the route's `links()` export then declares as a
 * `<link rel="preload" as="image">` in the document <head>.
 *
 * Why this matters for THIS app:
 *
 *   - The rack frame + four server-chassis PNGs (~4 MB combined) and the
 *     blueprint-grid tile show up in the first paint of Screen A. If the
 *     browser only discovers them once React has mounted and `<img>`
 *     tags exist, users see the empty rack frame for a beat. Preloading
 *     starts those fetches in parallel with the JS bundle download.
 *   - The five component-hero PNGs (CPU / RAM / HDD / Network / Power)
 *     are large (~700K–1.5 MB) and the *first* subsystem click reveals
 *     them. Preloading them keeps the Screen A → Screen C transition
 *     instant on slow networks.
 *   - The two logos and the rack-frame background are tiny but still
 *     benefit from being declared once at the document level so the
 *     browser's preload scanner sees them before parsing the bundle.
 *
 * Tiers:
 *   - `critical`  — first paint on /avaya (rack canvas + chrome).
 *                   Marked `fetchPriority: "high"` so they jump the
 *                   queue ahead of analytics / DevTools scripts.
 *   - `deferred`  — needed only after a user drills into a subsystem
 *                   (Screen C). Preloaded with normal priority so the
 *                   critical tier still wins the bandwidth battle.
 *
 * Vite content-hashes assets, so importing the same physical file from
 * `verstka/` and `PNG+SVG/` produces the same URL — `dedupeByHref`
 * collapses the list before it ever reaches the network.
 */

import bgBlueJpg from "~/assets/hardware/PNG+SVG/BG_Blue.jpg";
import gridTilePng from "~/assets/hardware/PNG+SVG/BG_Blue_Grid_Tile_2.png";
import logoMarkSvg from "~/assets/hardware/verstka/Logo.svg";
import logoTextSvg from "~/assets/hardware/verstka/Logo_text.svg";
import rackFramePng from "~/assets/hardware/verstka/Server_BG.png";
/* Real product photos — one per chassis SKU shipped across the demo's
 * two projects (Avaya + ADGSA-AI). Both routes share this manifest so
 * the first paint of /adgsa-ai doesn't show empty rack frames either. */
import productR660 from "~/assets/hardware/products/Dell-PowerEdge-R660.png";
import productR760 from "~/assets/hardware/products/Dell-PowerEdge-R760.png";
import productUnity380F from "~/assets/hardware/products/DELL-UNITY-XT-380F.png";
import productDS6610B from "~/assets/hardware/products/Dell-Connectrix-DS-6610B.png";
import productS5224F from "~/assets/hardware/products/Dell-EMC-S5224F-ON.png";
import productN3248 from "~/assets/hardware/products/Dell-EMC-N3248TE-ON.png";
import productXE9680 from "~/assets/hardware/products/PowerEdge-XE9680.png";
import productF710 from "~/assets/hardware/products/PowerScale-F710.png";
import productS5232 from "~/assets/hardware/products/PowerSwitch-S5232.png";
import productSN2201 from "~/assets/hardware/products/Nvidia-SN2201.png";
import productSN5600 from "~/assets/hardware/products/NVIDIA Spectrum-4 SN5600.png";

import componentCpuVerstka from "~/assets/hardware/verstka/Component_CPU.png";
import componentHddVerstka from "~/assets/hardware/verstka/Component_HDD.png";
import componentNetworkVerstka from "~/assets/hardware/verstka/Component_Network.png";
import componentPowerVerstka from "~/assets/hardware/verstka/Component_Power.png";
import componentRamVerstka from "~/assets/hardware/verstka/Component_RAM.png";

import componentCpuPng from "~/assets/hardware/PNG+SVG/Component_CPU.png";
import componentGpuPng from "~/assets/hardware/PNG+SVG/Component_GPU.png";
import componentHddPng from "~/assets/hardware/PNG+SVG/Component_HDD.png";
import componentNetworkPng from "~/assets/hardware/PNG+SVG/Component_Network.png";
import componentPowerPng from "~/assets/hardware/PNG+SVG/Component_Power.png";
import componentRamPng from "~/assets/hardware/PNG+SVG/Component_RAM.png";

export interface PreloadAsset {
  href: string;
  type: "image/png" | "image/jpeg" | "image/svg+xml" | "image/webp";
  /** "high" jumps the network queue, "auto" lets the browser decide. */
  priority: "high" | "auto";
}

/** Visible on first paint of /avaya — rack canvas + top chrome + sidebar logo. */
const critical: PreloadAsset[] = [
  /* BG_Blue.jpg is the cover-fill base of the entire canvas (per
   * Dr. Artemy's 2026-05-13 design comment) — biggest visible surface
   * on first paint, so it leads the high-priority list. */
  { href: bgBlueJpg, type: "image/jpeg", priority: "high" },
  { href: gridTilePng, type: "image/png", priority: "high" },
  { href: rackFramePng, type: "image/png", priority: "high" },
  /* Avaya chassis */
  { href: productR660, type: "image/png", priority: "high" },
  { href: productR760, type: "image/png", priority: "high" },
  { href: productUnity380F, type: "image/png", priority: "high" },
  { href: productDS6610B, type: "image/png", priority: "high" },
  { href: productS5224F, type: "image/png", priority: "high" },
  { href: productN3248, type: "image/png", priority: "high" },
  /* ADGSA-AI chassis (R660 is shared and already declared above) */
  { href: productXE9680, type: "image/png", priority: "high" },
  { href: productF710, type: "image/png", priority: "high" },
  { href: productS5232, type: "image/png", priority: "high" },
  { href: productSN2201, type: "image/png", priority: "high" },
  { href: productSN5600, type: "image/png", priority: "high" },
  { href: logoMarkSvg, type: "image/svg+xml", priority: "high" },
  { href: logoTextSvg, type: "image/svg+xml", priority: "high" },
];

/** Lit up only after the user drills into Screen C / the catalog. */
const deferred: PreloadAsset[] = [
  { href: componentCpuVerstka, type: "image/png", priority: "auto" },
  { href: componentRamVerstka, type: "image/png", priority: "auto" },
  { href: componentHddVerstka, type: "image/png", priority: "auto" },
  { href: componentNetworkVerstka, type: "image/png", priority: "auto" },
  { href: componentPowerVerstka, type: "image/png", priority: "auto" },
  { href: componentCpuPng, type: "image/png", priority: "auto" },
  { href: componentRamPng, type: "image/png", priority: "auto" },
  { href: componentHddPng, type: "image/png", priority: "auto" },
  { href: componentNetworkPng, type: "image/png", priority: "auto" },
  { href: componentPowerPng, type: "image/png", priority: "auto" },
  /* GPU category icon (used by the XE9680 component list on /adgsa-ai) */
  { href: componentGpuPng, type: "image/png", priority: "auto" },
];

/**
 * Filter + dedupe pass before the list is emitted into the document head.
 *
 *   1. **Drop `data:` URIs.** Vite inlines assets under the
 *      `assetsInlineLimit` (4 KB by default) as base64 data-URIs. A
 *      `<link rel="preload" href="data:…">` is wasted bytes — the asset
 *      bytes are already in the HTML payload, so there's no network
 *      fetch for the browser to start early.
 *   2. **Collapse duplicates by `href`.** Vite content-hashes assets, so
 *      importing the same physical file from `verstka/` and `PNG+SVG/`
 *      produces the same URL. Keep the *first* occurrence so a critical
 *      entry wins over a deferred one with the same content.
 */
function normaliseManifest(list: PreloadAsset[]): PreloadAsset[] {
  const seen = new Set<string>();
  const out: PreloadAsset[] = [];
  for (const entry of list) {
    if (entry.href.startsWith("data:")) continue;
    if (seen.has(entry.href)) continue;
    seen.add(entry.href);
    out.push(entry);
  }
  return out;
}

export const hardwarePreloadAssets: PreloadAsset[] = normaliseManifest([
  ...critical,
  ...deferred,
]);
