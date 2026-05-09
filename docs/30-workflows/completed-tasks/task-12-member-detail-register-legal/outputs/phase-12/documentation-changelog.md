# Documentation Changelog

## 2026-05-09

Changed:

- Created `outputs/artifacts.json` mirror and Phase 1-13 output ledgers.
- Created Phase 12 strict seven files.
- Normalized AC count to 13 across `index.md`, `phase-07.md`, `phase-10.md`, and `phase-12.md`.
- Replaced the obsolete web CI reference with existing `.github/workflows/e2e-tests.yml` and `.github/workflows/pr-build-test.yml`.
- Corrected workflow state wording to `implemented-local` with Phase 11 visual/runtime evidence pending.
- Corrected Phase 13 gate wording from `NON_VISUAL` to `VISUAL_ON_EXECUTION`.
- Added aiworkflow-requirements resource-map, quick-reference, task-workflow-active, artifact inventory, changelog, and LOGS entries.

Validation notes:

- Full Playwright visual/runtime evidence remains pending user approval; focused local gates are recorded separately.
- `apps/web` implementation was executed in this cycle; no `packages/` implementation changed.
