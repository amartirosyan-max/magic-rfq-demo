# Agent instructions — Magic UI

This repository is the **magic-ui** front-end (React app under `app/`).

1. **Read first:** `app/docs/README.md` — index to all project documentation (`01-` … `14-`) and `app/docs/examples/` templates.
2. **Project rules:** `.cursor/rules/*.mdc` — always-on core rules plus file-type rules for `app/**/*.tsx` and `app/api/**/*.ts`.
3. **Stack / routes / APIs:** do not guess; use the numbered docs in `app/docs/` and the existing patterns in `app/api/`, `app/routes.ts`, and `app/constants/queryKeys.ts`.

When implementing features, prefer small PR-sized changes and match existing naming and TanStack Query invalidation patterns.
