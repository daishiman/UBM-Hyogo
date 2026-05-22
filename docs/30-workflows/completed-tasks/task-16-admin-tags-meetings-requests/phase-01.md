# Phase 1: 要件定義

> 改訂日: 2026-05-10
> 状態: `completed`

## 1. 目的

admin 3 画面 `/admin/tags`、`/admin/meetings`、`/admin/requests` を現行 repo の実装正本に合わせて補強・検証する。30 種思考法レビューで、旧仕様の `apps/web/src/app` / `src/features/admin` / `lib/api/admin-*` 新設前提は現行実装と不整合と判定したため、本 Phase 以降は次を正本とする。

## 2. 正本実装

| 領域 | 正本 |
| --- | --- |
| routes | `apps/web/app/(admin)/admin/{tags,meetings,requests}/page.tsx` |
| client panels | `apps/web/src/components/admin/{TagQueuePanel,MeetingPanel,RequestQueuePanel}.tsx` |
| client mutation helper | `apps/web/src/lib/admin/api.ts` |
| server fetch helper | `apps/web/src/lib/admin/server-fetch.ts` |
| tests | `apps/web/src/components/admin/__tests__/{TagQueuePanel,MeetingPanel,RequestQueuePanel}.test.tsx` |
| E2E | `apps/web/playwright/tests/{admin-pages,admin-requests}.spec.ts` |

## 3. DoD

- `/admin/tags`: `GET /admin/tags/queue` を `fetchAdmin()` で読み、`resolveTagQueue(queueId, { action: "confirmed", tagCodes } | { action: "rejected", reason })` で mutation する。
- `/admin/meetings`: `GET /admin/meetings` と `GET /admin/members` を読み、`createMeeting` / `updateMeeting` / `addAttendance` / `removeAttendance` を使う。
- `/admin/requests`: `GET /admin/requests?status=pending&type=<type>` を読み、`resolveAdminRequest(noteId, { resolution, resolutionNote? })` を使う。
- `apps/api`、`apps/web/app/api/admin/[...path]/route.ts`、`apps/web/app/(admin)/layout.tsx` は変更しない。
- Phase 12 strict 7 outputs と aiworkflow-requirements 同期を同一 wave で作成する。

## 4. 非ゴール

- 新 admin endpoint 追加。
- 新 `features/admin` tree 作成。
- `adminClient` namespace 新設。
- カレンダー UI、bulk resolve、member 本文直接編集 UI。
- commit / push / PR。

## 5. 依存

上流は task-09 tokens、task-10 primitives、task-15 admin layout、task-21 admin blueprint。下流は task-18 regression smoke / visual evidence。
