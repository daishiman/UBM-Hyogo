# Phase 12 System Spec Update Summary

## Result

This workflow now includes runtime implementation in `apps/web`. The previous `spec_created` / docs-only close-out was stale and has been corrected to implementation close-out.

## aiworkflow-requirements Updates

| Canonical area | Update |
| --- | --- |
| Security | Added the UT-11 admin Google OAuth + PKCE flow, signed JWT session Cookie, allowlist authorization, and local `Secure` Cookie exception. |
| Architecture | Added `apps/web` ownership for `/api/auth/*`, `/login`, `/admin`, and middleware admin gate. `apps/api` remains a consumer for later API authorization tasks. |
| Secrets | Added `SESSION_SECRET`, `ADMIN_EMAIL_ALLOWLIST`, and `AUTH_REDIRECT_URI`; confirmed `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` reuse. |
| Task workflow | Recorded UT-11 as implemented, with external Google Console verification and production secret application remaining as manual follow-up tasks. |

## Step 2 Decision

Step 2 is required and completed in this wave because the branch adds public route contracts, new runtime configuration, and admin session semantics.

## Open Operational Boundaries

- Google OAuth consent screen and redirect URI registration require real environment access.
- `apps/web/wrangler.toml` still contains placeholder production/staging redirect URIs; deployment must override them before live smoke.
- API-side consumption of `admin_session` is not implemented in this task and is tracked separately.
