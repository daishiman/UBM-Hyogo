# Workflow Artifact Inventory: Issue #617 CI test time reduction split

## Metadata

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/issue-617-ci-test-time-reduction-split/` |
| state | `implemented_local_runtime_pending / implementation / NON_VISUAL / LOCAL_EVIDENCE_PARTIAL_CI_RUNTIME_PENDING` |
| source issue | Issue #617 (CLOSED, `Refs #617` only) |
| source unassigned trace | `docs/30-workflows/unassigned-task/task-issue-577-followup-003-test-grouping-by-d1-usage.md` |
| created | 2026-05-11 |

## Canonical artifacts

| Artifact | Purpose |
| --- | --- |
| `index.md` | top-level implementation contract |
| `artifacts.json` | workflow state ledger |
| `outputs/artifacts.json` | root/output parity mirror |
| `phase-01.md` to `phase-13.md` | task-specification-creator phase contract |
| `outputs/phase-04/classification.md` | D1/unit classification ledger schema |
| `outputs/phase-11/*` | NON_VISUAL runtime evidence stubs |
| `outputs/phase-12/*` | strict 7 close-out outputs |

## Implementation targets

| Path | Change |
| --- | --- |
| `vitest.config.ts` | exclude D1-dependent API tests from unit/default config |
| `vitest.d1.config.ts` | D1-only serial config |
| `apps/api/package.json` | split coverage scripts and merge wrapper |
| `apps/web/package.json` | `test:coverage:web` alias |
| `scripts/coverage-guard.sh` | `--group` artifact-only support; aggregate `--no-run` threshold enforcement |
| `scripts/coverage-merge.mjs` | Istanbul coverage merge |
| `.github/workflows/ci.yml` | `coverage-gate-shard` matrix + aggregate `coverage-gate` with `if: always()` fail-closed behavior |

## Governance boundary

Branch protection mutation is not required because the aggregate job keeps the existing required context name `coverage-gate`.
