# 14 — Implementation Playbook

How to add a new functional / UI feature to `magic-ui` so it lands in the right places, follows the existing patterns, and is easy to review.

## 0. Before writing any code

1. Pick the right doc to read first:
   - Backend integration → `06-api-reference.md` + `07-domain-model.md`
   - New page → `04-routes.md` + `12-key-components.md`
   - State / data fetching → `05-state-and-data-fetching.md`
   - Visuals / theme → `09-styling-and-theming.md`
   - Conventions → `08-coding-style.md`
2. Identify the **scope**:
   - Does the feature live under an existing route, or do you need a new one?
   - Does it need a new context, or can it be local state?
   - Does it need a new query key in `EQueryKey`?
   - Does it touch the diagram, the right sidebar, or the proposal flow?

## 1. Recipes (most common feature shapes)

### Recipe A — New page (URL)

1. Create `app/routes/<page>.tsx`. Use `examples/route-template.tsx` as a starter.
2. Add the route in `app/routes.ts`. Choose the layout (`PrivateRoute` if it requires auth; `layouts/project.tsx` if it should sit inside the project shell).
3. Run `npm run typecheck` to regenerate route types.
4. Add `<Link to="/your/url">` from anywhere it should be linked from (sidebar, breadcrumbs, dashboard).

### Recipe B — New backend endpoint wrapper

1. Pick or create the API module under `app/api/<area>.ts`.
2. Define the request / response interface near the function.
3. `import api from "~/api/axios"` and use it. Throw early if required ids are missing.
4. If the call participates in polling or optimistic updates, also export a `useXxx()` hook in the same file.
5. If you query for the result, add a new entry in `EQueryKey` (`app/constants/queryKeys.ts`).
6. Use the function via `useQuery` / `useMutation` in the consuming component. Invalidate every dependent key on success.

See `examples/api-client-template.ts` and `examples/use-query-template.ts`.

### Recipe C — New right-sidebar tab

1. Add a `TabsTrigger` and a `TabsContent` to `components/sidebar-right.tsx`.
2. Build the body as a new component under `app/components/...` (composite → `customComponents/`, primitive → `ui/`).
3. If the tab needs to know about a category or context from outside, extend `ProjectLayoutContext` in `layouts/project.tsx` and call `useOutletContext<ProjectLayoutContext>()` from the page that opens it.

### Recipe D — New question / answer type

1. Extend `EAnswerType` in `app/types/systemResponse.ts`.
2. Add a new `{q.answer_type === "..." && (...)}` branch in `components/customComponents/Questions.tsx`.
3. If the new type needs validation, plug a zod schema piece into the dynamic schema builder near `useMemo({ schema, defaultValues })`.
4. Update `08-coding-style.md` if the pattern is novel.

### Recipe E — New proposal-section embed

1. The proposal renderer in `routes/project-root.tsx` checks `section.placeholder` (e.g. `"#root"`, `"#enterprise_apps_and_usecases"`) and `index === N` for special embeds.
2. Pick a placeholder convention with the backend team (e.g. `"#rack_designer"`).
3. Add the matching `{section.placeholder === "#rack_designer" && (<RackDesigner ... />)}` branch.
4. Make sure the embed gets snapshotted correctly by `utils/downloadProposal.ts` if it needs to appear in the `.docx` (the snapshot only captures `#stack-container` today).

### Recipe F — New cross-cutting state

1. Resist this. First check whether the data is server data (use TanStack Query) or local-to-a-subtree (lift `useState`).
2. If you really need a context, copy `context/DiagramContext.tsx` (the smallest example), keep it minimal, expose `{ value, setValue }`.
3. Mount the provider at the highest level that contains all consumers (often `layouts/project.tsx`).
4. Always export a hook (`useXxx()`) and a provider (`XxxProvider`).

### Recipe G — New customer brand

1. Append the slug to `VITE_CUSTOMER_LIST` (or rely on hostname containing the slug).
2. Add a `:root[data-customer="<slug>"] { ... }` block in `app/app.css` overriding tokens.
3. If the brand has its own logo, add it under `app/assets/`. The existing `LogoMindware` is hardcoded in `site-header.tsx` and `login.tsx`; refactor to a customer → component map when the second brand goes live.

### Recipe H — New feature folder (form + sheet)

1. Create `app/features/<feature>/`:
   - `schema.ts` — zod schemas + `type FormValues = z.infer<...>`.
   - `<feature>-sidebar.tsx` (or similar UI file) — the `Sheet`/`Dialog` with the RHF form.
   - `index.ts` — barrel file (`export { ... } from "./..."`).
2. Mirror the pattern of `app/features/add-user/` (see `examples/feature-folder-template.md`).

## 2. Mutation checklist (read before merging)

- [ ] Does the API function throw on missing required ids?
- [ ] Does the consuming `useMutation` invalidate **all** dependent `EQueryKey`s on success? (`PROJECT_TREE`, `PROJECT_PRICE_DATA`, `PROJECT_SUBSYSTEM`, `SUBSYSTEM_BILLING`, `PROJECT_DATA`)
- [ ] Are optimistic updates in place where the user expects instant feedback?
- [ ] Are errors surfaced via `toast.error(...)` from `sonner` when relevant?
- [ ] Has the backend documented the response shape, and does a TS interface mirror it?

## 3. New page checklist

- [ ] Page is a default-export function component.
- [ ] Reads URL params via `useParams()`. If subsystem-aware, uses `useEffectiveSubsystemId()` instead of raw params.
- [ ] All server data via `useQuery`, with explicit `queryKey` based on `EQueryKey` + the relevant ids and `enabled` guard.
- [ ] Uses the project layout's `useOutletContext<ProjectLayoutContext>()` if it needs to open the right sidebar.
- [ ] Loading state renders `<Loader2 className="animate-spin"/>` (lucide). Empty state renders a centered helpful message — not a blank screen.
- [ ] Mobile considerations are at least scoped, even if not solved.
- [ ] `npm run typecheck` is green.

## 4. PR checklist

- [ ] Touched only the layers needed (don't refactor unrelated code).
- [ ] No new third-party dependency without discussion.
- [ ] Used `EQueryKey` constants (no string keys).
- [ ] Used `cn()` for conditional classes.
- [ ] Pre-existing comments are preserved (incl. Russian ones).
- [ ] Added/updated the relevant doc(s) under `app/docs/` if the change introduces a new pattern, route, or integration.

## 5. Working "with prompts only"

Because most feature work in this repo will be done by giving a prompt to an AI agent that has access to this `app/docs/` folder, please follow these tips when writing prompts:

1. **Name the file you want changed.** Either point to a route (`app/routes/project-root.tsx`) or a component (`app/components/customComponents/Price/Price.tsx`).
2. **Reference the relevant doc** ("Follow the conventions in `app/docs/08-coding-style.md` and `app/docs/05-state-and-data-fetching.md`"). The agent will read them before touching code.
3. **Be explicit about side effects:** which `EQueryKey` to invalidate, whether to use optimistic updates, whether the new component should open the right sidebar.
4. **Specify the visual reference** when adding UI: link to the mockup file in the repo (e.g. `010_UI_Server_HP.jpg`).
5. **Ask for the PR checklist** at the end. The agent should self-check items 2–4 in the PR checklist before declaring done.
