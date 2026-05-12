# 02 — Architecture

This file describes the runtime shape of the app: what runs where, how data flows, and how the render tree is composed.

## High-level

`magic-ui` is a **React 19 SPA** built with **React Router 7** (SSR off) and **Vite**. It talks to a single REST backend (base URL from `VITE_BE_URL`) over HTTPS, using an authenticated **Axios** instance. All server data is cached, invalidated, and polled through **TanStack Query**. UI state is local; cross-cutting state lives in a small set of **React Contexts**. UI primitives are **shadcn/ui** built on **Radix UI**, styled with **Tailwind v4**.

```
┌──────────────────────────── Browser (SPA) ─────────────────────────────┐
│                                                                        │
│  React Router 7 (data router, SSR off)                                 │
│   └─ Layout / ErrorBoundary  (app/root.tsx)                            │
│       └─ <AuthProvider>                                                │
│           └─ <QueryClientProvider> (TanStack Query)                    │
│               └─ <ProjectProvider>  (current Project)                  │
│                   └─ <Outlet/> renders the matched route               │
│                                                                        │
│  Routes                                                                │
│   • / → redirect by login state                                        │
│   • /login, /register   (auth/layout.tsx)                              │
│   • Protected (PrivateRoute.tsx, checks localStorage flag):            │
│       /dashboard                       (dashboard layout)              │
│       /projects/:id/lead-score         (lead-score layout)             │
│       /projects/:id                    (project layout)                │
│       /projects/:id/systems/:systemId  (project layout)                │
│       /projects/:id/systems/:systemId/* (nested subsystems)            │
│                                                                        │
│  Project layout adds:                                                  │
│   <PollingProvider> ─ polls project.system_generation_status           │
│   <SubsystemGenerationProvider> ─ polls per-subsystem design_status    │
│   <DiagramProvider> ─ "dell" | "nvidia" diagram switch                 │
│   <SidebarLeft> | <Outlet/> (page) | <SidebarRight>                    │
│                                                                        │
│  HTTP (axios singleton, request/response interceptors)                 │
│   - Authorization: <token> from localStorage("auth_token")             │
│   - 401 → redirect to /login                                           │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ REST (JSON, multipart)
                       Backend API (VITE_BE_URL)
```

## Process model

- **No server-side rendering.** `react-router.config.ts` sets `ssr: false`, so the app is a pure client SPA. There is no Node-side data loading; route components fetch via TanStack Query on mount.
- **Single Axios instance** — `app/api/axios.ts` exports the shared `api` client. All API modules import this and never construct a new `axios.create` themselves.
- **One QueryClient** — created at module load in `app/root.tsx`, no per-request reset.
- **Polling instead of websockets.** Long-running backend operations (project creation, system tree generation, per-subsystem design) report `*_progress` and `*_status` fields. The UI polls them via TanStack Query's `refetchInterval` (typically every 1000–5000 ms), and the polling provider invalidates dependent queries (tree, billing, subsystem) on progress change.

## Render tree at a typical project page

```
<App> (root.tsx)
 └─ <AuthProvider>
     └─ <QueryClientProvider>
         └─ <ProjectProvider>
             └─ <Outlet/>
                 └─ PrivateRoute  (gates on localStorage flag)
                     └─ ProjectLayout (layouts/project.tsx)
                         ├─ <PollingProvider>
                         │   └─ <SubsystemGenerationProvider>
                         │       └─ <DiagramProvider>
                         │           ├─ <SiteHeader/>           ← top header
                         │           ├─ <SidebarLeft/>          ← system tree + project meta
                         │           ├─ <ScrollArea>
                         │           │    └─ <Outlet/>           ← project-root.tsx | project.tsx
                         │           │         └─ Tabs:
                         │           │             • Questions  → <Questions/>
                         │           │             • Use cases  → <UseCases/>
                         │           │             • Proposal   → <StackDell/>+sections+<Price/>
                         │           │           OR (for /systems/:id):
                         │           │             • Questions  → <Questions/>
                         │           │             • Design     → <Stack/> | <StackDell/>
                         │           │             • Price      → <Price/>
                         │           └─ <SidebarRight/>          ← chat / catalog
```

## Data flow

