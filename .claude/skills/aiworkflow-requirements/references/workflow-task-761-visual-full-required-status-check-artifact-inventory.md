# Workflow Artifact Inventory: task-761-visual-full-required-status-check

## Metadata

| Field | Value |
| --- | --- |
| canonical root | `docs/30-workflows/task-761-visual-full-required-status-check/` |
| status | `implemented / implementation / NON_VISUAL / governance / external_mutation_completed / Phase 13 PR pending_user_approval` |
| issue | `#761` |
| parent | `docs/30-workflows/task-709-visual-baseline-runtime-capture/` |
| source unassigned | `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` consumed |

## Workflow Artifacts

| Path | Role |
| --- | --- |
| `index.md` | Root task specification |
| `artifacts.json` | Root metadata / governance mutation ledger |
| `outputs/artifacts.json` | Output mirror / phase inventory |
| `outputs/phase-1/` ... `outputs/phase-13/` | Phase 1-13 specifications |
| `outputs/phase-11/evidence/` | Branch protection before/after, trigger, approval, rollback, and NON_VISUAL evidence templates |
| `outputs/phase-12/` | Phase 12 strict 7 outputs |

## Implementation Targets

| Path | Status |
| --- | --- |
| `.github/workflows/playwright-visual-full.yml` | `pull_request.paths` removed so required check contexts are emitted for every PR |

## Runtime Boundary

Branch protection contexts POST for dev/main and fresh after GET evidence were completed under user approval at 2026-05-17T12:49:39Z. Commit, push, and PR creation remain user-gated.
