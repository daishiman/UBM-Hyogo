# Phase 4: テスト設計

> 改訂日: 2026-05-10
> 状態: `completed`

## 1. Focused tests

| 対象 | test |
| --- | --- |
| Tags | `apps/web/src/components/admin/__tests__/TagQueuePanel.test.tsx` |
| Meetings | `apps/web/src/components/admin/__tests__/MeetingPanel.test.tsx` |
| Requests | `apps/web/src/components/admin/__tests__/RequestQueuePanel.test.tsx` |
| Admin sidebar | `apps/web/src/components/layout/__tests__/AdminSidebar.test.tsx` |
| E2E request queue | `apps/web/playwright/tests/admin-requests.spec.ts` |
| Admin smoke | `apps/web/playwright/tests/admin-pages.spec.ts` |

## 2. Required cases

- Tag confirmed sends `{ action: "confirmed", tagCodes }`.
- Tag rejected requires non-empty reason and sends `{ action: "rejected", reason }`.
- Meeting create/update uses `title / heldOn / note`; attendance add/remove handles 409/422.
- Request approve/reject sends `{ resolution: "approve" | "reject", resolutionNote? }` to `/resolve`.
- Server-side fetch fixtures for `/admin/requests` use `PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE=1` because Playwright `page.route()` cannot intercept Server Component fetch.

## 3. Command

```bash
mise exec -- pnpm -F @ubm-hyogo/web test --run \
  src/components/admin/__tests__/TagQueuePanel.test.tsx \
  src/components/admin/__tests__/MeetingPanel.test.tsx \
  src/components/admin/__tests__/RequestQueuePanel.test.tsx \
  src/components/layout/__tests__/AdminSidebar.test.tsx
```
