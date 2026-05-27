# workflow-issue-922-production-admin-runtime-smoke-gate artifact inventory

| Category | Path | Notes |
| --- | --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-922-production-admin-runtime-smoke-gate/` | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| root index | `docs/30-workflows/completed-tasks/issue-922-production-admin-runtime-smoke-gate/index.md` | Issue #922 CLOSED 維持、parent #864 staging gate follow-up |
| root artifacts | `docs/30-workflows/completed-tasks/issue-922-production-admin-runtime-smoke-gate/artifacts.json` | root / outputs mirror parity required |
| output artifacts | `docs/30-workflows/completed-tasks/issue-922-production-admin-runtime-smoke-gate/outputs/artifacts.json` | root mirror |
| Phase 11 manual result | `docs/30-workflows/completed-tasks/issue-922-production-admin-runtime-smoke-gate/outputs/phase-11/manual-test-result.md` | Gate-B user-gated runtime procedure |
| Phase 11 shell evidence | `docs/30-workflows/completed-tasks/issue-922-production-admin-runtime-smoke-gate/outputs/phase-11/evidence/runtime-admin-web-test.log` | `runtime-admin-web.sh` staging + production contract PASS |
| Phase 11 vitest evidence | `docs/30-workflows/completed-tasks/issue-922-production-admin-runtime-smoke-gate/outputs/phase-11/evidence/mint-staging-session-cookie-vitest.log` | `resolveEnvPrefix` + cookie mint tests PASS |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-922-production-admin-runtime-smoke-gate/outputs/phase-12/phase12-task-spec-compliance-check.md` | strict 7 compliance + 30思考法 compact evidence |
| implementation | `scripts/smoke/runtime-admin-web.sh` | `staging|production` env-aware `/admin` runner |
| implementation | `scripts/smoke/mint-staging-session-cookie.mts` | CLI default staging + `production` arg, `resolveEnvPrefix` |
| implementation | `.github/workflows/web-cd.yml` | `admin-runtime-smoke-production` job after `deploy-production` |
| tests | `scripts/smoke/__tests__/runtime-admin-web.test.sh` | production env path added |
| tests | `scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts` | prefix resolver test added |
| task-spec skill sync | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | multi-environment runtime smoke close-out gate |
| task-spec skill sync | `.claude/skills/task-specification-creator/references/server-component-e2e-pattern.md` | multi-env mint helper extension |
| user-gated boundary | GitHub Environment / Cloudflare / branch protection | `production-runtime-smoke` secrets, real production `/admin` probe, intentional regression evidence, required check PUT |

## Runtime Boundary

Local implementation and focused evidence are complete. Production deploy execution, production GitHub Environment secret provisioning, intentional regression failure evidence, `main` branch protection mutation, commit, push, and PR are user-gated.
