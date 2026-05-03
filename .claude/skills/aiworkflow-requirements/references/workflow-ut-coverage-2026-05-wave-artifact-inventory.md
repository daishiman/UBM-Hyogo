# UT Coverage 2026-05 Wave Artifact Inventory

## Canonical Workflows

| Workflow | Status | Evidence |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/ut-api-cov-precondition-01-test-failure-recovery/` | implemented-local / test-fixture implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | root `artifacts.json`, `outputs/artifacts.json`, Phase 1-13 specs, Phase 11 NON_VISUAL measured evidence (`coverage-result.md`, `regression-check.md`, `manual-evidence.md`, `manual-smoke-log.md`, `link-checklist.md`), Phase 12 strict 7 files |
| `docs/30-workflows/ut-coverage-2026-05-wave/` | wave orchestration guide / docs-only / active specs | README execution order and five wave-2 coverage workflow roots |
| `docs/30-workflows/ut-web-cov-01-admin-components-coverage/` | implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | admin component focused tests; Phase 11 measured evidence (`vitest-run.log`: 21 files / 196 tests PASS, `coverage-target-files.txt`: target 7 files all threshold PASS) and Phase 12 strict 7 files |
| `docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-web-cov-02-public-components-coverage/` | spec_created / docs-only / NON_VISUAL / remaining-only | public component coverage hardening spec; Phase 11 placeholder evidence and Phase 12 strict 7 files |
| `docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-web-cov-03-auth-fetch-lib-coverage/` | spec_created / docs-only / NON_VISUAL / remaining-only | auth/fetch library coverage hardening spec; Phase 11 placeholder evidence and Phase 12 strict 7 files |
| `docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-web-cov-04-admin-lib-ui-primitives-coverage/` | spec_created / docs-only / NON_VISUAL / remaining-only | admin library and UI primitive coverage hardening spec; Phase 11 placeholder evidence and Phase 12 strict 7 files |
| `docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-08a-01-public-use-case-coverage-hardening/` | spec_created / docs-only / NON_VISUAL / remaining-only | public use-case coverage hardening spec; Phase 11 placeholder evidence and Phase 12 strict 7 files |
| `docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md` | unassigned / wave-3 planning | cross-wave coverage gap roadmap owner; separates task-scope zero new unassigned tasks from global remaining coverage gaps |

## Phase 12 Strict Files

The precondition workflow uses exactly these Phase 12 files:

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

Wave-2 workflows use the same strict 7-file Phase 12 set. `ut-web-cov-01-admin-components-coverage` additionally records measured Phase 11 focused Vitest evidence because its apps/web test implementation is present in this branch.

## Gate Boundary

- Precondition gate: apps/api tests green, `apps/api/coverage/coverage-summary.json` generated, `bash scripts/coverage-guard.sh --no-run --package apps/api` exit 0, apps/api coverage >=80%.
- Upgrade gate: Statements/Functions/Lines >=85% and Branches >=80% is delegated to UT-08A-01 and is not a PASS condition for this precondition workflow.
- Implementation boundary: wave-1 changes only `apps/api/src/jobs/__fixtures__/d1-fake.ts`; `ut-web-cov-01-admin-components-coverage` changes apps/web tests only. Runtime production code and packages/* are unchanged.
- Cross-wave gap boundary: `ut-web-cov-01` Phase 12 may report zero new tasks inside its seven-component scope, while remaining layer-level coverage gaps are tracked by `docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md`.

## Same-Wave Sync

| Target | Status |
| --- | --- |
| `indexes/resource-map.md` | synced with canonical workflow row |
| `indexes/quick-reference.md` | synced with UT coverage quick reference |
| `references/task-workflow-active.md` | synced with active workflow section |
| `LOGS/_legacy.md` | synced with 2026-05-01 entry |
| `references/lessons-learned-ut-coverage-2026-05-wave.md` | L-UTCOV-001〜006（fixture binding contract / coverage-summary.json gate / 2-layer gate / wave 分割 / main.md 3-state / lessons-learned wave 集約） |
