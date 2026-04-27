# PR Body Draft

## Summary

- Add UT-11 Google OAuth admin login flow specification.
- Define PKCE, state, session cookie, allowlist, logout, and admin middleware contracts.
- Add Phase 12 close-out artifacts and follow-up implementation tasks.

## Validation

- `artifacts.json` parses as JSON.
- Declared output files are present.
- PR creation, commit, push: not executed without user approval.

## Follow-Up

- Implement the `apps/web` OAuth routes and middleware.
- Resolve Auth.js broader-auth policy versus raw admin OAuth MVP as an ADR.
- Prepare Google verification only if public release requirements demand it.
