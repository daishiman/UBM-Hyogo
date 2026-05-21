# workflow-task-alert-relay-global-scope-fix-001 artifact inventory

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/task-alert-relay-global-scope-fix-001/` |
| root artifacts | `docs/30-workflows/task-alert-relay-global-scope-fix-001/artifacts.json` |
| Phase 5 implementation spec | `docs/30-workflows/task-alert-relay-global-scope-fix-001/outputs/phase-5/phase-5.md` |
| Phase 11 evidence | `docs/30-workflows/task-alert-relay-global-scope-fix-001/outputs/phase-11/evidence/` |
| Phase 12 compliance | `docs/30-workflows/task-alert-relay-global-scope-fix-001/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| source code | `apps/api/src/routes/internal/alert-relay.ts` |
| focused tests | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` |
| deploy wrapper | `scripts/cf.sh` |
| deploy wrapper test | `scripts/__tests__/cf-token-arg.test.sh` |
| deployment secrets spec | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` |
| lessons learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-alert-relay-global-scope-fix-001-2026-05.md` |

## Contract

`alert-relay.ts` must not call `crypto.randomUUID()` at module import time.
`emitKvOperationError()` lazily obtains a UUID isolate id on first log emission,
preserving the existing structured log schema while avoiding Cloudflare Workers
validation error 10021.

Local deploy validation uses `CLOUDFLARE_API_TOKEN_STAGING` or
`CLOUDFLARE_API_TOKEN_PRODUCTION` from `Employee/ubm-hyogo-env`, mapped to
wrangler's `CLOUDFLARE_API_TOKEN` environment variable only for the child
process.
