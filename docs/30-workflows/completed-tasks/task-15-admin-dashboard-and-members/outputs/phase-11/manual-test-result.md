# Phase 11 Manual Test Result

## Metadata

- task: task-15-admin-dashboard-and-members
- date: 2026-05-10
- environment: local Playwright fixture, desktop-chromium, 1280x800
- command: `pnpm -F @ubm-hyogo/web exec playwright test --project=desktop-chromium playwright/tests/task15-admin-screenshots.spec.ts`
- result: PASS, 1 test

## Screenshots

| TC | Screenshot | Route | Result |
| --- | --- | --- | --- |
| TC-VIS-01 | `admin-dashboard-default.png` | `/admin` | PASS |
| TC-VIS-02 | `admin-dashboard-schema-alert.png` | `/admin` | PASS (`unresolvedSchema = 5` fixture) |
| TC-VIS-03 | `admin-dashboard-zone-placeholder.png` | `/admin` | PASS |
| TC-VIS-04 | `admin-members-default.png` | `/admin/members` | PASS |
| TC-VIS-05 | `admin-members-filter-published.png` | `/admin/members?filter=published` | PASS |
| TC-VIS-06 | `admin-members-bulk-selected.png` | `/admin/members` | PASS |
| TC-VIS-07 | `admin-members-drawer-open.png` | `/admin/members` | PASS |
| TC-VIS-08 | `admin-members-empty.png` | `/admin/members?q=zzzzz` | PASS |
| TC-VIS-09 | `admin-layout-sidebar-active.png` | `/admin` | PASS |

## Three-Layer Review

- Semantic: PASS. Headings, table captions, `role=status`, `role=region`, dialog role, and native controls are present.
- Visual: PASS for local fixture. OKLch token gate remains covered by Phase 9.
- AI UX: PASS for fixture flows: dashboard read, members filter, bulk action bar, drawer open, empty state.

Runtime note: staging evidence is still user-gated by Phase 13, but TC-VIS-02 now exercises the local backend fixture with `unresolvedSchema = 5`.
