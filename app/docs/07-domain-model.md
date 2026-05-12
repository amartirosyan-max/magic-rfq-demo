# 07 — Domain Model

The frontend mirrors a hierarchy of business concepts coming from the backend. Understanding this hierarchy is the most important context for any feature work.

```
Organization
  └─ User
       └─ Project (created from one RFP)
            ├─ Files / Assets (uploaded RFP, attachments)
            ├─ Questionnaire (sections × questions; answers from RFP / AI / User)
            ├─ Use cases (top-level "what AI we'll do for you")
            ├─ System tree (multi-root: System → Subsystem → Subsystem → Products)
            ├─ Billing (price + price_max per project / per subsystem / per product)
            ├─ Top Products (per subsystem highlights for the Proposal)
            ├─ Proposal (ordered chapters: each has section, introduction, conclusion, optional placeholder)
            ├─ Proposal Feedback (one entry per section: "good" / "suggestion" + comment)
            ├─ Chat history (project-wide and per-subsystem)
            └─ Lead score (computed from budget × 0.40 + RFP × 0.35 + AI Fit × 0.25)
```

Every entity has both a numeric `id` (db PK) and often an `hr_uid` (human-readable id, e.g. `"#enterprise_ai_strategy"`). The `hr_uid` is what the frontend uses to look things up by name (icons, ordering, the use cases subsystem, etc.).

## Project — `app/types/project.ts`

```ts
enum CreatingStatus      { IN_PROGRESS, REJECTED, COMPLETED }
enum SystemGenerationStatus { INIT, IN_PROGRESS, COMPLETED, FAILED }

interface ProjectResponse {
  id, name, client_name, description, industry, budget_estimation,
  timeline, submission_deadline,
  parent_project_id?, rebuild_iteration?,           // version chain (rebuild)
  creating_progress, creating_message, creating_status,
  system_generation_progress, system_generation_message, system_generation_status,
  organization_id, organization_name,
  user_division, user_location, user_name,
  lead_score,                                       // "X/10" string; parseLeadScore() to number
  proposal_confidence, questionnaire_completion,    // 0..100
  feedbacks?: IProjectFeedbackItem[]                // aggregated for dashboard
}

interface ProjectFullResponse extends ProjectResponse {
  questionnaire_sections: QuestionnaireSection[],
  proposal: ProposalSection[],                      // ordered chapters
  files: ProjectFile[]
}

interface ProposalSection {
  section, introduction, placeholder, conclusion
}
// placeholder special values (consumed by routes/project-root.tsx):
//   "#root"                          → render the diagram (StackDell or Stack)
//   "#enterprise_apps_and_usecases"  → render the chosen use cases list
// + index === 4 → render the Top Products table
// + index === 5 → render the <Price/> table
```

`rebuildProject()` returns `{ project_id, parent_project_id, rebuild_iteration, status: "generating" }`; the UI navigates to `/projects/<new_id>?tab=proposal`.

## System tree — `app/types/tree.ts`

```ts
interface SystemTreeResponse {
  id, hr_uid, title, description, order, recommended,
  status: EUserProjectSelection,
  subsystems: SystemTreeResponse[],
  category: string                 // "use_cases" | "data" | "services" | "ecosystem" | "infrastructure" | ...
}
```

`utils/tree.ts` provides:

- `mapTreeToSidebar(tree, projectId, parentUrl?, openFirst, currentPath)` — converts to `NavItem[]` for the left sidebar; filters out `EUserProjectSelection.Removed`; sorts by `order`.
- `findPathByIds(tree, ids)` — walks the tree by an ID list (used by breadcrumbs).

## Subsystem (detailed) — `app/types/systemResponse.ts`

```ts
enum EUserProjectSelection { Chosen = "chosen", Existing = "existing", Removed = "removed" }
enum EDesignStatus         { Init, InProgress, Completed, Failed }
enum EAnswerType           { String, Text, Number, Date, Option }
enum EAnswerSource         { Rfp, Ai, User }

type DellCategories = "use_cases" | "data" | "services" | "ecosystem" | "infrastructure"

interface SubsystemResponse {
  id, project_id, parent_id, hr_uid,
  title, description, long_description, color,
  recommended,
  status: EUserProjectSelection | string | null,    // null = use `recommended`
  design_completed, design_progress, design_message, design_status,
  products: SystemProductResponse[],
  product_families: SystemProductFamilyResponse[],
  subsystems: SubsystemInnerAResponse[],
  questionnaire: QuestionnaireSection[],
  category: DellCategories,
  rank, trending, order,
  diagram_icon_url
}

interface SubsystemShortResponse {
  // same minus products/subsystems/questionnaire — used for polling
}

interface SystemProductResponse {
  id, hr_uid, sku, name, description, image_url, diagram_icon_url, vendor,
  recommended, status, rank, trending, order
}

interface SystemProductFamilyResponse {
  id, hr_uid, name, description, image_url, color, recommended, status, trending
}
```

