# Phase 4 Test Matrix

| ID | Area | Case | Expected |
| --- | --- | --- | --- |
| T-01 | Login | `/api/auth/login` without `next` | Redirects to Google and stores temp cookies |
| T-02 | Login | `next=/admin/members` | Bound to state and restored after callback |
| T-03 | Login | external `next` | Normalized to `/admin` or rejected |
| T-04 | PKCE | `code_challenge_method` | `S256` |
| T-05 | State | mismatched callback state | `400`, no session issued |
| T-06 | State | callback without temp cookies | `400`, no session issued |
| T-07 | Token | Google token endpoint failure | `502`, temp cookies cleared |
| T-08 | Identity | `email_verified=false` | `303` to `/login?error=email_not_verified` |
| T-09 | Allowlist | email outside allowlist | `303` to `/login?error=not_in_allowlist` |
| T-10 | Allowlist | email case differs | lowercased compare succeeds |
| T-11 | Cookie | session attributes | `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` |
| T-12 | Middleware | unauthenticated `/admin/*` | Redirects to `/login` with safe `next` |
| T-13 | Middleware | expired JWT | Redirects to `/login` |
| T-14 | Logout | `POST /api/auth/logout` | Expires session cookie |
| T-15 | Hygiene | repo scan | `.dev.vars` untracked and no secrets committed |

## Targeted Commands

The current implementation has unit coverage for pure auth helpers. Route handler and middleware integration tests remain a follow-up (`UT-11-ROUTE-TEST-01`), because they require mocking Google token/userinfo responses and Next middleware request cookies.

The implementation task should prefer targeted tests before full-suite execution:

```bash
pnpm --filter @ubm-hyogo/web test
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web build
```
