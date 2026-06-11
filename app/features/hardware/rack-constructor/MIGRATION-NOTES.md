# Rack Constructor — Source-side migration notes

> This folder lives in **Magic 2.0** (`magic-ui-dev/`). The components here are being **migrated** into Magic 2.1 (`magic-ui/`) as part of the new rack constructor feature.

## Where the migration brief lives

All planning, contracts, and the step-by-step playbook live in the **target** repository:

```
magic-ui/app/docs/features/rack-constructor/
├── MIGRATION-PLAYBOOK.md           ← READ THIS FIRST
├── README.md                        ← index of all files
├── example-adgsa-full-target.json   ← API contract (final)
├── workflow-bom-contract.json       ← BOM contract (final)
├── DATA-TREE.txt                    ← field tree with annotations
├── BRIEF.txt / BACKEND-BRIEF.md     ← briefs sent to backend team
└── api-response/                    ← real API responses for context
```

Open `MIGRATION-PLAYBOOK.md` before touching any code.

## What lives in THIS folder (Magic 2.0)

Five purely visual primitives. They render a single rack and the chassis inside it. **All five migrate** to `magic-ui/app/features/rack-constructor/components/` — see the source-inventory table in `MIGRATION-PLAYBOOK.md`.

| File | Role | Migration note |
| --- | --- | --- |
| `RackFrame.tsx` | Top SVG + slot column + bottom SVG composition. | Keep. Strip drag-drop wiring. |
| `RackNode.tsx` | Absolutely positioned chassis card inside a rack. | Keep. Replace any `RackEditsContext` import with plain props. |
| `RackSideRail.tsx` | Side-rail border (CSS-only). | Keep verbatim. |
| `RackUnitSlot.tsx` | One 1U row inside a rack. | Keep verbatim. |
| `StandaloneNode.tsx` | Frameless solo chassis (no rack frame). | Keep. Useful for PDU/cabling strips. |
| `index.ts` | Barrel re-export of the five primitives. | Recreate in the new location. |

## What you will NOT need from elsewhere in `magic-ui-dev/app/features/hardware/`

The 2.0 hardware feature folder also contains drag-and-drop providers (`RackEditsContext`, `ComponentEditsContext`, `SubsystemEditsContext`, `RackEditsProvider`, `ComponentEditsProvider`, `SubsystemEditsProvider`), the cross-rack DnD engine (`RackDndProvider`, `DraggableRackNode` — `@dnd-kit/core` + framer-motion; see `app/docs/features/hardware-configurator/RACK-NODE-EDITOR-PLAN.md` §13), and hard-coded project data (`projects/avaya.ts`, `projects/adgsa-ai.ts`).

> Note: `RackNode.tsx` stays **drag-free and presentational** — the dnd-kit wiring lives in the feature folder and is passed into `RackNode` as plain props (`nodeRef`, `dragHandleProps`, `isActiveDrag`). The five primitives in this folder still migrate clean.

For **v1** of the new rack constructor:

- Drag-and-drop providers are **out of scope** — do not migrate.
- `projects/adgsa-ai.ts` is **not** migrated as-is; it is converted into a flat BOM (`mock-bom.ts`) shaped per `workflow-bom-contract.json`.
- `projects/avaya.ts` is dropped entirely for v1.

See the "Source inventory (Magic 2.0)" section in `MIGRATION-PLAYBOOK.md` for the full per-file matrix.

## Why all of this is being done

1. Magic 2.1 (`magic-ui/`) was rebuilt without the hardware configurator; we're re-introducing it under the new project conventions and against the real backend.
2. The current Magic 2.1 API lacks the data needed for visualization (`quantity`, `status: chosen`, `size_u`, `form_factor`, `rack_group`, populated `image_url`, `components[]`). The backend team (Stas's workflow + the existing platform backend) is implementing those.
3. While the backend lands the new fields, the frontend renders against a mock BOM (seeded from this folder's neighbour `projects/adgsa-ai.ts`). The adapter that consumes mocks is structurally identical to the adapter that will consume the API — so switching is a one-line env-var flip.

## Quick start for a new AI chat

If you are an AI chat that has just been pointed at this folder:

1. Read `magic-ui/app/docs/features/rack-constructor/MIGRATION-PLAYBOOK.md` end to end.
2. Read the four files it lists as required (contracts + the 2.0 `types.ts`).
3. Begin at step 1 of "Migration plan (step-by-step)".
4. Use the components in this folder as the visual reference and import them after migration into `magic-ui/app/features/rack-constructor/components/`.
