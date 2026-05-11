# Workflow Artifact Inventory: task-14 my-profile-and-requests

Date: 2026-05-09

| Category | Artifact |
| --- | --- |
| workflow root | `docs/30-workflows/task-14-my-profile-and-requests/` |
| root ledger | `docs/30-workflows/task-14-my-profile-and-requests/artifacts.json` |
| mirror ledger | `docs/30-workflows/task-14-my-profile-and-requests/outputs/artifacts.json` |
| phase specs | `phase-01.md` through `phase-13.md` |
| Phase 12 strict seven | `outputs/phase-12/main.md`, `implementation-guide.md`, `system-spec-update-summary.md`, `documentation-changelog.md`, `unassigned-task-detection.md`, `skill-feedback-report.md`, `phase12-task-spec-compliance-check.md` |
| source task | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/06-screens-member/task-14-w5-par-my-profile-and-requests.md` |
| implementation targets | `apps/web/app/profile/page.tsx`, `apps/web/app/profile/_components/*`, profile smoke spec |
| read-only API targets | `apps/api/src/routes/me/*`, `apps/web/app/api/me/*` |
| downstream | task-18 regression smoke / verify-design-tokens |

## State

`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING`.

Apps/web implementation and Phase 11 deterministic evidence are reflected locally. Authenticated runtime screenshots, staging deploy, production smoke, commit, push, and PR remain user-gated.
