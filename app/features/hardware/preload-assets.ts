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

import gridTilePng from "~/assets/hardware/PNG+SVG/BG_Blue_Grid_Tile_2.png";
import logoMarkSvg from "~/assets/hardware/verstka/Logo.svg";
import logoTextSvg from "~/assets/hardware/verstka/Logo_text.svg";
import rackFramePng from "~/assets/hardware/verstka/Server_BG.png";
import serverDell01Png from "~/assets/hardware/verstka/Server_Dell_01.png";
import serverDell02Png from "~/assets/hardware/verstka/Server_Dell_02.png";
import serverDell03Png from "~/assets/hardware/verstka/Server_Dell_03.png";
import serverDell04Png from "~/assets/hardware/verstka/Server_Dell_04.png";

import componentCpuVerstka from "~/assets/hardware/verstka/Component_CPU.png";
import componentHddVerstka from "~/assets/hardware/verstka/Component_HDD.png";
import componentNetworkVerstka from "~/assets/hardware/verstka/Component_Network.png";
import componentPowerVerstka from "~/assets/hardware/verstka/Component_Power.png";
import componentRamVerstka from "~/assets/hardware/verstka/Component_RAM.png";

import componentCpuPng from "~/assets/hardware/PNG+SVG/Component_CPU.png";
import componentHddPng from "~/assets/hardware/PNG+SVG/Component_HDD.png";
import componentNetworkPng from "~/assets/hardware/PNG+SVG/Component_Network.png";
import componentPowerPng from "~/assets/hardware/PNG+SVG/Component_Power.png";
import componentRamPng from "~/assets/hardware/PNG+SVG/Component_RAM.png";

export interface PreloadAsset {
  href: string;
  type: "image/png" | "image/svg+xml";
  /** "high" jumps the network queue, "auto" lets the browser decide. */
  priority: "high" | "auto";
}

/** Visible on first paint of /avaya — rack canvas + top chrome + sidebar logo. */
const critical: PreloadAsset[] = [
  { href: gridTilePng, type: "image/png", priority: "high" },
  { href: rackFramePng, type: "image/png", priority: "high" },
  { href: serverDell01Png, type: "image/png", priority: "high" },
  { href: serverDell02Png, type: "image/png", priority: "high" },
  { href: serverDell03Png, type: "image/png", priority: "high" },
  { href: serverDell04Png, type: "image/png", priority: "high" },
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
