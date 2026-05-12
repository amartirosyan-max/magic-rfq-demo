# 01 — Stack & Libraries

This document lists every runtime and dev dependency `magic-ui` actually uses, why it is there, and where in the code you will see it. Source of truth: `magic-ui-dev/package.json`.

## Runtime

- **React 19** (`react`, `react-dom`) — the UI framework. Function components only, hooks-based.
- **React Router 7** (`react-router`, `@react-router/node`, `@react-router/dev`) — the meta-framework that owns routing, the dev/build pipeline, error boundaries, layouts, and the data router. Routes are declared in `app/routes.ts` (file-based via `@react-router/dev/routes` helpers, not file-system convention). SSR is **disabled** (`react-router.config.ts` sets `ssr: false`) — the app runs as an SPA.
- **Vite 6** (`vite`) — bundler and dev server. Plugins: `@tailwindcss/vite`, `@react-router/dev/vite`, `vite-tsconfig-paths` (for the `~` alias), `vite-plugin-svgr` (so SVGs can be imported as React components: `import Logo from "~/assets/logo.svg?react"`).
- **TypeScript 5.8** — strict mode is on. Path alias `~/*` → `./app/*` (see `tsconfig.json`).
- **Tailwind CSS 4** (`tailwindcss`, `@tailwindcss/vite`, `tw-animate-css`, `tailwind-scrollbar`) — utility-first CSS. Config is CSS-first (no `tailwind.config.js`); see `app/app.css` (`@theme`, `@plugin 'tailwind-scrollbar'`).
- **shadcn/ui** (style: "new-york", neutral baseColor, lucide icons) — component primitives generated into `app/components/ui/*`. Configured by `components.json`. They wrap Radix UI under the hood.
- **Radix UI primitives** — `@radix-ui/react-{avatar, collapsible, dialog, dropdown-menu, label, popover, progress, scroll-area, select, separator, slot, tabs, tooltip}`. Used as headless accessible primitives behind shadcn/ui components.
- **Lucide React** (`lucide-react`) — icon library used everywhere (`Loader2`, `Plus`, `Pencil`, `Download`, `WandSparkles`, etc.).
- **TanStack Query v5** (`@tanstack/react-query`, `@tanstack/eslint-plugin-query`) — the entire server-state layer. Every fetch goes through `useQuery` / `useMutation`. Polling for long-running operations is implemented via `refetchInterval`. Query keys are centralized in `app/constants/queryKeys.ts` (`EQueryKey` enum).
- **TanStack Table v8** (`@tanstack/react-table`) — used by `app/components/ui/data-table.tsx` and the dashboard table.
- **Axios** (`axios`) — HTTP client. A single instance is created in `app/api/axios.ts` with a request interceptor that attaches the `auth_token` from `localStorage` and a response interceptor that bounces 401s to `/login`. All API modules import from this instance.
- **Zod** (`zod`) + **react-hook-form** (`react-hook-form`, `@hookform/resolvers`) — form schemas and form state. See `app/features/add-user/schema.ts` and `app/features/add-product/schema.ts` for canonical examples.
- **animejs v4** (`animejs`) — the imperative animation engine used inside `app/components/stackDell/*` for the staged reveal of the diagram zones.
- **framer-motion** (`framer-motion`) — declarative motion used in `app/components/stack/Stack.tsx` and `AnimatedMarkdown.tsx` (per-section reveal of the proposal).
- **react-markdown** — renders the proposal markdown chapters with custom component overrides (see `routes/project-root.tsx` `markdownComponents`).
- **html-to-image** + **html2canvas-pro** — used by `utils/downloadProposal.ts` to snapshot the `#stack-container` element into a PNG that gets embedded into the generated `.docx`.
- **file-saver** (`file-saver`, `@types/file-saver`) — triggers browser downloads for assets, questionnaires, use cases, proposals.
- **dayjs** + **date-fns** — date formatting (filename for the downloaded proposal uses `dayjs().format("MMMM D YYYY")`).
- **react-day-picker** — calendar input (used by shadcn/ui's calendar component).
- **sonner** — toasts. Mounted globally in `app/root.tsx`.
- **next-themes** — theme switching primitive (the app currently uses `data-customer` more than `dark` mode, but next-themes is wired in).
- **clsx** + **tailwind-merge** + **class-variance-authority** — `cn()` helper in `app/lib/utils.ts` and CVA-driven component variants.
- **cmdk** — command palette primitive (used by shadcn/ui Command component if/when it appears).
- **react-use** (`react-use`) — utility hooks (`useTimeoutFn` is used in `Stack.tsx`).
- **deep-object-diff** — diffing utility (kept for debugging; not in a hot path).
- **isbot** — server-side bot detection (kept from React Router template; not active in SPA mode).

## Dev / tooling

- **prettier 3.5** + **husky** + **lint-staged** — pre-commit formatter. `lint-staged` config: `"**/*": "prettier --write --ignore-unknown"`. `npm run prepare` installs husky.
- **@tanstack/eslint-plugin-query** — present, but no `.eslintrc` is committed; Cursor IDE/eslint integration handles lint warnings.
- **@types/react**, **@types/react-dom**, **@types/node**, **@types/file-saver** — TS types only.
- **@vercel/node**, **@vercel/react-router** — Vercel preset is wired into `react-router.config.ts` for deployment. The app deploys as an SPA on Vercel.
- **tailwind-scrollbar** — registered via `@plugin` in `app/app.css`.

## Versions to keep in mind

- React **19** — be careful with libraries that haven't shipped React 19 support; `Strict Mode` is on, so effects double-fire in dev (this is why `AuthContext` deduplicates the `getAccountInfo()` call via a module-level `accountPromise`).
- Tailwind **v4** — config is in CSS via `@theme` blocks, **not** `tailwind.config.js`. Do not create a `tailwind.config.js`.
- React Router **7** — the data API; `route()`, `index()`, `layout()` come from `@react-router/dev/routes`. SSR is disabled.

## Scripts (`package.json`)

| Script | What it does |
| --- | --- |
| `npm run dev` | `react-router dev` — Vite dev server with HMR at `http://localhost:3000`. |
| `npm run build` | `react-router build` — production build. |
| `npm run start` | `react-router-serve ./build/server/index.js` — serve the build output. |
| `npm run typecheck` | `react-router typegen && tsc` — regenerate `+types/*` and run `tsc`. |
| `npm run prepare` | `husky` install hook (runs once per fresh clone). |

See `13-environment-and-scripts.md` for required env vars.