Selection semantics (`EUserProjectSelection` + `recommended`):

- `status === Chosen` → "In proposal" (highlighted, included in proposal)
- `status === Removed` → excluded ("Removed")
- `status === Existing` → "Already Done" (greyed out; counts as done)
- `status === null && recommended === true` → "Recommended" (treated as included by default)
- `status === null && recommended === false` → "Not in proposal"

Filter helper used in `useStackData` and `useSubsystemStackData`:

```ts
const isSelected = (item) =>
  item.status === EUserProjectSelection.Chosen ||
  (item.status === null && item.recommended);
```

## Questionnaire — `app/types/systemResponse.ts`

```ts
interface QuestionnaireSection {
  id, name,
  questions: QuestionnaireQuestion[]
}

interface QuestionnaireQuestion {
  id, question, mandatory,
  answer_type: EAnswerType,
  answer_source: EAnswerSource | string | null,
  answer_options: string[],          // for "option" type
  answer: string | null
}
```

Behavior:

- `answer_source === "rfp"` → text shown italic with a tooltip "The answer is extracted from RFP".
- `answer_source === "ai"` → italic with "Generated with Magic Wand".
- User edits → flips the local source override to `EAnswerSource.User`, removes the tooltip.
- Magic Wand button per question → `PUT /questions/:id/magic` (`askAnswer`). Updates the form value and marks source as AI.
- Section list is grouped via Collapsible, ordered by a small known map: `Main contract information → Problem to be solved → Decision-makers → ...rest`.

## Billing — `app/api/billing.ts` (types live there)

```ts
interface IProjectPriceResponse  { id, name, description, price, price_max }   // total project
interface SubsystemBillingResponse {
  id, title, description,
  products_chosen: ProductBillingResponse[],
  products_recommended: ProductBillingResponse[],
  price, price_max, order,
  subsystems: SubsystemInnerBillingResponse[]
}
interface ProductBillingResponse {
  id, sku, name, description,
  quantity, quantity_max, unit, unit_price, vendor,
  price, price_max
}
interface TopProductItem { id, name, description, image_url, price }
interface TopProductsSubsystemResponse { id, order, title, description, top_products: TopProductItem[] }
```

`<Price/>` (in `customComponents/Price/Price.tsx`) flattens the billing response into "sections" via `buildSections()`:

1. The subsystem itself (`data.title`, `data.products_recommended`).
2. Each nested `subsystem.title` with its `products_recommended`.

Sections are sorted by `order`; products inside each section by `id`. Price displayed via `Intl.NumberFormat("en-US", { currency: "USD" })`. Quantity is bounded by `[0, INT32_MAX]`.

## Lead score

- `project.lead_score` is the string `"X/10"`.
- `parseLeadScore(s)` (in `app/lib/utils.ts`) returns the numeric value or `NaN`.
- If `<= 2.0`, the user is redirected to `/projects/:id/lead-score` and shown `<LeadRejectionMessage/>`.
- Tooltip in the left sidebar describes the formula: `Lead = Budget×0.40 + RFP×0.35 + AI Fit×0.25` (each factor 0..10).

## Customer / brand model

- The "customer" identifier (`mindware`, `datamonsters`, etc.) drives the visual theme via `data-customer="..."` on `<html>`.
- The "diagram" choice (`dell` vs `nvidia`) is per-project-layout and affects which visualization is shown.
- The `STACK_ORDER` map in `utils/stackOrder.ts` orders the diagram layers consistently:

```
"#enterprise_ai_strategy"   → 1
"#enterprise_apps_and_usecases" → 2
"#enterprise_systems"        → 3
"#nvidia_ai_enterprise"      → 4
"#mlops_platforms"           → 5
"#data_infrastructure"       → 6
"#cluster_virtualization"    → 7
"#cloud_infrastructure"      → 8
"#data_center_hardware"      → 9
```

## Polling-status fields cheat sheet

| Field | Where | Polled by |
| --- | --- | --- |
| `creating_status` (`in_progress`/`completed`/`rejected`) | `Project` | `layouts/project.tsx` (`getProject` with `refetchInterval` while `in_progress`). |
| `system_generation_status` (`init`/`in_progress`/`completed`/`failed`) | `Project` | `useProjectPolling` (1s) via `PollingProvider`. |
| `design_status` (`init`/`in_progress`/`completed`/`failed`) | `Subsystem` | `useSubsystemPolling` (1s) and `SubsystemGenerationContext` (2s). |

These are also surfaced in the chat (`SidebarRightChat`) as live progress bubbles.
