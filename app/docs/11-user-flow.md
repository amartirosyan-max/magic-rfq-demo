# 11 — User Flow

This document describes the step-by-step journey through the app today. The new user flow for the rack-configurator feature will be appended at the bottom once the user provides it.

## Existing user flow (today)

### A) Authentication

```
[Visit /]
   │
   ├─ localStorage("isUserLoggedIn") === "true"  → /dashboard
   └─ otherwise                                  → /login

[/login]
   1. Enter login + password
   2. POST /signin → token  (axios skips auth header on /signin)
   3. localStorage("auth_token") = token
   4. localStorage("isUserLoggedIn") = "true"
   5. AuthContext.setUser({ login })
   6. navigate("/dashboard")
```

### B) Dashboard — see existing projects, create new

```
[/dashboard]
   ├─ GET /projects  →  ProjectsView table
   │                     row click → /projects/:id
   │                     section click → /projects/:id?tab=proposal&section=N
   │
   └─ Create form:
       1. Type a description (the RFP text)
       2. (Optional) upload one or more .pdf/.doc/.docx
       3. Submit → POST /projects (multipart)
       4. On success → navigate(`/projects/${data.id}`)
```

### C) Project — Questions tab (default)

```
[/projects/:id]   (Questions tab)
   ProjectLayout mounts:
     - GET /projects/:id        (polled while creating_status=in_progress)
     - GET /projects/:id/tree
     - GET /projects/:id/price
     - PollingProvider, SubsystemGenerationProvider, DiagramProvider mounted
     - SiteHeader + SidebarLeft + SidebarRight + main Outlet

   Lead score gate:
     - if lead_score numeric <= 2.0 → redirect to /projects/:id/lead-score (LeadRejectionMessage)

   Body:
     - Editable name + description (optimistic PUT /projects/:id)
     - Project files list (POST /assets, DELETE /assets/:id, click → GET blob → save)
     - Completion bars (Questionnaire Completion, Proposal Confidence)
     - Questionnaire form (sections × questions)
         - text/string/number/date/option inputs with rhf+zod
         - Magic Wand → PUT /questions/:id/magic
         - blur → PUT /questions/:id
         - tooltips for "rfp"/"ai" sources
     - Buttons: Export questions, Email template
     - Footer button: "View Proposal" (when isProposalUnlocked) OR "Use cases"
```

### D) Project — Use cases tab

```
[/projects/:id?tab=use_cases]
   First open:
     - POST /projects/:id/usecases/generate
     - useUseCases polls every 5s until `subsystems` length > 0

   Body:
     - List of use cases (TrendingWrapper for currentYear)
     - ActionsButtons per use case → PUT /usecases/:id/status with In proposal/Existing/Removed
     - "Generate more new use cases" → POST /usecases/extend
     - Export use cases (blob)
```

### E) Project — Proposal tab

```
[/projects/:id?tab=proposal]
   On open:
     - if system_generation_status = "init"  → POST /projects/:id/systems  (system tree generation)
     - if status ∈ {in_progress, completed}  → enablePolling(projectId)
   Polling loop:
     - useProjectPolling refetches GET /projects/:id every 1s while status ∈ {init, in_progress}
     - On progress change PollingProvider invalidates: PROJECT_TREE, PROJECT_PRICE_DATA,
       PROJECT_SUBSYSTEM, SUBSYSTEM_BILLING, USE_CASES.
     - SidebarRightChat renders a live progress bubble while generation is running.

   Body when proposal[] has data:
     1. Diagram (StackDell for "dell", or Stack for "nvidia") — animated reveal
     2. project.proposal.map((section, index)) renders:
         - <h2>{section.section}</h2>
         - per-section Good / Suggestion feedback buttons (POST/PUT/DELETE /proposal/feedback)
         - <ReactMarkdown>{section.introduction}</ReactMarkdown>
         - placeholder "#root" → embed the diagram (#stack-container)
         - if index === 4 → render Top Products table
         - if index === 5 → render <Price/> for the root system
         - placeholder "#enterprise_apps_and_usecases" → render selected use cases <ol>
         - <ReactMarkdown>{section.conclusion}</ReactMarkdown>
     3. Review Checklist (mirror of per-section feedback)
     4. Download proposal:
         - canDownloadProposal = every section has feedback AND every "suggestion" has a comment
         - On click: html-to-image (dell) or html2canvas-pro (nvidia) snapshot of #stack-container
                    → POST /projects/:id/proposal-docx { image_base64 }
                    → save .docx via file-saver
     5. Refresh Proposal:
         - POST /projects/:id/rebuild → navigate(/projects/<new>?tab=proposal)
         - Previous feedback flows into the regeneration on the backend
```

