# workflow-03a-stablekey-literal-lint-enforcement-artifact-inventory

## Current State

| Item | Value |
| --- | --- |
| Workflow root | `docs/30-workflows/03a-stablekey-literal-lint-enforcement/` |
| State | `enforced_dry_run` |
| visualEvidence | `NON_VISUAL` |
| Phase status | Phase 1-12 completed / Phase 13 pending_user_approval |
| Legacy cleanup | Issue #393 `strict_ready` / 0 strict violations / CI gate promotion pending |

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
| `outputs/phase-11/evidence/lint-clean-pass.txt` | warning-mode lint chain evidence for 03a |
| `docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/outputs/phase-11/evidence/lint-strict-after.txt` | Issue #393 strict lint clean PASS; legacy literal blocker resolved |
| `outputs/phase-11/evidence/allow-list-snapshot.json` | allow-list and stableKey count snapshot |

## Open Follow-Ups

| Task | Reason |
| --- | --- |
| `docs/30-workflows/unassigned-task/task-03a-stablekey-strict-ci-gate-001.md` | GitHub Actions does not yet run strict stableKey lint as a blocking gate |
