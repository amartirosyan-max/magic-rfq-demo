# 06 — API Reference

All HTTP calls go through the singleton in `app/api/axios.ts`:

- `baseURL = import.meta.env.VITE_BE_URL`
- Request interceptor adds `Authorization: <token from localStorage("auth_token")>` to every request **except** `POST /signin`.
- Response interceptor: on **HTTP 401**, clear `auth_token` + `isUserLoggedIn`, and `window.location.href = "/login"` (unless already there).

Each API area is one file under `app/api/`. Import functions, not the axios instance.

## Auth — `app/api/signin.ts`

| Function | HTTP | Notes |
| --- | --- | --- |
| `useAuth()` | `POST /signin` | TanStack mutation. On success stores `auth_token` in `localStorage`. |

## Users — `app/api/users.ts`

| Function | HTTP | Notes |
| --- | --- | --- |
| `getAccountInfo()` | `GET /users/me` | Used by `AuthContext`. Deduplicated for Strict Mode. |
| `getUsers()` | `GET /users` | Active users in the org. |
| `getUser(userId)` | `GET /users/:userId` | |
| `createUser(data)` | `POST /users` | Admin/system roles. |
| `updateUser(userId, data)` | `PUT /users/:userId` | |
| `deleteUser(userId)` | `DELETE /users/:userId` | Soft delete (204). |

Constants: `ADMIN_ROLES = ["system", "admin"]`. Helper: `isAdminRole(role)`.

## Projects — `app/api/projects.ts`

| Function | HTTP | Notes |
| --- | --- | --- |
| `getProjects()` | `GET /projects` | |
| `getProject(id)` | `GET /projects/:id` | Returns `ProjectFullResponse` (incl. `questionnaire_sections`, `proposal`, `files`). |
| `createNewProject(rfp, files[])` | `POST /projects` (multipart) | `rfp` = description; `files[]` = uploaded RFP docs. |
| `useProjectPolling({ projectId, enabled })` | `GET /projects/:id` polled | 1s while `system_generation_status` ∈ `init`/`in_progress`. |
| `uploadProjectAssets(projectId, file)` | `POST /projects/:id/assets` (multipart) | |
| `deleteProjectAsset(projectId, assetId)` | `DELETE /projects/:id/assets/:assetId` | |
| `downloadProjectAsset(projectId, assetId)` | `GET /projects/:id/assets/:assetId` (blob) | Saves via `file-saver`, uses `Content-Disposition` filename if present. |
| `updateProject(projectId, ProjectUpdate)` | `PUT /projects/:id` | |
| `deleteProject(projectId)` | `DELETE /projects/:id` | Soft delete (204). |
| `rebuildProject(projectId)` | `POST /projects/:id/rebuild` | Creates a new project linked by `parent_project_id`, returns `{ project_id, parent_project_id, rebuild_iteration, status: "generating" }`. 422 if `system_generation_status !== "completed"`. |

## Systems / Subsystems — `app/api/systems.ts`

Generation:

| Function | HTTP | Notes |
| --- | --- | --- |
| `generateSystemTree(projectId)` / `useGenerateSystemTree()` | `POST /projects/:id/systems` | Triggers tree generation (use cases → systems → subsystems). |
| `generateSubsystemTree(projectId, subsystemId)` / `useGenerateSubsystemTree()` | `POST /projects/:id/systems/:subsystemId` | Triggers per-subsystem design. |
| `getProjectSystemGenerations(projectId)` | `GET /projects/:id/systems/generations` | Currently-generating subsystems. |

Reads:

| Function | HTTP | Notes |
| --- | --- | --- |
| `getProjectTree(projectId)` | `GET /projects/:id/tree` | Full system tree (`SystemTreeResponse[]`). |
| `getProjectSubsystem(projectId, subsystemId)` | `GET /projects/:id/systems/:subsystemId` | Detailed subsystem (`SubsystemResponse`) with `products`, `product_families`, `subsystems`, `questionnaire`. |
| `getProjectSubsystemShort(projectId, subsystemId)` | `GET /projects/:id/systems/short/:subsystemId` | Lightweight version used for polling. |
| `getProjectSubsystemByHrId(projectId, catalogSystemHrUid)` | `GET /projects/:id/systems/hr/:hrUid` | Look up by human-readable id (used for `enterprise_apps_and_usecases`). |
| `useSubsystemPolling({ projectId, subsystemId, enabled })` | polled `getProjectSubsystemShort` | 1s while `design_status` ∈ `init`/`in_progress`. |

Writes:

| Function | HTTP | Notes |
| --- | --- | --- |
| `updateSystemAttributes({ projectId, subsystemId, title, description })` | `PUT /projects/:id/systems/:subsystemId/info` | Edit subsystem title/description. |
| `updateSystemStatus(projectId, subsystemId, status)` | `PUT /projects/:id/systems/:subsystemId` | `status` ∈ `EUserProjectSelection \| null`. |
| `updateProductStatus(projectId, productId, status)` | `PUT /projects/:id/products/:productId` | |
| `updateProductFamilyStatus(projectId, productFamilyId, status)` | `PUT /projects/:id/product_families/:productFamilyId` | |

## Billing — `app/api/billing.ts`

