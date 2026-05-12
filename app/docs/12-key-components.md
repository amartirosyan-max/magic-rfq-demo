# 12 — Key Components

A short reference for the components you will most likely touch when adding new features. Read the file (`~/components/...`) for the full source.

## Layouts and shells

### `layouts/project.tsx` — `ProjectLayout`

The shell for everything under `/projects/:id`. Mounts the project providers (`PollingProvider`, `SubsystemGenerationProvider`, `DiagramProvider`), the left and right sidebars, the breadcrumb header, and the scrolling main area. Owns two pieces of right-sidebar state:

- `sidebarRightMode`: `"chat" | "options"`
- `rightCategory`: `"ecosystem" | "infrastructure" | undefined`

Children receive an outlet context:

```ts
useOutletContext<ProjectLayoutContext>() ⇒ { openRightOptions(category?), openRightChat() }
```

### `components/site-header.tsx` — `SiteHeader`

Top bar (logo + Magic wordmark + NavUser). The "back to dashboard" button is hidden when already on `/dashboard`. Reads the current user's `account` from `AuthContext`.

### `components/sidebar-left.tsx` — `SidebarLeft`

- Project meta card (client name, project name, lead-score tooltip, price range).
- Primary CTA: "Preview Proposal" or "Use cases".
- `NavMain` rendered from `navItems` (built via `mapTreeToSidebar` from the `/tree` query).
- Auto-redirects to `/projects/:id/lead-score` when `parseLeadScore(project.lead_score) <= 2.0`.

### `components/sidebar-right.tsx` — `SidebarRight`

Tabs: **Magic AI Advisor** (`SidebarRightChat`), **Team** (placeholder), **Catalog** (`Options` with `isSidebar=true`). Switches active tab automatically when `sidebarMode === "options"`.

### `components/sidebar-right-chat.tsx` — `SidebarRightChat`

Project-scope chat. Loads `getChatHistory(projectId)` once `creating_status === "completed"`. Sends messages via `sendProjectChatMessage`. Shows live `LoadingChatBubble`s for project-level system generation and for each subsystem generation (from `SubsystemGenerationContext.subsystemGenerationStatuses`). File attachments via `uploadChatFiles` → message includes `asset_ids`.

### `components/options.tsx` — `Options`

Renders the right-sidebar Catalog content. Uses `useEffectiveSubsystemId()` to find the current scope, fetches the subsystem detail, then renders `<Products/>` and `<Systems/>` lists. Mutations call `updateProductStatus` / `updateProductFamilyStatus` / `updateSystemStatus` and invalidate the `PROJECT_SUBSYSTEM`, `PROJECT_PRICE_DATA`, and `PROJECT_TREE` queries.

### `components/project-breadcrumbs.tsx` — `ProjectBreadcrumbs`

Computes a list of `[label, to]` pairs from `treeData + systemId + subsystemPath`. Hides middle items into a dropdown (BreadcrumbEllipsis) when overflow is detected via a hidden measurer.

## Page entry points

### `routes/index.tsx`

Redirects based on the `isUserLoggedIn` flag.

### `routes/PrivateRoute.tsx`

`clientLoader` reads `isUserLoggedIn`. Renders `<Navigate to="/login"/>` if false.

### `routes/login.tsx`

Form with `useAuth()` (signin mutation). On success: store token + flag, set user, navigate to `/dashboard`.

### `routes/dashboard/index.tsx`

Projects list + create-project form (description + multipart files → `createNewProject`). Uses `<ProjectsView/>` (in `components/ui/projectsTable.tsx`) — clicking a row navigates to `/projects/:id`; clicking a proposal section navigates to `/projects/:id?tab=proposal&section=N`.

### `routes/lead-score.tsx`

Shown when score is too low. Auto-redirects out if score > 2.0.

### `routes/project-root.tsx` — `ProjectRootPage`

The biggest route file. Tabs: Questions / Use cases / Proposal. Owns the proposal feedback flow, optimistic name/description edits, file upload/delete, top products embed, `<Price/>` embed, the diagram embed (with both Dell and NVIDIA modes), the Review Checklist + Download/Refresh buttons.

### `routes/project.tsx` — `Page` (the system/subsystem screen)

Tabs: Questions / Design / Price. Switches the right sidebar to "options" when Design is active. Auto-starts subsystem generation when entering an `init` subsystem of a completed project.

## Composite UI (project-specific)

### `components/customComponents/Questions.tsx` — `Questions`

