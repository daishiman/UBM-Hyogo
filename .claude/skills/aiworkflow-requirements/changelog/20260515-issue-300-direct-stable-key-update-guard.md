# 2026-05-15 Issue #300 Direct Stable Key Update Guard

- Registered `docs/30-workflows/issue-300-direct-stable-key-update-guard/` as `implemented_local_runtime_pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`.
- Added `scripts/lint-stable-key-update.mjs` to reject direct `schema_questions.stable_key` mutation via SQL literal/template and `.update(schemaQuestions).set({ stable_key | stableKey })`.
- Added focused Vitest coverage and fixtures under `scripts/__fixtures__/stable-key-update-lint/` with 12 passing cases.
- Removed unused `updateStableKey()` from `apps/api/src/repository/schemaQuestions.ts`.
- Wired the guard into `package.json` lint chain, `lefthook.yml`, and `.github/workflows/verify-stable-key-update.yml`.
- Synced Schema Alias Resolution Contract, resource-map, quick-reference, task-workflow-active, artifact inventory, and Phase 11/12 evidence.
- GitHub Actions runtime evidence, commit, push, PR, and archive move remain user-gated.

Refs #300
