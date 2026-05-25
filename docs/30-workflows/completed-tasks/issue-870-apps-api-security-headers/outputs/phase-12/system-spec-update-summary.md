# System Spec Update Summary

## Updated Current Facts

| Area | Update |
| --- | --- |
| API security | `apps/api` emits `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, and conditional `Cache-Control: no-store` through middleware |
| CORS | `ALLOWED_ORIGINS` controls exact-origin allowlist; unset / empty means deny-by-default |
| Environment | `Env.ALLOWED_ORIGINS` and staging / production `wrangler.toml` vars were added |
| Evidence | focused Vitest 15 tests and API typecheck pass |

## aiworkflow-requirements Sync

Same-cycle updates are applied to:

- `.claude/skills/aiworkflow-requirements/references/security-api.md`
- `.claude/skills/aiworkflow-requirements/references/api-core.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-870-apps-api-security-headers-artifact-inventory.md`
