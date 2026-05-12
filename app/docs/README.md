# magic-ui — Project Documentation

This folder contains all documentation needed to build new functional and UI/UX features in the **magic-ui** project (the React app under `magic-ui-dev/app`).

The docs are split by topic so any AI agent or developer can quickly grab the smallest amount of context relevant to the task at hand.

## How the docs are organised

Each topic is one numbered `.md` file. Larger code samples (file templates, full snippets) are kept in `./examples/` so the markdown stays focused on explanation. When a doc references code, it does so via a link to the actual source file (`~/...`) or a template under `examples/`.

```
app/docs/
├── README.md                          ← you are here (index)
├── 01-stack-and-libraries.md          ← runtime/dev dependencies, what each one is used for
├── 02-architecture.md                 ← high-level architecture, runtime model, render tree
├── 03-folder-structure.md             ← every top-level folder under app/, what lives there
├── 04-routes.md                       ← React Router 7 routes, layouts, navigation rules
├── 05-state-and-data-fetching.md      ← React Context + TanStack Query patterns, polling
├── 06-api-reference.md                ← all backend endpoints used by the app
├── 07-domain-model.md                 ← Project / System / Subsystem / Product / Questionnaire shapes
├── 08-coding-style.md                 ← naming, file conventions, observed patterns
├── 09-styling-and-theming.md          ← Tailwind v4, shadcn/ui, customer theming via data-customer
├── 10-app-functionality.md            ← what the app does end-to-end (business model)
├── 11-user-flow.md                    ← step-by-step user journey (placeholders for new flow)
├── 12-key-components.md               ← StackDell, Sidebars, Price, Questions, etc.
├── 13-environment-and-scripts.md      ← env vars, npm scripts, build/deploy notes
├── 14-implementation-playbook.md      ← how to add a new feature using prompts
└── examples/
    ├── route-template.tsx             ← starter for a new tabbed page route
    ├── api-client-template.ts         ← starter for an API module under app/api/
    ├── use-query-template.ts          ← TanStack Query / mutation conventions
    └── feature-folder-template.md     ← README for a new feature/* folder
```

## Reading order for a new contributor

If you are new to the project, read in this order:

1. **10-app-functionality** — understand WHAT the app does for the user.
2. **11-user-flow** — see HOW the user moves through it.
3. **02-architecture** — get a mental model of how the code is shaped.
4. **04-routes** + **03-folder-structure** — find your way around files.
5. **05-state-and-data-fetching** + **07-domain-model** — understand server data and React state.
6. **12-key-components** — meet the components you will most often touch.
7. **08-coding-style** + **09-styling-and-theming** — write code that fits the codebase.
8. **14-implementation-playbook** — when you are ready to ship something new.

## Reading order for "I just need to ship a feature"

1. **14-implementation-playbook** (workflow + checklist)
2. The doc(s) for the part of the app you are touching:
   - Sidebar / catalog → `12-key-components` + `05-state-and-data-fetching`
   - New API call → `06-api-reference` + `examples/api-client-template.ts`
   - New page / tab → `04-routes` + `examples/route-template.tsx`
   - New theme / colors → `09-styling-and-theming`

## What this app is, in one paragraph

`magic-ui` is the front-end of **Magic** — an AI-assisted RFP/RFQ workspace. A sales engineer uploads an RFP document, the backend extracts a questionnaire, scores the lead, generates a system tree (use cases → systems → subsystems → products), prices it, and produces a downloadable proposal. The UI lets the user iterate: answer/refine questionnaire items, accept/reject recommended systems and products, see a live "stack" diagram (Dell or NVIDIA brand variant), tweak quantities and prices, leave per-section feedback and finally download the proposal as a `.docx`.

See `10-app-functionality.md` for the long version.
