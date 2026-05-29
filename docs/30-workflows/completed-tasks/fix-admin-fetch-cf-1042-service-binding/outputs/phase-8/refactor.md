# Phase 8: Refactor

## Refactor Applied

Small private helpers were introduced in `server-fetch.ts`:

- `isTestOrPlaywright()`
- `getAdminServiceBinding()`
- `buildAdminRequestHeaders()`
- `logAdminTransport()`

## Reasoning

The helpers isolate transport selection and request construction without changing the exported API or admin route callers. Public/admin fetch helpers were not merged because their env accessors and auth/header behavior differ.
