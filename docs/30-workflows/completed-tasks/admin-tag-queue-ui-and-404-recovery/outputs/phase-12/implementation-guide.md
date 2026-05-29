# Implementation Guide — admin-tag-queue-ui-and-404-recovery

## Part 1: Concept

`/admin/tags` is the workbench for deciding which labels should be attached to
members. Think of it like a school teacher checking a stack of submitted forms:
the left side is the stack of papers, and the right side is the paper currently
being reviewed.

Before this change, the stack could disappear behind a plain error message, and
the screen did not match the prototype. Now the page keeps the workbench shape,
and when the API fails it tells the operator whether the likely issue is login,
permission, missing API route, or server configuration.

## Part 2: Technical Details

### UI Composition

- `apps/web/app/(admin)/admin/tags/page.tsx` keeps `force-dynamic`, reads `status` and `memberId`, and calls `safeServerFetch<QueueListView>('/admin/tags/queue...')`.
- The page renders `Breadcrumb`, `page-head`, count chips, and `TagQueuePanel`.
- `TagQueuePanel` keeps the existing props contract: `initial`, `filter`, `focusMemberId`.
- The panel uses existing primitives only: `Avatar`, `Button`, `Card`, `Chip`, `EmptyState`, and `Icon`.
- Stable test selectors remain: `admin-tag-queue-list` and `admin-tag-review-panel`.

### Error Handling

- `AdminSectionError` maps `ADMIN_FETCH_401`, `ADMIN_FETCH_403`, `ADMIN_FETCH_404`, and `ADMIN_FETCH_5xx` to operator recovery hints.
- `fetchAdmin()` logs only `{ host, path, status }` for non-production 404s.
- Cookie, internal auth secret, and request body are never logged.

### Verification

```bash
mise exec -- pnpm --filter web test -- TagQueuePanel AdminSectionErrorClient server-fetch
mise exec -- pnpm --filter web exec playwright test \
  --project=staging-visual-authenticated \
  apps/web/playwright/tests/visual-staging-authenticated/admin-tags-authenticated.spec.ts
```

Latest local result: 161 test files passed, 1 skipped; 1170 tests passed, 1 skipped.

### Known Boundary

Staging visual screenshots remain Gate-B until deploy/authenticated browser
execution runs, but the spec now writes `admin-tags-items.png` and
`admin-tags-empty.png` directly into `outputs/phase-11/` when executed.
