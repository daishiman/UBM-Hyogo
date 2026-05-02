# UT Coverage 2026-05 Wave Artifact Inventory

## Canonical Workflows

| Workflow | Status | Evidence |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/ut-api-cov-precondition-01-test-failure-recovery/` | implemented-local / test-fixture implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | root `artifacts.json`, `outputs/artifacts.json`, Phase 1-13 specs, Phase 11 NON_VISUAL measured evidence (`coverage-result.md`, `regression-check.md`, `manual-evidence.md`, `manual-smoke-log.md`, `link-checklist.md`), Phase 12 strict 7 files |
| `docs/30-workflows/completed-tasks/ut-coverage-2026-05-wave/` | wave orchestration guide / docs-only | README execution order and five wave-2 coverage workflow roots |

## Phase 12 Strict Files

The precondition workflow uses exactly these Phase 12 files:

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## Gate Boundary

- Precondition gate: apps/api tests green, `apps/api/coverage/coverage-summary.json` generated, `bash scripts/coverage-guard.sh --no-run --package apps/api` exit 0, apps/api coverage >=80%.
- Upgrade gate: Statements/Functions/Lines >=85% and Branches >=80% is delegated to UT-08A-01 and is not a PASS condition for this precondition workflow.
- Implementation boundary: only `apps/api/src/jobs/__fixtures__/d1-fake.ts` is changed; runtime production code, apps/web, and packages/* are unchanged.

## Same-Wave Sync

| Target | Status |
| --- | --- |
| `indexes/resource-map.md` | synced with canonical workflow row |
| `indexes/quick-reference.md` | synced with UT coverage quick reference |
| `references/task-workflow-active.md` | synced with active workflow section |
| `LOGS/_legacy.md` | synced with 2026-05-01 entry |
| `references/lessons-learned-ut-coverage-2026-05-wave.md` | L-UTCOV-001〜006（fixture binding contract / coverage-summary.json gate / 2-layer gate / wave 分割 / main.md 3-state / lessons-learned wave 集約） |
