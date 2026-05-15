/**
 * Display-side formatters for hardware data.
 *
 * Data files store vendor strings canonically lowercase (`"dell"`,
 * `"nvidia"`) so they're easy to grep / dedupe and don't leak
 * presentation decisions into the source of truth.  User-facing
 * surfaces — catalog cards, Screen C hero tagline — render them in
 * all-caps because both brands are universally written that way in
 * marketing material and BoQ documents.
 *
 * Keep the rule tight: only uppercase known brand acronyms / single-
 * word vendor names.  If a future vendor is multi-word (e.g.
 * `"Pure Storage"`) we'll still get a readable `PURE STORAGE`, but
 * if we ever add something that looks weird in caps we should
 * special-case it here instead of leaking branching into call sites.
 */
export function formatVendor(vendor: string): string {
  return vendor.toUpperCase();
}