| Function | HTTP | Notes |
| --- | --- | --- |
| `getProjectPrice(projectId)` | `GET /projects/:id/price` | Returns `{ id, name, description, price, price_max }`. |
| `getSubsystemBilling(projectId, subsystemId)` | `GET /projects/:id/systems/:subsystemId/billing` | Used by the `<Price/>` table. Returns `products_chosen`, `products_recommended`, nested `subsystems`, totals. |
| `getTopProducts(projectId, topN=5)` | `GET /projects/:id/billing/top-products?top_n=N` | Used in the Proposal "Top Products" table (rendered after section 4). |
| `updateProductQuantity(projectId, productId, quantity)` | `PUT /projects/:id/billing/products/:productId/quantity` | Changing `quantity` also resets `quantity_max := quantity`. |

## Questionnaire — `app/api/questionnaire.ts`

| Function | HTTP | Notes |
| --- | --- | --- |
| `giveAnswer(questionId, { answer })` | `PUT /questions/:id` | Save user answer. |
| `askAnswer(questionId)` | `PUT /questions/:id/magic` | Trigger AI answer (Magic Wand button). Returns updated `QuestionnaireQuestion`. |
| `exportQuestionnaire(projectId, subsystemId?)` | `GET /projects/:id/export/questionnaire` or `.../questionnaire/subsystem/:sid` (blob) | Downloads `.xlsx`. |

## Use cases — `app/api/useCases.ts`

| Function | HTTP | Notes |
| --- | --- | --- |
| `getUseCases(projectId)` / `useUseCases({ ... })` | `GET /projects/:id/usecases` | Reads use cases. `useUseCases` accepts a `refetchInterval`. |
| `generateUseCases(projectId)` / `useGenerateUseCases()` | `POST /projects/:id/usecases/generate` | First-time generation. |
| `extendUseCases(projectId)` / `useExtendUseCases()` | `POST /projects/:id/usecases/extend` | Generate more. |
| `updateUseCaseStatus(projectId, useCaseId, status)` / `useUpdateUseCaseStatus()` | `PUT /projects/:id/usecases/:ucId/status` | `status` ∈ `EUserProjectSelection \| null`. |
| `exportUseCases(projectId)` | `GET /projects/:id/export/usecases` (blob) | Downloads file. |

## Chat (Magic AI Advisor) — `app/api/chat.ts`

| Function | HTTP | Notes |
| --- | --- | --- |
| `uploadChatFiles(projectId, files[])` | `POST /projects/:id/chat/upload` (multipart) | Returns `IChatUploadItem[]`. |
| `sendProjectChatMessage(projectId, IChatRequest)` | `POST /projects/:id/chat` | `target` ∈ `questions`/`design`/`price`. |
| `sendChatMessage(projectId, subsystemId, IChatRequest)` | `POST /projects/:id/systems/:sid/chat` | Subsystem-scoped chat. |
| `getChatHistory(projectId)` | `GET /projects/:id/chat/history` | Returns `IChatMessage[]`. |

## Proposal — `app/api/proposal.ts`

| Function | HTTP | Notes |
| --- | --- | --- |
| `downloadProjectProposal(projectId, image_base64, clientName)` | `POST /projects/:id/proposal-docx` (blob) | Body `{ image_base64 }`. Filename pattern: `<ClientName> Proposal <MMMM D YYYY>.docx`. |

## Proposal feedback — `app/api/feedback.ts`

| Function | HTTP | Notes |
| --- | --- | --- |
| `getProjectFeedback(projectId)` | `GET /projects/:id/proposal/feedback` | Returns `chapters: IFeedbackResponse[]`. |
| `createFeedback(projectId, ICreateFeedbackRequest)` | `POST /projects/:id/proposal/feedback` | |
| `updateFeedback(projectId, feedbackId, IUpdateFeedbackRequest)` | `PUT /projects/:id/proposal/feedback/:fid` | |
| `deleteFeedback(projectId, feedbackId)` | `DELETE /projects/:id/proposal/feedback/:fid` | Soft delete (204). |
| `getFeedbackHistory()` | `GET /proposal/feedback/history` | Cross-project history. |

`feedback_status` is `"good" | "suggestion"`. `section_index` matches the index inside `project.proposal[]`.

## Product requests — `app/api/productRequests.ts`

| Function | HTTP | Notes |
| --- | --- | --- |
| `getProductRequests()` | `GET /product-requests` | |
| `createProductRequest(form)` | `POST /product-requests` (multipart) | |
| `updateProductRequest(id, form)` | `PUT /product-requests/:id` (multipart) | |
| `updateProductRequestStatus(id, { status })` | `PUT /product-requests/:id/status` | Admin/system. |
| `downloadProductRequestFile(requestId, fileId, fileName?)` | `GET /product-requests/:id/files/:fid` (blob) | |
| `deleteProductRequest(id)` | `DELETE /product-requests/:id` | Owner or admin. |

## Conventions when adding endpoints

1. New file under `app/api/<area>.ts`. Import the singleton: `import api from "~/api/axios"`.
2. Always declare a request type and a response type. Mirror the server's JSON shape in `app/types/` or alongside the API module.
3. Throw on missing required ids early: `if (!projectId || projectId === "undefined") throw new Error(...)` — see `projects.ts` for the pattern.
4. For binary downloads, use `responseType: "blob"` and `file-saver`'s `saveAs(...)`. Try to read filename from `Content-Disposition`.
5. For long-running operations, expose a `useXxxPolling()` hook colocated in the same file. Use `refetchInterval: (query) => ...` and gate on `enabled`.
6. Add a new `EQueryKey` entry rather than inlining a string.

See `examples/api-client-template.ts` for a copy-paste starter.
