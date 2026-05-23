# Implementation Guide

## Part 1: Junior-Level Explanation

The app had two names for the same kind of failure. `AdminMutationError` and `FetchAuthedError` both meant "the admin screen sent a request and the server answered with an error." Keeping both made the code harder to read.

This change removes the extra name and uses `FetchAuthedError` everywhere. When the screen needs the server's error text, it reads `bodyText`, because `FetchAuthedError.message` is a developer-oriented fallback string.

## Part 2: Technical Notes

Changed implementation files:

- `apps/web/src/features/admin/hooks/useAdminMutation.ts`
- `apps/web/src/components/admin/MeetingPanel.tsx`
- `apps/web/src/components/admin/SchemaDiffPanel.tsx`
- `apps/web/src/components/admin/RequestQueuePanel.tsx`

Behavior contract:

- `UseAdminMutationReturn<T>.error` remains `Error | null`.
- `FetchAuthedError.status` remains the status discriminator.
- `FetchAuthedError.bodyText` carries the API error body or locally constructed admin mutation error message.
- No API endpoint, D1 schema, or auth redirect contract changed.

Important edge case:

- Replacing `AdminMutationError` with `FetchAuthedError` mechanically is not enough for user-facing text. The panels must use `bodyText` where old code used `message`.
