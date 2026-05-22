# Workflow Artifact Inventory: task-18-fu-full-visual-regression-suite

## Metadata

| Field | Value |
| --- | --- |
| canonical root | `docs/30-workflows/task-18-fu-full-visual-regression-suite/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| issue | `#696` |
| upstream | `docs/30-workflows/completed-tasks/task-18-w7-verify-tokens-and-playwright-smoke/` |
| source unassigned | `docs/30-workflows/unassigned-task/task-18-full-visual-regression-suite-001.md` |

## Workflow artifacts

| Path | Role |
| --- | --- |
| `index.md` | Root task specification |
| `artifacts.json` | Root metadata / phase status ledger |
| `outputs/artifacts.json` | Phase evidence mirror; must match root |
| `phase-1-requirements.md` ... `phase-13-pr.md` | Phase 1-13 specification set |
| `outputs/phase-11/main.md` | Local implementation walkthrough + runtime boundary |
| `outputs/phase-11/manual-smoke-log.md` | No-screenshot runtime evidence boundary |
| `outputs/phase-11/link-checklist.md` | Internal and upstream link checklist |
| `outputs/phase-12/main.md` | Phase 12 root |
| `outputs/phase-12/implementation-guide.md` | Part 1 / Part 2 implementation guide |
| `outputs/phase-12/system-spec-update-summary.md` | Same-wave sync summary |
| `outputs/phase-12/documentation-changelog.md` | Documentation change record |
| `outputs/phase-12/unassigned-task-detection.md` | Source unassigned trace |
| `outputs/phase-12/skill-feedback-report.md` | Existing-skill no-op routing |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Canonical 9-heading compliance check |

## Local implementation artifacts

| Path | Status |
| --- | --- |
| `apps/web/playwright.config.ts` | implemented locally |
| `apps/web/playwright/fixtures/viewports.ts` | implemented locally |
| `apps/web/playwright/fixtures/visual-routes.ts` | implemented locally |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts` | implemented locally |
| `.github/workflows/playwright-visual-full.yml` | implemented locally |
| `.github/workflows/playwright-visual-baseline-update.yml` | implemented locally |
| `apps/web/package.json` | implemented local scripts |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png` | runtime pending, 51 files required |

## Runtime boundary

Local implementation and workflow files are present in this wave. The 51 baselines, CI evidence, baseline update, commit, push, and PR remain user-gated runtime work.
