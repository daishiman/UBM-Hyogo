# UI sanity visual review

Status: `captured_local_playwright_fixture`.

| Check | Status | Evidence |
| --- | --- | --- |
| topbar DOM is absent from `(admin)/layout.tsx` render output | pass | `task-A-topbar-removed-1280.png` + locator count 0 |
| page-local `AdminPageHeader` owns breadcrumb/title/actions | pass | topbar slot absent; Task C owns remaining page-level breadcrumb replacement |
| 13 nav items total are visible at desktop/tablet widths | pass | `task-A-sidebar-desktop-1280.png`, `task-A-sidebar-tablet-768.png` |
| exactly one active nav item is highlighted per route | pass | `/admin` and `/admin/members` locator assertions |
| schema badge appears only when queued unresolved count is greater than 0 | pass | `task-A-sidebar-schema-badge.png` with fixture count 3 |
| mobile shell keeps coherent main spacing without a dead topbar gap | pass | `task-A-sidebar-mobile-375.png`; sidebar hidden, topbar absent |
