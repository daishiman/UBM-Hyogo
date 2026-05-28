# Task A: login stale link safe URL guard

## Scope

- Normalize login redirect inputs before URL generation.
- Prevent object values from becoming `/[object Object]` through string coercion.
- Add focused regression coverage for query parsing, redirect URL creation, and login state replacement.

## Implementation Files

- `apps/web/src/lib/url/safe-redirect.ts`
- `apps/web/src/lib/url/login-query.ts`
- `apps/web/src/lib/url/login-redirect.ts`
- `apps/web/src/lib/url/login-state.ts`
- `apps/web/app/login/page.tsx`
- `apps/web/src/lib/url/login-query.spec.ts`
- `apps/web/src/lib/url/login-redirect.spec.ts`
- `apps/web/src/lib/url/login-state.spec.ts`

## Acceptance

- Object-shaped redirect inputs fall back to `/profile`.
- Generated login URLs never contain `[object Object]`.
- Existing open redirect protections remain unchanged.
