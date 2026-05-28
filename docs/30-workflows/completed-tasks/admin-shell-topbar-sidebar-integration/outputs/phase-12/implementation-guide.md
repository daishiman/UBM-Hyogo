# Implementation guide

## Part 1: Plain-language explanation

The admin shell should stop trying to put page titles, breadcrumbs, and page actions in the global topbar. Each admin page already has a page header, so the page header should own that page-specific information.

The shell should focus on the stable frame: admin access, sidebar navigation, and the main content area. The sidebar should show the public/member/admin route groups, highlight only the current route, show schema-diff count only when needed, and keep the user/sign-out area in the footer.

## Part 2: Technical plan

1. Keep `(admin)/layout.tsx` as a Server Component so auth gating stays server-side.
2. Remove the `AdminTopbar` render path and do not replace it with an empty header.
3. Fetch existing `GET /admin/schema/diff` data through the current server-fetch boundary and derive `schemaDiffCount` from `items[].status === "queued"` without adding an endpoint.
4. Pass `schemaDiffCount`, display name, and email into `AdminSidebar`.
5. Implement `isActive(itemHref, pathname)` as a pure function; `/admin` must be exact-match only.
6. Add focused specs for active-state, group labels, schema badge on/off, footer user-chip, and topbar removal.

## Verification commands

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter web test -- --run components/layout
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-shell-topbar-sidebar-integration/outputs/phase-11 PLAYWRIGHT_EVIDENCE_TASK=task-17-admin-schema-conflicts-audit pnpm -F @ubm-hyogo/web exec playwright test --project=desktop-chromium playwright/tests/admin-shell-topbar-sidebar-integration.spec.ts
mise exec -- pnpm verify-design-tokens
mise exec -- pnpm build
```

## Screenshot evidence

- `../phase-11/task-A-sidebar-desktop-1280.png`
- `../phase-11/task-A-sidebar-desktop-1280-members-active.png`
- `../phase-11/task-A-sidebar-tablet-768.png`
- `../phase-11/task-A-sidebar-mobile-375.png`
- `../phase-11/task-A-sidebar-schema-badge.png`
- `../phase-11/task-A-topbar-removed-1280.png`

## Known limits

Local authenticated Playwright fixture screenshots are captured. Commit, push, and PR are not part of this cycle.
