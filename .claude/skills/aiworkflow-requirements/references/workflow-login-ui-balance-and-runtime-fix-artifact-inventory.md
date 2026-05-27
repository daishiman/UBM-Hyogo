# workflow-login-ui-balance-and-runtime-fix artifact inventory

## Metadata

| Key | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/login-ui-balance-and-runtime-fix/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| date | 2026-05-26 |

## Workflow Artifacts

| Path | Purpose |
| --- | --- |
| `docs/30-workflows/completed-tasks/login-ui-balance-and-runtime-fix/index.md` | workflow summary / status |
| `docs/30-workflows/completed-tasks/login-ui-balance-and-runtime-fix/artifacts.json` | root metadata |
| `docs/30-workflows/completed-tasks/login-ui-balance-and-runtime-fix/outputs/artifacts.json` | output parity |
| `docs/30-workflows/completed-tasks/login-ui-balance-and-runtime-fix/outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9-heading compliance check |

## Code Artifacts

| Path | Purpose |
| --- | --- |
| `apps/web/src/styles/auth.css` | login input/button balance and brand-icon protection |
| `apps/web/src/styles/legacy-public.css` | exclude Google brand icon / auth inputs / buttons from legacy `[data-size]` circle rules |
| `apps/web/app/api/auth/magic-link/route.ts` | magic-link proxy internal API base via env accessor |
| `apps/web/app/api/auth/magic-link/verify/route.ts` | verify proxy internal API base via env accessor |
| `apps/web/app/api/auth/gate-state/route.ts` | gate-state proxy internal API base via env accessor |
| `apps/web/app/api/admin/[...path]/route.ts` | admin proxy internal API base / secret via env accessor |
| `apps/web/app/api/me/[...path]/route.ts` | me proxy internal API base via env accessor |
| `apps/web/src/lib/auth/verify-magic-link.ts` | server helper internal API base via env accessor |
| `apps/web/src/lib/fetch/authed.ts` | authed fetch internal/public base via env accessors |
| `scripts/verify-no-process-env-internal-api.sh` | regression grep gate |
| `scripts/serve-prototype.sh` | prototype HTTP server with `.jsx` JavaScript MIME |

## Evidence Boundary

Local focused tests, grep gate, and Phase 11 screenshots are captured before PR. Staging visual baseline, staging smoke, commit, push, and PR are user-gated.
