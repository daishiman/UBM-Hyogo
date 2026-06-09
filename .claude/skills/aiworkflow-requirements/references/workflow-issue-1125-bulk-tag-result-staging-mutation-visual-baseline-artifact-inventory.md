# Workflow Artifact Inventory — issue-1125-bulk-tag-result-staging-mutation-visual-baseline

## Summary

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / staging_runtime_pending_user_gate` |
| issue | #1125 CLOSED; reopen / mutation not required |
| parent | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` |
| source unassigned | `docs/30-workflows/unassigned-task/task-issue-1036-followup-001-staging-authenticated-bulk-tag-visual-baseline.md` |

## Implementation Artifacts

| Path | Role |
| --- | --- |
| `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-result-authenticated.spec.ts` | authenticated staging UI mutation spec for all-success and deleted-member partial-failure result summaries |
| `apps/api/migrations/seed/bulk-tag-result-staging-seed.sql` | staging-only synthetic fixture seed with `e2e_test_issue1125_` prefix; no explicit SQL transaction |
| `apps/api/migrations/seed/bulk-tag-result-staging-cleanup.sql` | prefix-scoped cleanup for six touched tables; no explicit SQL transaction |
| `scripts/smoke/capture-bulk-tag-result.sh` | guard -> seed -> Playwright capture -> trap cleanup -> residual-zero runner |
| `scripts/smoke/__tests__/capture-bulk-tag-result.test.sh` | local runner test using fake `pnpm` and fake `cf.sh`; verifies guard rejection, PASS summary, capture-failure FAIL summary, and log-name contract without D1/staging access |
| `package.json` | wires the new runner test into `smoke:test` |

## Workflow Artifacts

| Path | Role |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/index.md` | workflow index and AC SSOT |
| `docs/30-workflows/completed-tasks/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/artifacts.json` | root metadata and gates |
| `docs/30-workflows/completed-tasks/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/outputs/artifacts.json` | output metadata mirror |
| `docs/30-workflows/completed-tasks/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/outputs/phase-11/manual-test-result.md` | local evidence plus staging runtime pending ledger |
| `docs/30-workflows/completed-tasks/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 compliance |

## Evidence

| Evidence | Status |
| --- | --- |
| `bash -n scripts/smoke/capture-bulk-tag-result.sh && bash -n scripts/smoke/__tests__/capture-bulk-tag-result.test.sh` | PASS |
| `bash scripts/smoke/__tests__/capture-bulk-tag-result.test.sh` | PASS（includes fail-closed capture summary regression） |
| authenticated staging screenshot baseline | pending_user_gate |

## Lessons Learned

- L-I1125-001: Mutation visual baselines should put side-effect ownership in a shell runner, not in the Playwright spec. The spec should own UI actions and screenshots only.
- L-I1125-002: D1 remote seed/cleanup files must avoid explicit `BEGIN TRANSACTION` / `COMMIT`; `wrangler d1 execute --remote --file` provides the batch boundary.
- L-I1125-003: Result-state visual coverage should be split by UI-reproducibility. Deleted-member `skipped` is UI-reproducible with synthetic fixtures; `tag_not_found` remains local fixture/component coverage because the UI picker cannot naturally select an unregistered tag.
