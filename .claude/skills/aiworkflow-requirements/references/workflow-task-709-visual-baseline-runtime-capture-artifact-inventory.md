# Workflow Artifact Inventory: task-709-visual-baseline-runtime-capture

## Metadata

| Field | Value |
| --- | --- |
| canonical root | `docs/30-workflows/task-709-visual-baseline-runtime-capture/` |
| status | `CONTRACT_READY_IMPLEMENTATION_PENDING / implementation / VISUAL` |
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
| `outputs/phase-11/main.md` | Runtime boundary |
| `outputs/phase-11/evidence/baseline-list.md` | Runtime-pending baseline inventory placeholder |
| `outputs/phase-12/*.md` | Phase 12 strict 7 outputs |

## Runtime Pending Artifacts

| Path | Status |
| --- | --- |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png` | runtime pending, 51 files required |
| `outputs/phase-11/evidence/user-approval-marker.md` | pending user approval |
| `outputs/phase-11/evidence/visual-full-stability.md` | pending runtime CI |
| `.github/workflows/playwright-visual-full.yml` | planned PR trigger activation |
| `SMOKE-COVERAGE-MATRIX.md` | planned 17/19 sync after baseline evidence |

## Boundary

Task-709 is the runtime capture continuation of task-18-fu. It must not be marked complete until baseline PNGs, CI stability evidence, and QA logs are captured. Branch protection promotion is a separate governance follow-up.
