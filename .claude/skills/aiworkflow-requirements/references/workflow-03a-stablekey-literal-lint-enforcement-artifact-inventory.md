# workflow-03a-stablekey-literal-lint-enforcement-artifact-inventory

## Current State

| Item | Value |
| --- | --- |
| Workflow root | `docs/30-workflows/03a-stablekey-literal-lint-enforcement/` |
| State | `enforced_dry_run` |
| visualEvidence | `NON_VISUAL` |
| Phase status | Phase 1-12 completed / Phase 13 pending_user_approval |

## Implementation Artifacts

| Path | Role |
| --- | --- |
| `scripts/lint-stablekey-literal.mjs` | stableKey literal static check (`warning` default, `--strict` error mode, `--include` fixture scan) |
| `scripts/lint-stablekey-literal.test.ts` | focused Vitest coverage for allow-list, exception globs, strict fail, fixture include, comment exclusion |
| `scripts/__fixtures__/stablekey-literal-lint/` | Phase 6 allowed / violation / edge fixtures |
| `package.json` | `lint` chain integration plus `lint:stablekey` and `lint:stablekey:strict` |

## Evidence

| Path | Meaning |
| --- | --- |
| `outputs/phase-11/manual-smoke-log.md` | warning-mode and strict-mode dry-run evidence |
| `outputs/phase-11/evidence/lint-violation-fail.txt` | strict mode detects legacy violations and exits non-zero |
| `outputs/phase-11/evidence/lint-clean-pass.txt` | warning-mode lint chain evidence; not a fully enforced clean PASS |
| `outputs/phase-11/evidence/allow-list-snapshot.json` | allow-list and stableKey count snapshot |

## Open Follow-Ups

| Task | Reason |
| --- | --- |
| `docs/30-workflows/completed-tasks/task-03a-stablekey-literal-legacy-cleanup-001.md` | strict mode still reports legacy stableKey literal violations |
| `docs/30-workflows/completed-tasks/task-03a-stablekey-strict-ci-gate-001.md` | GitHub Actions does not yet run strict stableKey lint as a blocking gate |
| `docs/30-workflows/issue-394-stablekey-strict-ci-gate/` | current Issue #394 workflow; blocked until strict violations reach 0 |