1. **Login** (`routes/login.tsx`) → POST `/signin` → token saved to `localStorage("auth_token")`, `isUserLoggedIn=true` flag set, navigate to `/dashboard`.
2. **Dashboard** (`routes/dashboard/index.tsx`) → GET `/projects` (TanStack Query). Form submits new project: POST `/projects` (multipart) → navigate to `/projects/:id`.
3. **Project layout** mounts → GET `/projects/:id` and GET `/projects/:id/tree` and GET `/projects/:id/price` (in parallel, all via TanStack Query). `getProject` polls (`refetchInterval: 1000`) while `creating_status === "in_progress"`.
4. **Project root page** (`routes/project-root.tsx`) shows Questions tab by default; switching to Proposal tab triggers `POST /projects/:id/systems` (system tree generation) if `system_generation_status === "init"`, then **PollingProvider** polls `/projects/:id` every 1s while status is `init` / `in_progress`. On progress change it invalidates `PROJECT_TREE`, `PROJECT_PRICE_DATA`, `USE_CASES`, `PROJECT_SUBSYSTEM`, `SUBSYSTEM_BILLING`.
5. **Subsystem page** (`routes/project.tsx`) → GET `/projects/:id/systems/:subsystemId`. If `design_status` is `init` and project is complete, **SubsystemGenerationProvider** kicks off `POST /projects/:id/systems/:subsystemId` and polls `getProjectSubsystemShort` every 2s until `completed`/`failed`, then invalidates the subsystem and tree queries.
6. **Selections** (Add to proposal / Mark as Existing / Remove) → `PUT /projects/:id/systems/:subsystemId | /products/:productId | /product_families/:familyId` with `{ status }`. Mutations invalidate `PROJECT_SUBSYSTEM`, `PROJECT_PRICE_DATA`, `PROJECT_TREE`.
7. **Quantity changes** in `Price` table → `PUT /projects/:id/billing/products/:productId/quantity` with optimistic local state and server-confirmed re-render via cache invalidation.
8. **Proposal feedback** → CRUD `/projects/:id/proposal/feedback` (per section). The Download button is disabled until every section has a feedback and any "suggestion" status has a non-empty comment.
9. **Download proposal** → snapshot `#stack-container` to PNG (`html-to-image` for Dell, `html2canvas-pro` for NVIDIA), POST `/projects/:id/proposal-docx` with `image_base64`, save the returned blob via `file-saver`.

## Cross-cutting concerns

- **Auth** — global `AuthContext`. `account` is fetched once via `getAccountInfo()` (deduped with a module-level promise to survive React 19 Strict Mode double-effects). 401 from any request triggers redirect.
- **Customer theming** — at app boot, `root.tsx` resolves a `customer` from `VITE_APP_CUSTOMER` env or hostname (`mindware`, `datamonsters`, …) and sets `data-customer="..."` on `<html>`. CSS rules in `app/app.css` (`:root[data-customer="mindware"]`) override the design tokens (primary color, sidebar colors, chat background, etc.).
- **Diagram brand** — `DiagramContext` (`"dell" | "nvidia"`) is a per-project-layout choice that swaps the visualisation component (`StackDell` vs `Stack`) and changes how the proposal screenshot is taken.
- **Errors** — `ErrorBoundary` in `app/root.tsx` catches route errors and renders 404 / message + dev stack.

## Where things live (one-liner version)

- `app/root.tsx` — providers, fonts, customer detection, error boundary.
- `app/routes.ts` — route map (data router config).
- `app/layouts/*` — wrap groups of routes (sidebar shell vs centered layout).
- `app/routes/*` — pages.
- `app/components/*` — UI; `ui/*` is shadcn/ui, `customComponents/*` is project-specific composites.
- `app/components/stackDell/*`, `app/components/stack/*` — the diagrams.
- `app/api/*` — one file per backend area; all use the shared axios.
- `app/context/*` — global providers (Auth, Project, Polling, SubsystemGeneration, Diagram).
- `app/hooks/*` — small reusable hooks (`useStackData`, `useEffectiveSubsystemId`, `use-mobile`).
- `app/types/*` — server response and navigation types.
- `app/utils/*` — pure helpers.
- `app/lib/utils.ts` — `cn()` and `parseLeadScore()` (shadcn convention).
- `app/constants/*` — query-key enum, localStorage keys, asset maps.
- `app/features/*` — vertical feature folders (form + sidebar + schema). See `08-coding-style.md` for the convention.

For folder details see `03-folder-structure.md`.
