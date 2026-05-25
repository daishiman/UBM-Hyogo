# workflow-issue-869-csp-enforce-cutover artifact inventory

| Item | Path | Status |
| --- | --- | --- |
| Workflow root | `docs/30-workflows/completed-tasks/issue-869-csp-enforce-cutover/` | implemented_local_evidence_captured / implementation / NON_VISUAL |
| Root artifacts | `docs/30-workflows/completed-tasks/issue-869-csp-enforce-cutover/artifacts.json` | present |
| Outputs artifacts | `docs/30-workflows/completed-tasks/issue-869-csp-enforce-cutover/outputs/artifacts.json` | present |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-869-csp-enforce-cutover/outputs/phase-12/phase12-task-spec-compliance-check.md` | present |
| System spec | `.claude/skills/aiworkflow-requirements/references/security-web-response-headers.md` | synced |
| Env implementation | `apps/web/src/lib/env.ts` | `CSP_MODE` + `getSecurityHeaderEnv()` |
| Middleware implementation | `apps/web/middleware.ts` | env-driven CSP mode |
| Wrangler config | `apps/web/wrangler.toml` | local/default report-only, staging enforce, production report-only |
| Unit tests | `apps/web/src/lib/__tests__/env.spec.ts` | `getSecurityHeaderEnv` coverage |
| Smoke tests | `apps/web/playwright/tests/security-headers.spec.ts` | mode-aware CSP header assertions |

Runtime deploy/curl evidence, production enforce final cutover, commit, push, and PR are user-gated.