Renders the questionnaire: collapsible sections, per-question inputs based on `answer_type`, Magic Wand button per question, source-aware styling (`black` / `text-primary italic` for AI / `text-[#D19B5D] italic` for RFP). Save on blur (`giveAnswer`), AI ask via `askAnswer`. Buttons: Export, Email template (copies a templated message). Footer CTAs: View Price / View Design / Preview Proposal.

### `components/customComponents/UseCases.tsx` — `UseCases`

The use-cases tab. Triggers `generateUseCases` on activation, polls every 5s until `subsystems` arrive, supports `extendUseCases`. Per-row `ActionsButtons` for status. Export button.

### `components/customComponents/ActionsButtons.tsx` — `ActionsButtons`

The reusable trio: "In proposal" / "Already Done" / "Removed" buttons + status label ("Recommended", "In proposal", "Already Done", "Removed", "Not in proposal"). When clicking "Add to proposal" on a subsystem whose `design_completed === false`, it also triggers `startSubsystemGeneration(...)`.

### `components/customComponents/BlockTitle.tsx` — `BlockTitle`

Editable subsystem title and description with the inline pencil icons, plus `<ActionsButtons/>` on the right. Used at the top of the System/Subsystem tabs.

### `components/customComponents/Completion.tsx` — `Completion`

Progress bar with a tooltip explanation. Used twice on the Questions tab: "Questionnaire Completion" (green) and "Proposal Confidence" (orange).

### `components/customComponents/AnimatedMarkdown.tsx` — `AnimatedMarkdown`

Per-section reveal in the Proposal tab. Skips animation when `system_generation_status` is `COMPLETED`/`FAILED`. Scrolls into view as each section appears (NVIDIA only).

### `components/customComponents/Products.tsx` — `Products`

List of products or product families. Each row: image, name, description, ActionsButtons. Used inside `<Options/>`.

### `components/customComponents/Systems.tsx` — `Systems`

List of subsystems with title/description and ActionsButtons; clicking the title navigates deeper.

### `components/customComponents/Price/Price.tsx` — `Price`

Billing table for a (sub)system. Builds sections from `getSubsystemBilling`, shows SKU, expandable description, qty stepper (with optimistic `qtyState` + server confirm), per-row total, per-section total, grand total. Quantity bounded by `[0, INT32_MAX]`.

## Diagram

### `components/stack/Stack.tsx` — `Stack` (NVIDIA)

Generic abstract stack. Computes a layer diff (`new` / `existing` / `removing`) from previous and current `stackData`, animates layers in/out via `framer-motion`. Shows a Loader overlay while transitioning.

### `components/stackDell/StackDell.tsx` — `StackDell` (Dell)

Five-zone diagram: `DataBlock`, `ServicesBlock`, `EcosystemBlock`, `InfrastructureBlock`, `UseCasesBlock`. Heavy use of `animejs` for the staged proposal reveal (three phases). Includes a `DiagramLoaderOverlay`. Cells of the diagram navigate to subsystem URLs on click via `DellContentBox`.

Helper hooks under `components/stackDell/hooks/`:

- `splitSubsytemsByZones` — partitions `subsystems` by `category`.
- `sortingByRankLayerData` — orders boxes by `rank`.
- `shortenProductsTitles` — truncates labels for the diagram.
- `normalizeIconUrl` — resolves `diagram_icon_url`.
- `useMouseGradient` — interactive gradient on hover.

### `hooks/useStackData.ts` and `hooks/useSubsystemStackData.ts`

Pure transforms from `SubsystemResponse` to `LayerData[]` consumed by both diagrams. Knows about `EUserProjectSelection.Chosen` vs `recommended` semantics, computes `calculateFinalRank()` (Dell products get a 1.3 multiplier), and constructs the deep navigation URLs (`/projects/:id/systems/:sid/subsystem/:sid/...`).

## Forms framework (RHF + Zod + shadcn)

The dashboard form (`routes/dashboard/index.tsx`) uses RHF + zod + shadcn `Form` primitives. The two `features/` examples (`features/add-user/`, `features/add-product/`) show a more complete pattern: a `schema.ts` (zod schemas + types), an `index.ts` (barrel), and the UI file (a `Sheet`/`Sidebar`-style form).

## Misc

- `components/ui/projectsTable.tsx` — the dashboard table (TanStack Table).
- `components/ui/quality-status-icon.tsx` — the Good/Suggestion icon used in Proposal feedback.
- `components/customComponents/ProjectTitleReadonly.tsx` — title for the lead-score page.
- `components/lead-score/LeadRejectionMessage.tsx` — rejection text for low-score projects.
