# 06b-A Me API Auth.js Session Resolver Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| Task ID | 06b-A-me-api-authjs-session-resolver |
| Workflow | `docs/30-workflows/06b-A-me-api-authjs-session-resolver/` |
| Status | implemented-local / implementation / NON_VISUAL |
| Sync date | 2026-05-02 |
| Phase 13 | pending_user_approval |

## Current Facts

| Area | Artifact |
| --- | --- |
| API mount | `apps/api/src/index.ts` (`/me` uses `createMeSessionResolver()`) |
| Resolver | `apps/api/src/middleware/me-session-resolver.ts` |
| Focused tests | `apps/api/src/middleware/me-session-resolver.test.ts` |
| Workflow artifacts | `docs/30-workflows/06b-A-me-api-authjs-session-resolver/outputs/phase-11/`, `outputs/phase-12/` |

## Contract

- production / staging: verify Auth.js cookie or Bearer JWT with `AUTH_SECRET`.
- accepted cookie names: `authjs.session-token`, `__Secure-authjs.session-token`, plus next-auth v4 migration cookies inherited from shared `extractJwt()`.
- development: `x-ubm-dev-session: 1` + `Authorization: Bearer session:<email>:<memberId>` only when `ENVIRONMENT === "development"`.
- `ENVIRONMENT` missing is fail-closed for dev token.
- live staging / production smoke is not claimed by this inventory and remains delegated to 09a / 09c gates.

## Phase 12 Required Files

| File | Status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## Related Resources

- `indexes/quick-reference.md` (Member Self-Service API / 06b quick rows)
- `indexes/resource-map.md` (06b-A row)
- `references/api-endpoints.md` (UBM-Hyogo Member Self-Service API 04b)
- `references/task-workflow-active.md` (06b-A row)
- `references/lessons-learned-06b-a-me-api-authjs-session-resolver-2026-05.md`
- `LOGS/20260502-06b-a-me-api-authjs-session-resolver.md`
