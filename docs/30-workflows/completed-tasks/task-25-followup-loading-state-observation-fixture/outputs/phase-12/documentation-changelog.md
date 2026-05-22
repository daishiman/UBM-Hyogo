# Documentation Changelog

## 2026-05-16

### Changed

- Added Phase 12 strict 7 outputs for `task-25-followup-loading-state-observation-fixture`.
- Added root/output artifact ledgers and synchronized workflow state to `verified`.
- Updated `SMOKE-COVERAGE-MATRIX.md` row 19 from `N/A-runtime-observation` to deterministic fixture runtime observation.
- Updated parent task-25 implementation guide to reflect the resolved loading follow-up.
- Updated `docs/00-getting-started-manual/specs/09-ui-ux.md` to document `/smoke/*` wrappers, `__smoke__` private sources, and the shared fixture guard.
- Registered the workflow in aiworkflow-requirements quick-reference, resource-map, task-workflow-active, artifact inventory, and changelog.

### Validator Execution Log

| Command | Status |
| --- | --- |
| `git status --short` | executed; real code/spec/skill changes present |
| `git diff --stat` | executed; implementation and workflow docs changed |
| `pnpm --filter @ubm-hyogo/web typecheck` | pass |
| `pnpm --filter @ubm-hyogo/web lint` | pass |
| `pnpm --filter @ubm-hyogo/web build` | pass |
| `pnpm --filter @ubm-hyogo/web verify-design-tokens` | pass: 9 tests |
| `pnpm --filter @ubm-hyogo/web test -- app/__smoke__/_lib/fixture-guard.spec.ts` | pass: apps/web Vitest 589 passed / 1 skipped; focused fixture guard spec 4 passed |
| `pnpm run verify:phase12-compliance` | pass |
| focused Playwright loading-state smoke | pass: 5 passed |
| focused Playwright loading-state smoke `--repeat-each=10` | pass: 50 passed (11.6m) |
