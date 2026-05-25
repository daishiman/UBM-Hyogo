# issue-870-apps-api-security-headers Artifact Inventory

| Artifact | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-870-apps-api-security-headers/` |
| index | `docs/30-workflows/completed-tasks/issue-870-apps-api-security-headers/index.md` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-870-apps-api-security-headers/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/completed-tasks/issue-870-apps-api-security-headers/outputs/artifacts.json` |
| Phase 11 local evidence | `docs/30-workflows/completed-tasks/issue-870-apps-api-security-headers/outputs/phase-11/manual-test-result.md` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-870-apps-api-security-headers/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| middleware implementation | `apps/api/src/middleware/security-headers.ts` |
| focused tests | `apps/api/src/middleware/__tests__/security-headers.spec.ts` |
| app wiring | `apps/api/src/index.ts` |
| env contract | `apps/api/src/env.ts` |
| Cloudflare vars | `apps/api/wrangler.toml` |
| system spec | `.claude/skills/aiworkflow-requirements/references/security-api.md` |
| lessons learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lesson-20260524-issue-870-apps-api-security-headers.md` |

## Boundary

Staging / production curl verification, deploy, commit, push, PR, and Issue mutation are user-gated.
