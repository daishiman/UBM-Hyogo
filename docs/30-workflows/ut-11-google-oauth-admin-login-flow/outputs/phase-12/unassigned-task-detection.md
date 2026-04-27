# Phase 12 Unassigned Task Detection

## Summary

The earlier `UT-11-IMP-01` implementation follow-up is resolved by this branch's `apps/web` OAuth implementation. Three remaining tasks are real external or cross-boundary work that should not be hidden inside this close-out.

| ID | Follow-up | Priority | Placement | Status |
| --- | --- | --- | --- | --- |
| UT-11-SEC-01 | Decide whether Auth.js remains canonical for broader auth or whether admin MVP keeps raw OAuth as an ADR exception | Medium | `docs/30-workflows/unassigned-task/UT-11-SEC-01-authjs-raw-oauth-adr.md` | created |
| UT-11-GOOGLE-VERIFY-01 | Prepare Google verification and consent-screen path before external public release if required by user type/scope | Low | `docs/30-workflows/unassigned-task/UT-11-GOOGLE-VERIFY-01-google-oauth-consent-verification.md` | created |
| UT-11-API-AUTH-01 | Define and implement how backend/API routes consume `admin_session` for privileged server operations | Medium | `docs/30-workflows/unassigned-task/UT-11-API-AUTH-01-api-admin-session-consumption.md` | created |
| UT-11-ROUTE-TEST-01 | Add auth route and middleware integration tests | Medium | `docs/30-workflows/unassigned-task/UT-11-ROUTE-TEST-01-auth-route-middleware-integration-tests.md` | created |

## Checked Patterns

| Pattern | Result |
| --- | --- |
| type definition to implementation | implemented in `apps/web/src/lib/auth/types.ts` and session helpers |
| contract to test | unit tests pass; route/middleware integration tests are tracked by `UT-11-ROUTE-TEST-01` |
| UI spec to component | `/login`, `/admin`, and gate redirect are implemented |
| spec contradiction | Auth.js vs raw OAuth is tracked as ADR follow-up |
| live external smoke | deferred because Google Console/real secret access is required |
