# 09 — Styling & Theming

## Tailwind CSS v4

The app uses Tailwind v4. There is **no** `tailwind.config.js`. Configuration lives in `app/app.css`:

- `@import "tailwindcss"` — Tailwind itself.
- `@import "tw-animate-css"` — extra animation utilities (`animate-spin`, `animate-pulse`, etc.).
- `@plugin 'tailwind-scrollbar' { nocompatible: true }` — custom scrollbars.
- `@custom-variant dark (&:is(.dark *))` — explicit dark variant scoping.
- `@theme { --font-sans: "Helvetica Neue", ... }` — design tokens.
- `@theme inline { --color-...: var(--...); ... }` — maps Tailwind color utilities to CSS variables (so `bg-primary` → `var(--primary)`, etc.).

### Adding new design tokens

1. Add the variable in the right `:root` block (root + customer overrides) in `app/app.css`.
2. Map it under `@theme inline` if you want a Tailwind utility name for it.
3. Reference it as either a Tailwind utility (`bg-primary`) or directly with the var (`bg-[var(--my-token)]`).

## shadcn/ui

The app uses shadcn/ui (style: `new-york`, baseColor: `neutral`, icon library: `lucide`). Configuration in `components.json`:

```json
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": { "css": "app/app.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "aliases": {
    "components": "~/components",
    "utils":      "~/lib/utils",
    "ui":         "~/components/ui",
    "lib":        "~/lib",
    "hooks":      "~/hooks"
  }
}
```

To add a new primitive:

```bash
npx shadcn@latest add <name>
```

It will land at `app/components/ui/<name>.tsx`. Do **not** edit it like a vendored library — it is a generated source file you own.

## Customer theming via `data-customer`

The app supports multiple customer brandings. The current customer is detected at boot in `app/root.tsx`:

1. Use `import.meta.env.VITE_APP_CUSTOMER` if set.
2. Otherwise, look at `window.location.host` and find the first match from `VITE_CUSTOMER_LIST` (defaults to `"mindware,datamonsters"`).
3. Fall back to the first customer in the list.

The chosen value is set on `<html data-customer="...">`. CSS rules override design tokens per customer. Example from `app.css`:

```css
:root[data-customer="datamonsters"] {
  --background: #050d14;
}

:root[data-customer="mindware"] {
  --background: #eff2f6;
  --primary: #242e74;
  --secondary: #70cdff;
  --sidebar: #eff2f6;
  --sidebar-foreground: #242e74;
  --sidebar-accent: #dce7f7;
  --chat-background: #dce7f8;
  --active-tab: #3744a6;
  --lead-score-tooltip-bg: #afd4f6;
  --lead-score-tooltip-fg: #000000;
}
```

To add a new customer:

1. Append the slug to `VITE_CUSTOMER_LIST` (or just rely on host detection).
2. Add a `:root[data-customer="<slug>"] { ... }` block in `app/app.css` that overrides the tokens you want to brand.
3. Replace logos by pointing to a different SVG (the `LogoMindware` import is a brand-specific component today; future-proof by introducing a `customerLogo` map if you support more brands).

## Fonts

Two custom families are loaded in `app/app.css`:

- **Helvetica Neue** — full weight family loaded from `public/fonts/HelveticaNeue/*.otf` / `.ttf`, mapped to `--font-sans`.
- **SofiaSans** — regular and bold from `public/fonts/SofiaSans*.ttf`.

Roboto Serif is also pulled from Google Fonts via `<link>` tags emitted from `links` in `app/root.tsx` (used for big titles like the project name and section headers via `font-[Roboto_Serif]`).

## Animations

Two engines coexist by purpose:

- **animejs v4** — for the StackDell zone-by-zone reveal sequence (`proposalAnimationPhaseFirst/Second/Third` in `components/stackDell/StackDell.tsx`). Imperative timeline-based, used because we need to choreograph many DOM nodes precisely.
- **framer-motion** — for declarative per-section reveals (`AnimatedMarkdown.tsx`) and the layer-diff in `components/stack/Stack.tsx`. Use for component-level enter/exit.
- **CSS** — Tailwind utilities + `tw-animate-css` for spinners, pulses, etc. Use this when an animation is single-element and steady-state.

## Diagram screenshotting

`utils/downloadProposal.ts` snapshots the `#stack-container` element to a PNG before sending it to the backend:

- **Dell** → `html-to-image#toPng({ skipFonts: true })` (works better with the SVG-heavy Dell layout).
- **NVIDIA** → `html2canvas-pro` (works better with the gradient-heavy NVIDIA stack).

If you add a new diagram variant, decide which snapshotter to use empirically.

## Icons

- **lucide-react** is the only icon source. Always import named icons from `lucide-react` (`Loader2`, `Plus`, `Pencil`, `Download`, `RefreshCw`, `WandSparkles`, …).
- For brand logos and product images, use SVGs/PNGs from `app/assets/`. Use the `?react` suffix to import an SVG as a component: `import LogoMindware from "~/assets/logo_mindware.svg?react"` (enabled by `vite-plugin-svgr`).

## Toaster

A single `<Toaster position="bottom-center" />` (Sonner) is mounted in `app/root.tsx`. Use `toast.success(...)` / `toast.error(...)` from `sonner` anywhere in the app.

## Responsiveness

- The breakpoint helper is `useIsMobile()` in `app/hooks/use-mobile.ts` (768 px).
- The Tailwind utility `max-[1600px]:px-2.5` is used in the Price/Top Products tables to compress padding on smaller screens.
- The right sidebar hides below `lg` (`hidden lg:flex` in `sidebar-right.tsx`). When implementing new screens, design at desktop first; mobile is a known gap area.
