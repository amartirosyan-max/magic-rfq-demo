# 04 — Routes

The route map is declared with React Router 7's data-router config in `app/routes.ts`. URLs and code files are decoupled (a route is just a triple `route(url, file, options)`).

## Public

| URL | File | Layout | Purpose |
| --- | --- | --- | --- |
| `/` | `routes/index.tsx` | — | Reads `localStorage("isUserLoggedIn")`. Redirects to `/dashboard` if true, else `/login`. |
| `/login` | `routes/login.tsx` | `auth/layout.tsx` | Login form. POSTs `/signin` via `useAuth()` mutation; on success stores token + flag, navigates to `/dashboard`. |
| `/register` | `auth/register.tsx` | `auth/layout.tsx` | Placeholder static form (not wired). |

## Protected (gate: `routes/PrivateRoute.tsx`)

`PrivateRoute` runs a `clientLoader` that reads `localStorage("isUserLoggedIn")`. If false, it `Navigate`s to `/login`. Everything below is wrapped in this gate.

### Dashboard

| URL | File | Layout | Purpose |
| --- | --- | --- | --- |
| `/dashboard` | `routes/dashboard/index.tsx` | `layouts/dashboard.tsx` | Header + content area. Form to create a new project (`/projects` POST + multipart files) and a `<ProjectsView/>` table. Row click → `/projects/:id`. |

### Lead score (separate, narrow layout)

| URL | File | Layout | Purpose |
| --- | --- | --- | --- |
| `/projects/:id/lead-score` | `routes/lead-score.tsx` | `layouts/lead-score.tsx` | Shown when `parseLeadScore(project.lead_score) <= 2.0`. Renders project title + `<LeadRejectionMessage/>`. If score > 2 it auto-navigates to `/projects/:id`. The route is registered with `id: "project-lead-score"` so React Router can disambiguate the same URL prefix used by other layouts. |

### Project (the main work surface)

All routes below share `layouts/project.tsx`, which mounts `PollingProvider`, `SubsystemGenerationProvider`, `DiagramProvider`, the left and right sidebars, breadcrumbs, and the scroll area.

| URL | File | Route ID | Purpose |
| --- | --- | --- | --- |
| `/projects/:id` | `routes/project-root.tsx` | `project-root` | The "project" view. Tabs: Questions / Use cases / Proposal. |
| `/projects/:id/systems/:systemId` | `routes/project.tsx` | `project-system` | A single system inside the project. Tabs: Questions / Design / Price. |
| `/projects/:id/systems/:systemId/*` | `routes/project.tsx` | `project-subsystem` | Same component, but with a wildcard path encoding nested subsystems. |

#### Subsystem path encoding

When the user navigates deeper than one system, the URL grows like:

```
/projects/123/systems/45/subsystem/67/subsystem/89
```

The `*` splat is split on `/`. The hook `useEffectiveSubsystemId()` (in `app/hooks/useEffectiveSubsystemId.ts`) takes only the **odd-index** segments (i.e. the IDs after each `/subsystem/`), and treats the **last** one as the "effective" subsystem to fetch. Example:

```
splat = "subsystem/67/subsystem/89"
        ↓ split on "/"
        ["subsystem", "67", "subsystem", "89"]
        ↓ filter (i % 2 === 1)
        ["67", "89"]
        ↓ last = "89"
effectiveSubsystemId = "89"
```

Breadcrumbs (`components/project-breadcrumbs.tsx`) consume the same splat and walk the system tree to label each segment.

## Layouts

- `auth/layout.tsx` — `<Outlet/>` only.
- `layouts/dashboard.tsx` — `<SidebarProvider>` shell with `<SiteHeader/>` and an Outlet.
- `layouts/lead-score.tsx` — centered narrow column with `<SiteHeader/>` and an Outlet.
- `layouts/project.tsx` — the big one (see `02-architecture.md` for the render tree).

## Outlet context

`layouts/project.tsx` passes a context object to its outlet:

```ts
export type ProjectLayoutContext = {
  openRightOptions: (
    category?: "ecosystem" | "infrastructure" | undefined,
  ) => void;
  openRightChat: () => void;
};
```

Pages call it with `useOutletContext<ProjectLayoutContext>()` (see `routes/project.tsx`). Switching the right sidebar to "options" (Catalog) is currently triggered when the user opens the Design tab.

## Search params used in URLs

| Param | Where | Meaning |
| --- | --- | --- |
| `?tab=proposal` | `/projects/:id` | Open the Proposal tab. |
| `?tab=use_cases` | `/projects/:id` | Open the Use cases tab. |
| `?tab=questions` (default) | `/projects/:id` | Open the Questions tab. |
| `?section=N` | `/projects/:id?tab=proposal` | Auto-scroll to `#proposal-section-N`. |

## Adding a new route

1. Add the page file under `app/routes/` (or a subfolder if it groups with siblings).
2. Add the entry in `app/routes.ts` using `route(url, fileRelativeToApp, options?)`.
3. If the route shares a shell with siblings, wrap them in a `layout(...)` block.
4. If it's protected, place it inside the existing `layout("routes/PrivateRoute.tsx", [...])` block.
5. Run `npm run typecheck` so React Router regenerates the types under `.react-router/types/`.

See `examples/route-template.tsx` for a starter.
