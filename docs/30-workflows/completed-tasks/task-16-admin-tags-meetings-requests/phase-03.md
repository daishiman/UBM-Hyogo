# Phase 3: アーキテクチャ設計

> 改訂日: 2026-05-10
> 状態: `completed`

## 1. 現行構成

```text
App Router page
  -> fetchAdmin("/admin/...") for SSR initial data
  -> src/components/admin/*Panel.tsx
  -> src/lib/admin/api.ts mutation helper
  -> app/api/admin/[...path]/route.ts proxy
  -> apps/api/src/routes/admin/*
```

## 2. 画面責務

| route | page | panel | API |
| --- | --- | --- | --- |
| `/admin/tags` | `apps/web/app/(admin)/admin/tags/page.tsx` | `TagQueuePanel` | `GET /admin/tags/queue`, `POST /admin/tags/queue/:queueId/resolve` |
| `/admin/meetings` | `apps/web/app/(admin)/admin/meetings/page.tsx` | `MeetingPanel` | `GET/POST/PATCH /admin/meetings`, `POST /admin/meetings/:id/attendances` |
| `/admin/requests` | `apps/web/app/(admin)/admin/requests/page.tsx` | `RequestQueuePanel` | `GET /admin/requests`, `POST /admin/requests/:noteId/resolve` |

## 3. 設計判断

- 新 adapter 分割は行わず、既存 `src/lib/admin/api.ts` を薄い mutation helper として維持する。
- Server Component fetch は `src/lib/admin/server-fetch.ts` に集約する。
- UI は既存 `src/components/admin` に集約する。新 `features/admin` tree は作らない。
- task-17 との競合点は audit/schema/identity-conflicts であり、task-16 の 3 panels とは分離済み。
