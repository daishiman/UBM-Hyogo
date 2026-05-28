# workflow-admin-ui-prototype-alignment artifact inventory

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/admin-ui-prototype-alignment/` |
| root artifacts | `docs/30-workflows/admin-ui-prototype-alignment/artifacts.json` |
| output artifacts | `docs/30-workflows/admin-ui-prototype-alignment/outputs/artifacts.json` |
| Phase 11 manual placeholder | `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-11/manual-test-result.md` |
| Phase 12 compliance | `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 13 PR placeholder | `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-13/pr-creation-result.md` |
| Task C child workflow | `docs/30-workflows/completed-tasks/admin-ui-task-c-pageheader-token-conformance/` |
| Task C artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-admin-ui-task-c-pageheader-token-conformance-artifact-inventory.md` |
| primary admin blueprint | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` |
| prototype source | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` |
| prototype primitives | `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx` |
| implementation targets | `apps/web/app/(admin)/admin/**`, `apps/web/src/features/admin/components/_shared/**`, `apps/web/src/lib/admin/safe-server-fetch.ts` |

## Contract

`admin-ui-prototype-alignment` is registered as
`implemented_local_runtime_pending / implementation / VISUAL`.

The workflow aligns 11 admin routes with the admin prototype, introduces six
shared admin UI components plus a barrel and `safeServerFetch`, and keeps API,
D1 schema, and auth middleware contracts unchanged. Local implementation and
focused tests are in this cycle; authenticated runtime screenshots, staging
refresh, commit, push, and PR are user-gated.

Task C is split into its own child workflow and is locally implemented as
`implemented_local_evidence_captured / implementation / VISUAL`.
