# Task B: profile /me safe fetch

## Scope

- Wrap the leading `/me` request in `safeServerFetch`.
- Preserve `AuthRequiredError` redirect behavior.
- Degrade non-auth `/me` failures to member `SectionError` instead of throwing from the Server Component.

## Implementation Files

- `apps/web/app/(member)/profile/page.tsx`
- `apps/web/app/(member)/profile/page.spec.tsx`

## Acceptance

- `/me` 401 still redirects to `/login?redirect=/profile`.
- `/me` 5xx or network failures render a recoverable section error.
- `/me/profile` 404 still routes to `notFound()`.
