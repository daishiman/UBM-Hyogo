# Workflow Artifact Inventory: fix-admin-fetch-cf-1042-service-binding

| Item | Path / status |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/fix-admin-fetch-cf-1042-service-binding/` |
| root artifacts | `docs/30-workflows/completed-tasks/fix-admin-fetch-cf-1042-service-binding/artifacts.json` |
| output artifacts | `docs/30-workflows/completed-tasks/fix-admin-fetch-cf-1042-service-binding/outputs/artifacts.json` |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/fix-admin-fetch-cf-1042-service-binding/outputs/phase-11/main.md` |
| Phase 12 strict outputs | `docs/30-workflows/completed-tasks/fix-admin-fetch-cf-1042-service-binding/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| implementation | `apps/web/src/lib/env.ts`, `apps/web/src/lib/admin/server-fetch.ts` |
| tests | `apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts`, `apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts`, `apps/web/src/lib/admin/__tests__/server-fetch-url.spec.ts` |
| system spec | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` |
| indexes | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`, `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`, `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |

## Status

`implemented_local_runtime_pending / implementation / NON_VISUAL`

Local tests passed. Staging deploy, authenticated `/admin` smoke, wrangler tail, commit, push, and PR remain user-gated.

## Acceptance Criteria Mapping

| AC | Evidence |
| --- | --- |
| AC-1 Service Binding first | `server-fetch.binding.spec.ts` |
| AC-2 test/Playwright HTTP fallback | `server-fetch.http-fallback.spec.ts`, `server-fetch-url.spec.ts` |
| AC-3 headers/body propagation | binding and fallback specs |
| AC-4 unit green | Phase 11 evidence |
| AC-5 staging runtime 200 | pending user gate |
| AC-6 other admin routes | shared `fetchAdmin` helper contract |
