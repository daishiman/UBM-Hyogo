# Documentation Changelog

## 2026-05-18

| File | Change |
| --- | --- |
| `artifacts.json` | Added workflow metadata, canonical values, gates, and phase status ledger |
| `outputs/artifacts.json` | Added output mirror marker for artifact parity tracking |
| `index.md` | Corrected issue state, workflow state, and U-UT01-08 path |
| `phase-2-design.md` | Moved staging D1 distinct check to Phase 5 pre-gate |
| `phase-3-design-review.md` | Replaced inaccurate SQL bind "unchanged" claim with precise boundary |
| `phase-5-implementation.md` | Updated cursor IN clause decision timing |
| `phase-10-final-review.md` | Updated migration-noop rationale |
| `phase-12-documentation.md` | Replaced deferred skill sync with same-wave sync requirement and actual path |
| `phase-13-pr.md` / `outputs/phase-13/pr-body.md` | Changed close-keyword wording to `Refs #266` |
| `outputs/phase-12/*` | Created Phase 12 strict 7 files |
| `docs/30-workflows/unassigned-task/U-UT01-10-shared-sync-contract-zod.md` | Added formalization note and corrected package name |
| `docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md` | Added formalization note |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added issue #266 quick reference |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added issue #266 resource map row |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Added issue #266 active workflow entry |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | Added issue #266 sync headline |
| `.claude/skills/aiworkflow-requirements/changelog/20260518-issue266-shared-sync-zod-contract.md` | Created changelog fragment |

## Verification Notes

- Package names were checked against `packages/shared/package.json` and `apps/api/package.json`.
- Issue #266 is treated as CLOSED based on the skill compliance agent result; all PR text now uses `Refs #266`.
- Code tests are not run because this improvement cycle did not implement `apps/` or `packages/` changes. The implementation spec keeps test commands as future Phase 5-11 gates.
