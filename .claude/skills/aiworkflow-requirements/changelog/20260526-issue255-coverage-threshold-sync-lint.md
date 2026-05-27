# 2026-05-26 issue255 coverage threshold sync lint

Issue #255 coverage threshold sync lint was implemented as `implemented_local_evidence_captured / implementation / NON_VISUAL`.

- Added `scripts/coverage-threshold-lint.ts` to compare the aiworkflow SSOT threshold, `scripts/coverage-guard.sh`, and optional `codecov.yml` `target:` values while ignoring Codecov tolerance `threshold:`.
- Added focused Vitest coverage in `scripts/__tests__/coverage-threshold-lint.spec.ts` (8 PASS).
- Added `.github/workflows/coverage-threshold-lint.yml` and `package.json#scripts.lint:coverage-threshold`.
- Captured Phase 11 local evidence under `docs/30-workflows/completed-tasks/issue-255-coverage-threshold-sync-lint/outputs/phase-11/evidence/`.
- Moved `docs/30-workflows/unassigned-task/task-codecov-threshold-sync-lint-001.md` to `docs/30-workflows/completed-tasks/task-codecov-threshold-sync-lint-001.md` and marked it consumed.

Commit, push, PR creation, and GitHub Actions runtime observation remain user-gated.
