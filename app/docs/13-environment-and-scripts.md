# 13 — Environment & Scripts

## Required environment variables

The app reads env vars via Vite's `import.meta.env`. Keep them in a local `.env` (Vite picks up `.env`, `.env.local`, etc.). Variables must be prefixed with `VITE_` to be exposed to the client.

| Var | Used in | Purpose |
| --- | --- | --- |
| `VITE_BE_URL` | `app/api/axios.ts` | Backend base URL. **Required.** |
| `VITE_APP_CUSTOMER` | `app/root.tsx` | Forces a customer brand (`mindware`, `datamonsters`, …). Optional; if unset, the app derives the customer from the current hostname. |
| `VITE_CUSTOMER_LIST` | `app/root.tsx` | Comma-separated allow-list used during host-based detection. Defaults to `"mindware,datamonsters"`. |

There are no server-side secrets in the SPA build — every value baked into the bundle is public.

## localStorage keys

Defined in `app/constants/localstorage.ts`:

| Key | Type | Set by | Read by |
| --- | --- | --- | --- |
| `auth_token` | string | `useAuth().onSuccess` (`api/signin.ts`) | `api/axios.ts` request interceptor |
| `isUserLoggedIn` | `"true" \| "false"` | `routes/login.tsx`, `api/axios.ts` (cleared on 401) | `routes/index.tsx`, `routes/PrivateRoute.tsx` |

## Scripts (`package.json`)

| Command | What it does |
| --- | --- |
| `npm run dev` | `react-router dev` — Vite dev server (default port 3000). |
| `npm run build` | `react-router build` — production build. |
| `npm run start` | `react-router-serve ./build/server/index.js` — serve the production build. |
| `npm run typecheck` | `react-router typegen && tsc` — generates route types and runs `tsc`. Run before pushing. |
| `npm run prepare` | `husky` — installs git hooks (one-shot after a fresh clone). |

## Pre-commit

`lint-staged` runs `prettier --write --ignore-unknown` on staged files. Husky wires this into the `pre-commit` hook. Commit fails if Prettier rewrites a file you didn't stage; re-add and retry.

There is currently **no eslint** script (`@tanstack/eslint-plugin-query` is installed but no `npm run lint` is wired). Most lint signals come from the IDE / Cursor.

## Build output and deployment

- The Vercel preset is wired (`react-router.config.ts → presets: [vercelPreset()]`). The app deploys as an SPA on Vercel. The `dependencies` include `@vercel/node` and `@vercel/react-router`.
- The README at the repo root is the React Router template's default README; the live deploy story for this project is Vercel.

## Path alias

`tsconfig.json`:

```json
"baseUrl": ".",
"paths": { "~/*": ["./app/*"] }
```

Use `~/...` everywhere. `vite-tsconfig-paths` makes Vite respect the same alias.

## Public folder

`public/` is served as-is. Notable contents:

- `public/fonts/HelveticaNeue/*.otf|.ttf`
- `public/fonts/SofiaSans*.ttf`
- `public/fonts/HelveticaNeueRoman.otf` (etc.)

The fonts are referenced from `app/app.css` via `url("/fonts/...")` (i.e. relative to the static root).

## SVG imports

`vite-plugin-svgr` is enabled. Two import styles:

```ts
import LogoUrl from "~/assets/logo_mindware.svg";          // → string URL
import LogoMindware from "~/assets/logo_mindware.svg?react"; // → React component
```

The `?react` form is the dominant style in this codebase (see `routes/login.tsx`, `components/site-header.tsx`).
