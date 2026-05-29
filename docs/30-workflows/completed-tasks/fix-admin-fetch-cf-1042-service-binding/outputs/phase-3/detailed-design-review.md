# Phase 3: Detailed Design Review

## Review Result

GO.

## Confirmed Invariants

- `apps/web` continues to call the API Worker and does not access D1 bindings directly.
- Existing Playwright fixture early-return blocks stay before transport selection.
- Existing `fetchAdmin<T>(path, opts)` export shape is unchanged.
- Error handling still throws `admin api ${path} failed: ${status}` and includes at most 256 chars of response body.

## Files

- Edit: `apps/web/src/lib/admin/server-fetch.ts`
- Edit: `apps/web/src/lib/env.ts`
- Add tests: `apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts`
- Add tests: `apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts`
