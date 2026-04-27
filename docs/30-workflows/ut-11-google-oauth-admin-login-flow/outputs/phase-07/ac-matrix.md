# Phase 7 AC Matrix

| AC | Trace | Test |
| --- | --- | --- |
| AC-1 | `GET /api/auth/login` redirects to Google | T-01 |
| AC-2 | PKCE S256 and temporary verifier cookie | T-04 |
| AC-3 | state mismatch returns 400 | T-05 |
| AC-4 | allowlist miss redirects to `/login?error=not_in_allowlist` with a visible refusal message | T-09 |
| AC-5 | allowlisted admin receives session and admin redirect | T-02, T-10 |
| AC-6 | session cookie attributes fixed | T-11 |
| AC-7 | `/admin/*` unauthenticated redirects to `/login` | T-12 |
| AC-8 | logout expires session | T-14 |
| AC-9 | local Workers-compatible runbook exists | Phase 5 runbook |
| AC-10 | `.dev.vars` ignored and secrets not committed | T-15 |
| AC-11 | local/staging/prod redirect URIs registered | Phase 5 runbook |
| AC-12 | new secrets placed in Cloudflare | Phase 2 secrets, Phase 5 runbook |
| AC-13 | new admin operation documented | Phase 5 runbook |

## Untraced AC Check

No AC is intentionally untraced at the specification level. Runtime unit tests currently cover pure helper behavior; route handler and middleware integration coverage is tracked as `UT-11-ROUTE-TEST-01`.