### F) System / Subsystem screen

```
[/projects/:id/systems/:systemId]   (or nested .../subsystem/:s1/subsystem/:s2)
   useEffectiveSubsystemId() returns the deepest id (the "current" subsystem).

   On mount:
     - GET /projects/:id/systems/:effectiveSubsystemId
     - if subsystem.design_status === "init" AND project is complete AND not already polling →
       SubsystemGenerationContext.startSubsystemGeneration(id, title)
       which calls POST /projects/:id/systems/:id and polls every 2s.

   Tabs:
     - Questions: BlockTitle (editable subsystem title/description) + Questions form
                  (mutates via PUT /projects/:id/systems/:id/info and PUT /questions/:id)
     - Design:    BlockTitle + diagram (Dell|NVIDIA via DiagramContext)
                  Selecting "Design" opens the right "Catalog" tab automatically.
     - Price:     BlockTitle + <Price/>
```

### G) Right sidebar

```
SidebarRight with three tabs:
   • Magic AI Advisor:
       - GET /projects/:id/chat/history once project is ready
       - Type/upload via POST /projects/:id/chat/upload + POST /projects/:id/chat
       - Live progress bubbles for project-level + per-subsystem generation
   • Team: placeholder
   • Catalog (Options):
       - Reads getProjectSubsystem(id, effectiveSubsystemId)
       - Renders <Products/> for products + product_families and <Systems/> for child subsystems
       - Filter by category="ecosystem" or "infrastructure" when openRightOptions(category) was called
       - Mutations: PUT /products/:id, PUT /product_families/:id, PUT /systems/:id with `status`
```

### H) Sidebar left navigation

```
SidebarLeft (project layout):
   - Project header card: client_name, name, lead_score (tooltip), price range
       (formatToUSD(price * 0.8) " - " formatToUSD(price * 1.3))
   - Primary CTA:
       - "Preview Proposal" (when canPreviewProposal)
       - "Use cases"        (when project completed but proposal not yet)
   - NavMain items (mapTreeToSidebar from GET /tree)
       - Sorted by `order`, filters out EUserProjectSelection.Removed
       - Open the first item by default
       - Clicking → /projects/:id/systems/:id (root) or .../subsystem/:id (nested)
```

### I) Project versioning (rebuild)

```
- A "Refresh Proposal" click on the proposal tab calls rebuildProject(projectId).
- Backend creates a new project linked by parent_project_id and increments rebuild_iteration.
- Frontend navigates to the new project; the Polling/Generation cycle restarts.
- Previous feedback is consumed by the backend during regeneration.
```

---

## New user flow for the rack-configurator feature

> The user will provide the detailed flow for the new feature. When they do, paste it under the headings below. The mockups already in the repo (`010_UI_1.jpg`, `010_UI_Server_HP.jpg`, `010_UI_Server_GRAY.jpg`, `010_UI_Components_02.jpg`, `010_UI_Components_03.jpg`, `010_UI_Components_02 (1).jpg`) describe a "blueprint" canvas with multi-rack overview, a single-rack RU detail view, and a component picker panel.

### High-level intent (placeholder)

(Replace with the user's description once provided.)

### Steps (placeholder)

1. ...
2. ...
3. ...

### How it integrates with existing data

(Replace with the user's mapping from rack/component widgets back to existing entities such as `Subsystem`, `SystemProduct`, `ProductBilling`. See `07-domain-model.md` for the available fields.)

### Edge cases / open questions

- (To be filled in.)
