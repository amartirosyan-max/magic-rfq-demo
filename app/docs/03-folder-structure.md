# 03 — Folder Structure

Everything ships from `magic-ui-dev/`. Inside, the React app lives in `app/`. Path alias: `~/*` → `./app/*`.

## Top of the repo

```
magic-ui-dev/
├── app/                          ← React app (everything below is inside here)
├── public/                       ← static assets (favicon, fonts/, top-level images)
├── components.json               ← shadcn/ui config (style: new-york, neutral, lucide)
├── package.json                  ← scripts + dependencies
├── react-router.config.ts        ← React Router config (ssr: false, vercel preset)
├── tsconfig.json                 ← strict, paths: { "~/*": ["./app/*"] }
├── vite.config.ts                ← Vite plugins (tailwindcss, reactRouter, tsconfigPaths, svgr)
├── vite-env.d.ts                 ← Vite ambient types
└── README.md                     ← React Router template README (don't lean on it)
```

## Inside `app/`

```
app/
├── root.tsx                      ← <html>, providers, fonts, customer theme
├── routes.ts                     ← route map (index/route/layout from @react-router/dev/routes)
├── app.css                       ← Tailwind v4 entry, fonts, design tokens, customer themes
│
├── api/                          ← one file per backend area, all share app/api/axios.ts
│   ├── axios.ts                  ← shared client; auth interceptor; 401 → /login
│   ├── signin.ts                 ← POST /signin + useAuth() mutation
│   ├── users.ts                  ← /users CRUD, getAccountInfo()
│   ├── projects.ts               ← /projects CRUD, asset upload/download, rebuild, useProjectPolling
│   ├── systems.ts                ← /projects/:id/systems CRUD, generation, status updates
│   ├── billing.ts                ← /price, /subsystems/:id/billing, top-products, quantity update
│   ├── chat.ts                   ← project-level + subsystem-level chat, upload, history
│   ├── feedback.ts               ← proposal feedback per section
│   ├── proposal.ts               ← downloadProjectProposal (.docx)
│   ├── questionnaire.ts          ← answer/ask question, export questionnaire .xlsx
│   ├── useCases.ts               ← /usecases generate/extend/status/export
│   └── productRequests.ts        ← /product-requests CRUD (admin)
│
├── auth/                         ← unauthenticated pages
│   ├── layout.tsx                ← <Outlet/> only
│   └── register.tsx              ← placeholder register form
│
├── assets/                       ← imported assets (PNG/SVG/WEBM)
│   ├── avatars/                  ← avatar PNGs (mapped in constants/assetMapping.ts)
│   ├── filesIcons/               ← file-doc.svg, file-pdf.svg
│   ├── hardware/                 ← Dell/NVIDIA/Lenovo product images
│   ├── isometric/                ← isometric variants of the hardware
│   ├── product_icons/            ← small icons used in diagrams
│   ├── use_cases/                ← use-case illustrations
│   ├── logo.svg, logo_mv.svg, logo_mindware.svg
│   ├── server.png
│   └── ... other shared images
│
├── components/                   ← UI (mix of generic + project-specific)
│   ├── ui/                       ← shadcn/ui primitives (button, dialog, tabs, sidebar, etc.)
│   │   └── chat/                 ← chat list/bubble/input primitives
│   ├── customComponents/         ← project-specific composites
│   │   ├── ActionsButtons.tsx    ← In proposal / Already Done / Removed buttons
│   │   ├── AnimatedMarkdown.tsx  ← reveals proposal sections one by one
│   │   ├── BlockTitle.tsx        ← editable title + ActionsButtons (subsystem header)
│   │   ├── Completion.tsx        ← progress bar with tooltip explanation
│   │   ├── LoadingChatBubble.tsx
│   │   ├── ProjectTitleReadonly.tsx
│   │   ├── Price/                ← billing table
│   │   ├── Questions.tsx         ← questionnaire form (rhf + zod)
│   │   ├── UseCases.tsx          ← use-cases tab content
│   │   ├── Products.tsx, Systems.tsx ← lists in the right "Catalog" tab
│   │   └── ...
│   ├── stack/                    ← generic abstract diagram (NVIDIA brand)
│   │   ├── Stack.tsx, LayerBlock.tsx, ContentBox.tsx, constants.ts, utils.tsx
│   ├── stackDell/                ← Dell diagram with 5 zones + animations
│   │   ├── StackDell.tsx
│   │   ├── DataBlock.tsx, ServicesBlock.tsx, EcosystemBlock.tsx,
│   │   │   InfrastructureBlock.tsx, UseCasesBlock.tsx
│   │   ├── DellContentBox.tsx
│   │   ├── DiagramLoaderOverlay.tsx
│   │   ├── utils.ts
│   │   └── hooks/                ← splitSubsytemsByZones, sortingByRankLayerData,
│   │                              shortenProductsTitles, normalizeIconUrl, useMouseGradient
│   ├── customAnimations/         ← shared animation constants
│   ├── lead-score/               ← LeadRejectionMessage (shown when score ≤ 2.0)
│   ├── login-form.tsx            ← <LoginForm/>
│   ├── nav-main.tsx, nav-user.tsx, nav-secondary.tsx, nav-favorites.tsx, nav-workspaces.tsx
│   ├── project-breadcrumbs.tsx   ← collapsible breadcrumb that uses the system tree
│   ├── search-form.tsx
│   ├── sidebar-left.tsx          ← project meta, navItems, Preview Proposal button
│   ├── sidebar-right.tsx         ← Tabs: Magic AI Advisor / Team / Catalog
│   ├── sidebar-right-chat.tsx    ← chat tab implementation
│   ├── site-header.tsx           ← top bar
│   ├── team-switcher.tsx
│   └── options.tsx               ← right-tab "Catalog": Products + Systems
│
├── constants/
│   ├── queryKeys.ts              ← EQueryKey enum (always use these)
│   ├── localstorage.ts           ← ELocalStorageKey enum
│   └── assetMapping.ts           ← maps human names/UIDs → imported images; loadAllImages()
│
├── context/
│   ├── AuthContext.tsx           ← user, account, refetchAccount; deduped /users/me fetch
│   ├── ProjectContext.tsx        ← currently viewed project (kept in sync with route + query)
│   ├── PollingContext.tsx        ← project-level polling and cross-query invalidation
│   ├── SubsystemGenerationContext.tsx ← per-subsystem polling + start/stop generation
│   └── DiagramContext.tsx        ← "dell" | "nvidia"
│
├── docs/                         ← THIS folder
│
├── features/                     ← vertical feature folders (form + UI + schema)
│   ├── add-user/                 ← create-user-sidebar.tsx + schema.ts + index.ts
│   └── add-product/              ← create-product-request-sidebar.tsx + schema.ts + index.ts
│
├── hooks/
│   ├── useStackData.ts           ← shapes SubsystemResponse → LayerData[] for the diagrams
│   ├── useSubsystemStackData.ts  ← shapes the "use_cases"/"data" mini-layers
│   ├── useEffectiveSubsystemId.ts← derives effective subsystem id from URL params
│   └── use-mobile.ts             ← media-query hook (breakpoint 768px)
│
├── layouts/
│   ├── dashboard.tsx             ← header + content area
│   ├── lead-score.tsx            ← centered narrow column
│   └── project.tsx               ← left + main + right sidebars + the project providers
│
├── lib/
│   └── utils.ts                  ← cn() (clsx + tailwind-merge); parseLeadScore()
│
├── routes/                       ← page components (file path is decoupled from URL)
│   ├── index.tsx                 ← redirects to /dashboard or /login
│   ├── PrivateRoute.tsx          ← gate with clientLoader returning isUserLoggedIn
│   ├── login.tsx
│   ├── lead-score.tsx            ← shown when project lead_score ≤ 2.0
│   ├── project-root.tsx          ← /projects/:id (Questions/Use cases/Proposal)
│   ├── project.tsx               ← /projects/:id/systems/:systemId(/...) (Questions/Design/Price)
│   └── dashboard/
│       ├── index.tsx             ← create project form + projects list
│       └── columns.tsx           ← TanStack Table columns
│
├── types/
│   ├── project.ts                ← ProjectResponse, ProjectFullResponse, status enums
│   ├── systemResponse.ts         ← SubsystemResponse, EUserProjectSelection, EDesignStatus, ...
│   ├── tree.ts                   ← SystemTreeResponse
│   └── navigation.ts             ← NavItem (sidebar)
│
└── utils/
    ├── tree.ts                   ← findPathByIds, mapTreeToSidebar
    ├── stackOrder.ts             ← STACK_ORDER mapping for hr_uid → display order
    ├── formatUSD.ts              ← Intl.NumberFormat USD helper
    ├── downloadProposal.ts       ← screenshot + POST /proposal-docx
    ├── imageLoader.ts            ← lazy import.meta.glob for assets/**
    └── useCasesDellDiagramIcons.ts
```

