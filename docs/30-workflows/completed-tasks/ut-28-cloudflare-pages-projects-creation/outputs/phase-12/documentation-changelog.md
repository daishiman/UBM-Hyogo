# Documentation Changelog

| Area | File | Change |
| --- | --- | --- |
| UT-28 workflow | `phase-10.md`, `index.md`, `artifacts.json`, `outputs/artifacts.json` | Added `handoff-to-ut27.md` and aligned Phase 10 outputs. |
| UT-28 workflow | `phase-11.md`, `phase-12.md` | Clarified phase status as `pending` while workflow root remains `spec_created`. |
| UT-28 outputs | `outputs/phase-10/handoff-to-ut27.md` | Added explicit `CLOUDFLARE_PAGES_PROJECT=ubm-hyogo-web` handoff. |
| Phase 12 outputs | `implementation-guide.md` | Expanded Part 1/Part 2, edge cases, and references. |
| Phase 12 outputs | `system-spec-update-summary.md` | Replaced placeholder text with actual Step 1-A/B/C and Step 2 sync record. |
| Phase 12 outputs | `unassigned-task-detection.md` | Added current/baseline split and four design-task pattern check. |
| Phase 12 outputs | `skill-feedback-report.md` | Linked feedback to existing skill/backlog owner tasks. |
| Requirements canonical | `deployment-cloudflare.md`, `deployment-gha.md`, `deployment-secrets-management.md` | Added UT-28 Pages project creation contract and variable semantics. |
| Requirements canonical | `task-workflow-backlog.md`, `quick-reference.md`, `SKILL.md`, `LOGS/_legacy.md` | Added UT-28 lookup and close-out sync records. |

## Non-Changes

No app code was edited for UT-28. `apps/web`, `apps/api`, and `packages/shared` remain implementation inputs/consumers, not modified outputs, for this spec-created workflow.
