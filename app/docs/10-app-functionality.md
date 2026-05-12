# 10 — What the App Does

`magic-ui` (product name **Magic**) is the front-end of an **AI-assisted RFP/RFQ workspace**. It is used by sales engineers / pre-sales solution architects to turn a customer's RFP (Request For Proposal) into a clear, priced, and downloadable technical proposal for a Dell + NVIDIA AI-enterprise stack (with NVIDIA-only and other vendor variants).

The app does not just render data — it orchestrates several long-running AI generation steps and lets the user iteratively review and shape the result.

## Who uses it

- **Sales / pre-sales engineers** — primary user. They upload an RFP, refine the questionnaire, accept or remove recommended systems and products, and download a proposal to send back to the customer.
- **Admins / "system" role** — manage users, manage product requests (the catalog).
- **Customer (indirectly)** — receives the generated `.docx` proposal.

## What the app does, end to end

```
1. Sign in
   → /signin returns a token, stored in localStorage.

2. Dashboard
   → A list of all projects in the org.
   → Form to create a new project: paste a description (the "RFP" text), upload one or more RFP documents (.pdf/.doc/.docx).
   → POST /projects (multipart) creates the project.

3. Project creation (background, polled)
   → The backend extracts a structured questionnaire from the RFP and computes a lead score.
   → The UI shows a Loader on the project page while creating_status === "in_progress".

4. Lead score gate
   → If parseLeadScore(project.lead_score) <= 2.0, the user is redirected to /projects/:id/lead-score
     with a rejection message. Otherwise the project page opens normally.

5. Project page (Questions tab)
   → Editable project name + description (PUT /projects/:id).
   → Project files list (upload more via POST /projects/:id/assets, delete, click to download).
   → Two big progress bars:
       • Questionnaire Completion (% answered)
       • Proposal Confidence (estimated reliability of the proposal)
   → Questionnaire form (sections × questions). Answers can come from RFP, AI (Magic Wand), or User.
     - Each question has a Magic Wand button that calls PUT /questions/:id/magic.
     - Editing flips the source to "User"; the field becomes black/non-italic.
     - Save on blur (PUT /questions/:id).
   → Export questions as .xlsx; copy a templated email asking the customer to fill it in.

6. Use cases tab (unlocked when creating_status === "completed")
   → Click in → POST /projects/:id/usecases/generate; the GET polls until subsystems appear.
   → Each use case has a long_description and ActionsButtons (In proposal / Already Done / Removed).
   → "Generate more new use cases" → POST /projects/:id/usecases/extend, appended to the list.
   → Export use cases.

7. Proposal tab (unlocked when system_generation_status === "completed" OR use cases generated)
   → If system_generation_status === "init", the UI calls POST /projects/:id/systems
     (system tree generation) and turns on PollingProvider.
   → Once the proposal[] is available, the page renders:
       • The diagram (StackDell or Stack), with animated zone-by-zone reveal
       • Each proposal section (introduction → optional embeds → conclusion)
       • For section index 4: a Top Products table (per-subsystem product list)
       • For section index 5: the <Price/> table for the root system
       • Per-section Good / Suggestion feedback buttons (creates/updates/deletes feedback)
   → "Review Checklist": the same Good/Suggestion buttons in a list, plus a counter "Checked: X/N".
   → "Download proposal" enabled only when:
       • All sections have feedback
       • Every "suggestion" has a non-empty comment
       • creating_status === "completed" AND system_generation_status === "completed"
   → "Refresh Proposal" → POST /projects/:id/rebuild → navigates to the new project, re-using the
     previous feedback to re-generate.

8. System / Subsystem pages (/projects/:id/systems/:systemId or nested)
   → Tabs: Questions / Design / Price.
   → Questions: subsystem-scoped questionnaire.
   → Design: the diagram (Dell or NVIDIA), with a Select to switch.
       - When opening Design, the right sidebar switches to "Catalog" (Options) so the user
         can add/remove products and subsystems for this scope.
       - If the subsystem's design_status is init when opened, generation kicks off in
         SubsystemGenerationContext (POST /projects/:id/systems/:subsystemId), polled every 2s.
   → Price: <Price/> billing table for that subsystem (and its inner subsystems).

9. Right sidebar
   → "Magic AI Advisor" — chat with the project (POST /projects/:id/chat). Lets the user attach
     files. Live progress bubbles for project-level system generation and per-subsystem design.
   → "Team" — placeholder.
   → "Catalog" (Options) — lists Products / Product Families / Subsystems for the current scope
     with the same In proposal / Already Done / Removed action buttons.

10. Sidebar Left
    → Project meta: client_name, project name, lead score (with a tooltip explaining the
      formula), price range (= price × [0.8 .. 1.3]).
    → Big button: "Preview Proposal" (when proposal is ready) or "Use cases" (when project is
      complete but proposal not yet ready).
    → Nav tree: derived from /projects/:id/tree → mapTreeToSidebar(...) → NavMain.

11. Header
    → Logo + brand wordmark, customer-aware logo via data-customer.
    → Project meta on the left, NavUser on the right (account → log out, etc.).
```

## Special behaviours

- **Per-section deep links**: The dashboard table can link straight to a specific proposal section: `/projects/:id?tab=proposal&section=4`. The Proposal tab schedules a few rAF/timeout retries to scroll to `#proposal-section-4` once the section is rendered.
- **Multi-language UI text**: Most UI is in English. A few comments and toast messages from the original codebase are in Russian — leave them in existing files, write new copy in English.
- **Optimistic editing**: Renaming the project, editing a section title, changing a quantity — all do an optimistic update on the cache, with rollback on error and an invalidation on settle.
- **Generation chat bubbles**: The chat sidebar listens to both `PollingContext.pollingData.system_generation_*` and `SubsystemGenerationContext.subsystemGenerationStatuses`, and renders animated `LoadingChatBubble`s for each in-flight job.
- **Export flows**: Questionnaire (xlsx), Use cases (binary), Proposal (docx) all use `file-saver` and read the filename from `Content-Disposition` when present.

## What is NOT in the app today

These are absences worth being aware of when scoping new work:

- No mobile layout polish.
- No dark mode (the tokens exist, but no toggle is wired in).
- No realtime / WebSocket layer — everything is polled.
- No physical rack configurator surface yet (this is the new feature area; the mockups in `010_UI_Server_*.jpg` and `010_UI_Components_*.jpg` describe a forthcoming "blueprint canvas" rack designer that will live alongside today's abstract `StackDell` view).
- No first-class team management UI ("Team" tab is a placeholder).
- No granular permissions UI beyond the `system` / `admin` / `user` role check (`isAdminRole`).
