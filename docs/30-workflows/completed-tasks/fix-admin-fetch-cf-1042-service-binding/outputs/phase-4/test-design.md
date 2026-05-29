# Phase 4: Test Design

## Added Test Files

- `apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts`
- `apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts`

## Cases

- TC-B1: `API_SERVICE` present calls binding fetch with `https://service-binding.local/admin/dashboard`.
- TC-B2: service binding carries `cookie`, `x-internal-auth`, `accept`, `content-type`, method, cache, and JSON body.
- TC-B3: service binding 404 body `error code: 1042` appears in thrown admin error.
- TC-B4: long error body is truncated to 256 chars.
- TC-H1: no `API_SERVICE` calls raw HTTP fetch with normalized `INTERNAL_API_BASE_URL`.
- TC-H2: test runtime with explicit `INTERNAL_API_BASE_URL` uses HTTP fallback even when binding exists.
- TC-H3: HTTP fallback carries the same headers and JSON body semantics.

## Local Command

```bash
mise exec -- pnpm --filter web test -- --run src/lib/admin/__tests__/server-fetch
```
