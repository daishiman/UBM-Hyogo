# Phase 11 Runtime Evidence Boundary

## Summary

State: `runtime_pending`

This workflow is contract-ready, but it has not captured the final visual evidence yet. The required runtime evidence is user-gated because baseline regeneration runs through `.github/workflows/playwright-visual-baseline-update.yml` with the `visual-baseline-approval` environment and creates repository changes.

## Required Evidence Before Completion

| Evidence | Required path | Status |
| --- | --- | --- |
| User approval marker | `outputs/phase-11/evidence/user-approval-marker.md` | runtime_pending |
| Baseline update workflow run | `outputs/phase-11/evidence/baseline-update-run.md` | runtime_pending |
| Baseline import log | `outputs/phase-11/evidence/baseline-import-log.md` | runtime_pending |
| Baseline filename + sha256 inventory | `outputs/phase-11/evidence/baseline-list.md` | runtime_pending |
| Visual-full 2-run stability summary | `outputs/phase-11/evidence/visual-full-stability.md` | runtime_pending |
| Matrix update evidence | `outputs/phase-7/coverage-report.md` | runtime_pending |
| QA command log | `outputs/phase-9/qa.md` | runtime_pending |

## Current Contract Checks

| Check | Result |
| --- | --- |
| `VISUAL_ROUTES` current count | 17 |
| visual-full project count | 3 |
| expected baseline count | 51 |
| local snapshot directory exists | pending runtime capture |
| PR trigger activation | pending implementation step |

## User-Gated Boundary

The following commands must not be run by the agent without explicit user approval:

- `gh workflow run playwright-visual-baseline-update.yml`
- `git merge --no-ff baseline-update-tmp`
- `git commit`
- `git push`
- `gh pr create`

Until those steps are approved and evidence files are populated, this workflow must remain `CONTRACT_READY_IMPLEMENTATION_PENDING` / `runtime_pending`, not `completed`.
