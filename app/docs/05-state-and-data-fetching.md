# 05 — State & Data Fetching

This app keeps client state lean. Almost everything that lives longer than one component is either a TanStack Query cache entry or a small React Context. There is **no Redux/Zustand**.

## TanStack Query

A single `QueryClient` is created at module load in `app/root.tsx`:

```ts
const queryClient = new QueryClient({});
```

Mounted globally as `<QueryClientProvider client={queryClient}>`.

### Query keys

Always use the centralized `EQueryKey` enum from `app/constants/queryKeys.ts`. Don't write string literals. Current values:

```
PROJECTS, PROJECT_DATA, PROJECT_TREE, PROJECT_PRICE_DATA,
PROJECT_SUBSYSTEM, PROJECT_SUBSYSTEM_BY_HR_ID, PROJECT_SUBSYSTEM_SHORT,
SUBSYSTEM_BILLING, TOP_PRODUCTS,
USE_CASES, USE_CASES_GENERATED,
USERS, PROJECT_PROPOSAL_FEEDBACK, FEEDBACK_HISTORY,
PRODUCT_REQUESTS
```

### Conventions

- Keys always include the relevant scoping ids: `[EQueryKey.PROJECT_SUBSYSTEM, projectId, subsystemId]`.
- `enabled: !!id && !!subsystemId && id !== "" && subsystemId !== ""` — guard against undefined params.
- `refetchOnWindowFocus: false` is used for project/subsystem polling queries (we do not want surprise refetches while the user is interacting).
- Polling uses `refetchInterval: (query) => { ... }` — the predicate inspects `query.state.data` and returns `1000`/`2000`/`5000` while the operation is running, and `false` once it finishes.

### Mutations

- `useMutation` is the universal write primitive (see `app/api/systems.ts` for `useGenerateSystemTree`, `useGenerateSubsystemTree`).
- Optimistic updates use the standard `onMutate` / `onError(rollback)` / `onSettled(invalidate)` triad. See `routes/project-root.tsx` `updateProjectMutation` for the canonical example.
- After a successful mutation, invalidate every query whose data depends on the mutated entity. Examples from `components/options.tsx`:

```ts
queryClient.invalidateQueries({ queryKey: [EQueryKey.PROJECT_SUBSYSTEM, id, effectiveSubsystemId] });
queryClient.invalidateQueries({ queryKey: [EQueryKey.PROJECT_PRICE_DATA, id] });
queryClient.invalidateQueries({ queryKey: [EQueryKey.PROJECT_TREE, id] });
```

### Polling helpers

- `useProjectPolling({ projectId, enabled })` (in `app/api/projects.ts`) — polls `getProject` every 1s while `system_generation_status` is `INIT`/`IN_PROGRESS`.
- `useSubsystemPolling({ projectId, subsystemId, enabled })` (in `app/api/systems.ts`) — polls `getProjectSubsystemShort` every 1s while `design_status` is `Init`/`InProgress`.
- `useUseCases({ projectId, refetchInterval })` (in `app/api/useCases.ts`) — accepts a custom `refetchInterval` predicate; used to wait for the first generated use case.

See `examples/use-query-template.ts` for a copy-paste template.

## React Contexts

All providers live in `app/context/`. They are intentionally small.

### `AuthContext`

Holds `{ user, account, accountLoading, accountError, refetchAccount }`. On mount it calls `getAccountInfo()` once. To survive React 19 Strict Mode double-effects in dev, it uses a module-level `accountPromise` to deduplicate the in-flight request. `refetchAccount()` resets that and re-fetches.

Read with: `import { useAuth } from "~/context/AuthContext"`.

### `ProjectContext`

Holds `{ project, setProject }`. The provider wraps the entire app, but `project` is set/cleared based on the URL `:id` param. `layouts/project.tsx` writes the latest fetched project into it on every successful query. Most consumers just need `project.id`, `project.client_name`, `project.lead_score`, etc.

### `PollingContext`

Project-level polling. Wraps the project layout. Exposes `{ enablePolling, disablePolling, isPollingEnabled, pollingData }`. It uses `useProjectPolling` under the hood. When polling progress changes, it invalidates the dependent queries (`PROJECT_TREE`, `PROJECT_PRICE_DATA`, `PROJECT_SUBSYSTEM`, `SUBSYSTEM_BILLING`, the `enterprise_apps_and_usecases` HR-ID query). It auto-enables on mount if `system_generation_status` is `INIT`/`IN_PROGRESS`.

### `SubsystemGenerationContext`

Per-subsystem polling. Tracks a list of `generatingSubsystemIds` and a map of `subsystemGenerationStatuses` (progress, message, status, completed flag). Public API:

```ts
{
  isGeneratingSubsystem: boolean,
  generatingSubsystemIds: string[],
  subsystemGenerationStatuses: Record<string, SubsystemGenerationStatus>,
  startSubsystemGeneration(subsystemId, title?): void,
  stopSubsystemGeneration(subsystemId): void,
  clearCompletedGenerations(): void,
}
```

`startSubsystemGeneration` calls `useGenerateSubsystemTree` and starts a 2-second `setInterval` that polls `getProjectSubsystemShort` for each generating id. On `Completed`/`Failed`, it stops polling for that id and invalidates `PROJECT_SUBSYSTEM` and `PROJECT_TREE`. The `subsystemGenerationStatuses` map is intentionally **not** cleared automatically — the chat tab uses it to display per-subsystem progress bubbles. `clearCompletedGenerations()` removes only the items with `completed: true`.

### `DiagramContext`

`{ diagram: "dell" | "nvidia", setDiagram }`. Picked via the Select shown on the Design tab; affects which diagram component renders and how the proposal is screenshot.

## Local component state

For everything else, plain `useState` / `useReducer` in the component. Examples:

- `Price.tsx` keeps a `qtyState` local map for optimistic quantity edits before the server confirms.
- `routes/project-root.tsx` keeps `activeTab`, `isEditingName`, `suggestionPopover`, `checklistSuggestionOpen`, etc.
- `Questions.tsx` keeps `editingFields`, `localAnswerSources`, `loadingQuestionId`, `savingQuestionId`.

When state has to survive across renders but doesn't need to trigger one (e.g., "have we already triggered generation for this project?"), use `useRef` (see `generationTriggeredRef` and `processedSubsystems` in `routes/project.tsx`).

## URL is state, too

Several pieces of UI state live in the URL:

- The active tab on the project page is mirrored to `?tab=...` so links from the dashboard/email can deep-link directly to a Proposal tab and a specific section (`?tab=proposal&section=4`).
- Subsystem navigation lives entirely in the URL (`/projects/:id/systems/:systemId/subsystem/:subId/...`). There is no "currentSubsystem" in any context — everything derives from `useParams()` via `useEffectiveSubsystemId()`.

## When to introduce a new context vs a new query

- New piece of **server data** → new query (and a new `EQueryKey` entry). Don't put server data in context.
- New piece of **cross-cutting client state** that doesn't map to a single component subtree → new context, kept small.
- Otherwise, lift `useState` to the nearest common parent.
