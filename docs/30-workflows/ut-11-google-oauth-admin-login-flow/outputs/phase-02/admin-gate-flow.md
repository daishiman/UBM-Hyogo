# Phase 2 Admin Gate Flow

## Gate Rule

`/admin/*` is accessible only when `apps/web/middleware.ts` verifies a signed `admin_session` cookie whose `role` is `admin` and `exp` is in the future.

## Flow

1. Browser requests `/admin` or `/admin/*`.
2. Middleware reads `admin_session`.
3. Missing, invalid, expired, or non-admin session redirects to `/login?next=<safe-admin-path>`.
4. Valid session continues to the requested admin page.

## Safe Redirect Contract

The `next` value is never trusted as provided by the browser.

| Input | Result |
| --- | --- |
| `/admin` | Accepted |
| `/admin/members` | Accepted |
| `/login` | Replaced with `/admin` |
| `https://example.com/admin` | Rejected |
| `//example.com/admin` | Rejected |
| `/admin/%0d%0aSet-Cookie:x=y` | Rejected |

The normalized value is stored with the OAuth `state` temporary cookie and consumed only after callback validation.
