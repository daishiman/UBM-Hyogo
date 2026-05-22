# Workflow Artifact Inventory: task-709-visual-baseline-runtime-capture

## Metadata

| Field | Value |
| --- | --- |
| canonical root | `docs/30-workflows/task-709-visual-baseline-runtime-capture/` |
| status | `PR_OPEN_MERGE_DIRTY / implementation / VISUAL` |
| issue | `#709` |
| upstream | `docs/30-workflows/completed-tasks/task-18-fu-full-visual-regression-suite/` |
| follow-up | `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` |

## Workflow Artifacts

| Path | Role |
| --- | --- |
| `index.md` | Root task specification |
| `artifacts.json` | Root metadata / phase status ledger |
| `outputs/artifacts.json` | Phase evidence mirror; must match root |
| `phase-1-requirements.md` ... `phase-13-pr.md` | Phase 1-13 specification set |
| `outputs/phase-11/main.md` | Runtime capture summary |
| `outputs/phase-11/evidence/baseline-list.md` | 51 baseline inventory + sha256 |
| `outputs/phase-12/*.md` | Phase 12 strict 7 outputs |

## Runtime Captured Artifacts

| Path | Status |
| --- | --- |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png` | captured, 51 files |
| `outputs/phase-11/evidence/user-approval-marker.md` | present |
| `outputs/phase-11/evidence/visual-full-stability.md` | PASS, runs `25961476237` / `25961551972` |
| `.github/workflows/playwright-visual-full.yml` | PR trigger activated; baseline missing now fails instead of skip-success |
| `SMOKE-COVERAGE-MATRIX.md` | synced to 17/19 |
| PR #760 | open, `mergeStateStatus=DIRTY` |

## Boundary

Task-709 is the runtime capture continuation of task-18-fu. Baseline PNGs, CI stability evidence, QA logs, and PR #760 are captured. Merge conflict resolution for PR #760 and branch protection promotion remain separate follow-up work.
