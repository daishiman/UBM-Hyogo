# Artifact Inventory: 06a-A Public Web Real Workers D1 Smoke Execution

## Workflow

| Field | Value |
| --- | --- |
| canonical root | `docs/30-workflows/06a-A-public-web-real-workers-d1-smoke-execution/` |
| state | `spec_created / implementation-spec / docs-only / VISUAL_ON_EXECUTION` |
| phase status | Phase 1-12 completed as documentation/specification deliverables; Phase 13 pending_user_approval |
| issue notation | `Refs #273`; do not use `Closes #273` |

## Root Files

| File | Purpose |
| --- | --- |
| `index.md` | Workflow overview, AC, dependencies, outputs |
| `artifacts.json` | Root artifact ledger and phase dependency graph |
| `outputs/artifacts.json` | Synchronized copy of root artifact ledger |
| `phase-01.md` - `phase-13.md` | Executable phase specifications |

## Outputs

| Path | Purpose |
| --- | --- |
| `outputs/phase-01/main.md` - `outputs/phase-11/main.md` | Phase outputs / planned evidence summaries |
| `outputs/phase-11/{manual-smoke-log.md,link-checklist.md,manual-test-checklist.md,manual-test-result.md,discovered-issues.md,screenshot-plan.json}` | Phase 11 execution slots; NOT runtime PASS until user-approved execution |
| `outputs/phase-12/main.md` | Phase 12 index |
| `outputs/phase-12/implementation-guide.md` | Implementation guide |
| `outputs/phase-12/system-spec-update-summary.md` | Same-wave sync and pending runtime docs boundary |
| `outputs/phase-12/documentation-changelog.md` | Documentation changelog |
| `outputs/phase-12/unassigned-task-detection.md` | Unassigned detection |
| `outputs/phase-12/skill-feedback-report.md` | Skill feedback routing |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 compliance evidence |
| `outputs/phase-13/main.md` | Phase 13 PR gate summary |

## Runtime Evidence Boundary

Phase 11 curl logs and screenshots are planned evidence only in this spec-created wave. Actual local / staging smoke results must be committed by a later execution wave after user approval. The older `06a-followup-001-public-web-real-workers-d1-smoke` root remains historical/design canonical; this root is the current execution canonical for actual evidence placement.
