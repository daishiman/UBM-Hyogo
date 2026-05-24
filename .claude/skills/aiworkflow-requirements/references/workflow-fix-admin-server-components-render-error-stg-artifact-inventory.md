# workflow-fix-admin-server-components-render-error-stg artifact inventory

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/fix-admin-server-components-render-error-stg/` |
| root artifacts | `docs/30-workflows/fix-admin-server-components-render-error-stg/artifacts.json` |
| output artifacts | `docs/30-workflows/fix-admin-server-components-render-error-stg/outputs/artifacts.json` |
| Phase 11 inventory | `docs/30-workflows/fix-admin-server-components-render-error-stg/outputs/phase-11/manual-test-result.md` |
| Phase 12 compliance | `docs/30-workflows/fix-admin-server-components-render-error-stg/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| implementation | `apps/web/src/lib/admin/server-fetch.ts`, `apps/web/src/lib/env.ts` |
| tests | `apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts`, `apps/web/src/lib/__tests__/env.spec.ts` |
| system spec sync | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md`, `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` |

## Runtime Boundary

Local focused Vitest evidence is captured. Cloudflare staging deploy,
authenticated `/admin` curl, backend-ci rerun, commit, push, and PR are
user-gated.
