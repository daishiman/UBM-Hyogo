# workflow-admin-dashboard-recovery-and-byZone artifact inventory

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-dashboard-recovery-and-byZone/` |
| root artifacts | `docs/30-workflows/completed-tasks/admin-dashboard-recovery-and-byZone/artifacts.json` |
| output artifacts | `docs/30-workflows/completed-tasks/admin-dashboard-recovery-and-byZone/outputs/artifacts.json` |
| Phase 11 local visual evidence | `docs/30-workflows/completed-tasks/admin-dashboard-recovery-and-byZone/outputs/phase-11/manual-test-result.md`, `docs/30-workflows/completed-tasks/admin-dashboard-recovery-and-byZone/outputs/phase-11/admin-dashboard-200-overview.png`, `docs/30-workflows/completed-tasks/admin-dashboard-recovery-and-byZone/outputs/phase-11/admin-dashboard-byZone-detail.png` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/admin-dashboard-recovery-and-byZone/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 13 placeholder | `docs/30-workflows/completed-tasks/admin-dashboard-recovery-and-byZone/outputs/phase-13/pr-creation-result.md` |
| parent workflow | `docs/30-workflows/admin-ui-prototype-alignment/` |
| source task | `docs/30-workflows/admin-ui-prototype-alignment/tasks/task-B-dashboard-recovery-and-byZone.md` |
| prototype source | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` |

## Contract

`admin-dashboard-recovery-and-byZone` is registered as
`implemented_local_runtime_pending / implementation / VISUAL`.

The workflow is the standalone execution spec for Task B of
`admin-ui-prototype-alignment`: recover `/admin` dashboard fetch behavior,
extend the existing `GET /admin/dashboard` response with optional `byZone`, and
align `ZoneDistribution` with the admin prototype. It does not add a new API
endpoint, D1 schema, or Google Form contract.

Local implementation, local package tests, and local authenticated Playwright
screenshots are present. Staging deploy, wrangler tail, staging curl evidence,
commit, push, and PR are user-gated. Missing local color aliases required by
`ZoneDistribution` are same-cycle implementation scope, not a backlog-only
escape hatch.
