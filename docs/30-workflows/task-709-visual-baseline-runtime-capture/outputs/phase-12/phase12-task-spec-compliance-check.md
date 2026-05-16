# Phase 12 Task Spec Compliance Check

## Summary verdict

`CONTRACT_READY_IMPLEMENTATION_PENDING / runtime_pending` — the task-709 workflow now has Phase 1-13 specs, root/output artifacts parity, Phase 11 runtime boundary files, Phase 12 strict 7 outputs, and aiworkflow same-wave registration. It does not claim completion before user-gated baseline capture and CI evidence.

## Changed-files classification

| Classification | Path patterns |
| --- | --- |
| workflow-spec | `docs/30-workflows/task-709-visual-baseline-runtime-capture/**` |
| follow-up | `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` |
| aiworkflow-sync | `.claude/skills/aiworkflow-requirements/{SKILL-changelog.md,indexes,resource-map,quick-reference,references,changelog}/**` |
| planned-runtime-implementation | `.github/workflows/playwright-visual-full.yml`, `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png`, `SMOKE-COVERAGE-MATRIX.md` |

No runtime mutation, commit, push, or PR is executed in this cycle.

## `workflow_state` and phase status consistency

Root and outputs `artifacts.json` both use:

- `metadata.workflow_state = CONTRACT_READY_IMPLEMENTATION_PENDING`
- `metadata.implementation_status = runtime_capture_contract_ready`
- `taskType = implementation`
- `visualEvidence = VISUAL`

Phase 5 / 6 / 7 / 9 / 10 / 11 are `runtime_pending`; Phase 13 is `blocked`.

## Phase 11 evidence file inventory

| Path | Status |
| --- | --- |
| `outputs/phase-11/main.md` | present; runtime boundary |
| `outputs/phase-11/evidence/baseline-list.md` | present; runtime_pending placeholder |
| `outputs/phase-11/evidence/user-approval-marker.md` | runtime_pending |
| `outputs/phase-11/evidence/baseline-update-run.md` | runtime_pending |
| `outputs/phase-11/evidence/visual-full-stability.md` | runtime_pending |

## Phase 12 strict 7 file inventory

| File | Present |
| --- | --- |
| `outputs/phase-12/main.md` | yes |
| `outputs/phase-12/implementation-guide.md` | yes |
| `outputs/phase-12/system-spec-update-summary.md` | yes |
| `outputs/phase-12/documentation-changelog.md` | yes |
| `outputs/phase-12/unassigned-task-detection.md` | yes |
| `outputs/phase-12/skill-feedback-report.md` | yes |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | yes |

`artifacts.json` and `outputs/artifacts.json` are both present and must match via `cmp -s artifacts.json outputs/artifacts.json`.

## Skill/reference/system spec same-wave sync

| Ledger | Status |
| --- | --- |
| aiworkflow `SKILL-changelog.md` | updated |
| aiworkflow `indexes/resource-map.md` | updated |
| aiworkflow `indexes/quick-reference.md` | updated |
| aiworkflow `references/task-workflow-active.md` | updated |
| aiworkflow changelog | `changelog/20260516-task-709-visual-baseline-runtime-capture.md` |
| aiworkflow artifact inventory | `references/workflow-task-709-visual-baseline-runtime-capture-artifact-inventory.md` |

## Runtime or user-gated boundary

| Item | Boundary |
| --- | --- |
| baseline update workflow dispatch | user-gated |
| baseline-update PR import | user-gated |
| visual-full 2-run stability evidence | runtime_pending |
| commit / push / PR | user-gated |
| branch protection required check | formal follow-up |

## Archive/delete stale-reference gate

No workflow root is moved or deleted in this cycle. The upstream task-18-fu root remains under `completed-tasks/` and task-709 references it as upstream.

## Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | `completed` and checked PASS claims were removed from runtime-pending areas. |
| 漏れなし | PASS_WITH_RUNTIME_PENDING | Phase 1-13, artifacts parity, strict 7, Phase 11 boundary, formal follow-up, and aiworkflow sync are present; runtime evidence is explicitly pending. |
| 整合性あり | PASS | State vocabulary, taskType, visualEvidence, issue, and upstream/downstream references are aligned. |
| 依存関係整合 | PASS | task-18-fu infra, task-709 runtime capture, and branch-protection governance mutation are separated. |
