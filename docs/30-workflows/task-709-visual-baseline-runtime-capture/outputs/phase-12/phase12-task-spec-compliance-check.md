# Phase 12 Task Spec Compliance Check

## Summary verdict

`PR_OPEN_MERGE_DIRTY / implementation / VISUAL` — the task-709 workflow now has Phase 1-13 specs, root/output artifacts parity, 51 baseline PNGs, Phase 11 runtime evidence, Phase 12 strict 7 outputs, PR #760, and aiworkflow same-wave registration. It does not claim merge readiness because PR #760 currently reports `mergeStateStatus=DIRTY`.

## Changed-files classification

| Classification | Path patterns |
| --- | --- |
| workflow-spec | `docs/30-workflows/task-709-visual-baseline-runtime-capture/**` |
| follow-up | `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` |
| aiworkflow-sync | `.claude/skills/aiworkflow-requirements/{SKILL-changelog.md,indexes,resource-map,quick-reference,references,changelog}/**` |
| runtime-implementation | `.github/workflows/playwright-visual-full.yml`, `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png`, `SMOKE-COVERAGE-MATRIX.md` |

Runtime capture, local commits, task branch push, and PR creation have been executed with user approval. Merge-conflict resolution remains outstanding for PR #760.

## `workflow_state` and phase status consistency

Root and outputs `artifacts.json` both use:

- `metadata.workflow_state = PR_OPEN_MERGE_DIRTY`
- `metadata.implementation_status = baseline_and_stability_evidence_captured_pr_open_merge_dirty`
- `taskType = implementation`
- `visualEvidence = VISUAL`

Phase 1-12 are `completed`; Phase 13 is `completed_with_merge_dirty`.

## Phase 11 evidence file inventory

| Path | Status |
| --- | --- |
| `outputs/phase-11/main.md` | present; runtime capture summary |
| `outputs/phase-11/evidence/baseline-list.md` | present; 51 PNG inventory + sha256 |
| `outputs/phase-11/evidence/user-approval-marker.md` | present |
| `outputs/phase-11/evidence/baseline-update-run.md` | present |
| `outputs/phase-11/evidence/visual-full-stability.md` | present; 2 workflow_dispatch runs passed |

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
| baseline update workflow dispatch | completed after user approval |
| baseline-update PR import | completed via direct cherry-pick after Actions PR-write permission failure |
| visual-full 2-run stability evidence | completed via workflow_dispatch runs `25961476237` and `25961551972` |
| commit / push | completed |
| PR | created: https://github.com/daishiman/UBM-Hyogo/pull/760 |
| PR merge state | `DIRTY`; conflict resolution required before merge |
| branch protection required check | formal follow-up |

## Archive/delete stale-reference gate

No workflow root is moved or deleted in this cycle. The upstream task-18-fu root remains under `completed-tasks/` and task-709 references it as upstream.

## Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | Runtime capture, evidence, phase status, and remaining PR gate are separated. |
| 漏れなし | PASS_WITH_MERGE_DIRTY | Phase 1-13, artifacts parity, strict 7, Phase 11 evidence, PR #760, formal follow-up, and aiworkflow sync are present; PR merge conflict resolution remains outstanding. |
| 整合性あり | PASS | State vocabulary, taskType, visualEvidence, issue, and upstream/downstream references are aligned. |
| 依存関係整合 | PASS | task-18-fu infra, task-709 runtime capture, and branch-protection governance mutation are separated. |