## Where to put new code

| You are adding... | Put it in |
| --- | --- |
| A new backend endpoint wrapper | `app/api/<area>.ts` (one file per area, share `axios.ts`) |
| A type that mirrors a server response | `app/types/<thing>.ts` |
| A new TanStack Query key | `EQueryKey` enum in `app/constants/queryKeys.ts` |
| A new page (URL) | `app/routes/<page>.tsx` + register in `app/routes.ts` |
| A new layout shared by several pages | `app/layouts/<name>.tsx` |
| A new global cross-cutting concern | a context in `app/context/` |
| A reusable hook | `app/hooks/<useThing>.ts` |
| A reusable pure helper | `app/utils/<thing>.ts` |
| A vertical feature (form + sidebar + schema) | `app/features/<feature>/` (see `08-coding-style.md`) |
| A generic styled UI primitive | use shadcn (`npx shadcn@latest add <name>`) → `app/components/ui/<name>.tsx` |
| A project-specific composite UI block | `app/components/customComponents/<name>.tsx` |
| Diagram changes (Dell-specific) | `app/components/stackDell/...` |
| Diagram changes (generic / NVIDIA) | `app/components/stack/...` |
| A new image asset | `app/assets/<category>/<file>` and (if it needs a name → URL map) `app/constants/assetMapping.ts` |
