# Documentation Changelog

## 2026-05-10

| Path | Change |
| --- | --- |
| `docs/30-workflows/issue-589-gate-metadata-structured-ledger/outputs/phase-11/link-checklist.md` | Added NON_VISUAL link evidence. |
| `docs/30-workflows/issue-589-gate-metadata-structured-ledger/outputs/phase-12/*.md` | Added strict 7 Phase 12 outputs. |
| `.claude/skills/aiworkflow-requirements/references/gate-metadata.md` | Added gate metadata structured ledger SSOT. |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added Issue #589 quick lookup. |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added Issue #589 resource lookup row. |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Added Issue #589 active workflow entry. |
| `.claude/skills/aiworkflow-requirements/changelog/20260510-issue589-gate-metadata-structured-ledger.md` | Added sync changelog. |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | Added sync headline. |
| `packages/shared/src/gate-metadata/**` | Added schema and focused tests for structured gate metadata. |
| `scripts/gate-metadata/**` | Added repository artifact validator and tests. |
| `.github/workflows/verify-gate-metadata.yml` | Added PR validator workflow file. |
| `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/{artifacts.json,outputs/artifacts.json}` | Backfilled `metadata.gates[]` and retained legacy gate text as `gateConditions_legacy`. |
| `docs/30-workflows/issue-589-gate-metadata-structured-ledger/{artifacts.json,outputs/artifacts.json}` | Promoted state to `implemented_local_runtime_pending` and recorded local validator/backfill gates. |

## Validation Record

| Command | Expected Result |
| --- | --- |
| `cmp -s docs/30-workflows/issue-589-gate-metadata-structured-ledger/artifacts.json docs/30-workflows/issue-589-gate-metadata-structured-ledger/outputs/artifacts.json` | exit 0 |
| `test -f docs/30-workflows/issue-589-gate-metadata-structured-ledger/outputs/phase-12/phase12-task-spec-compliance-check.md` | exit 0 |
| `pnpm --filter @ubm-hyogo/shared test -- gate-metadata` | exit 0; 16 files / 188 tests |
| `pnpm exec vitest run scripts/gate-metadata/__tests__/walk.test.ts` | exit 0; 1 file / 12 tests |
| `pnpm --filter @ubm-hyogo/shared typecheck` | exit 0 |
| `pnpm gate-metadata:validate --require-gates-for-changed docs/30-workflows/issue-589-gate-metadata-structured-ledger/artifacts.json docs/30-workflows/issue-589-gate-metadata-structured-ledger/outputs/artifacts.json docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/artifacts.json` | exit 0; OK 8 / WARN 322 / ERROR 0 |
| `bash scripts/coverage-guard.sh --package shared` | exit 0; lines 95.73 / branches 86.4 / functions 95.83 / statements 95.73 |
| `GOBIN="$PWD/.tmp/bin" go install github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 && .tmp/bin/actionlint .github/workflows/verify-gate-metadata.yml` | exit 0 |
