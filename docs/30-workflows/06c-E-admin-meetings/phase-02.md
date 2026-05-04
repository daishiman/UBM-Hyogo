# Phase 2: 設計 — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 2 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 実装区分

[実装区分: 実装仕様書]

本タスクは admin meetings 機能の follow-up 実装を含むため、CONST_005 必須項目を満たす実装仕様書として作成する。

## 目的

`/admin/meetings` の module 構造、D1 schema、API contract、UI コンポーネント分割を最小責務で確定する。

## 実行タスク

1. D1 tables `meeting_sessions` / `member_attendance` の列・index・FK 制約を設計する。完了条件: schema が `08-free-database.md` の方針と整合する。
2. `apps/api` route handler の入出力 schema（zod）と `requireAdmin` mount 位置を設計する。完了条件: 5 endpoint が一覧化される。
3. `apps/web` `/admin/meetings` の Drawer / Form / Table 構成を設計する。完了条件: cookie forwarding のみで API を叩く。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/specs/08-free-database.md
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
- apps/api/src/middleware/require-admin.ts
- apps/web/middleware.ts

## 実行手順

- 対象 directory: docs/30-workflows/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。
- Mermaid 構造図 / dependency matrix / module 設計を outputs/phase-02/main.md に記録する。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver, requireAdmin middleware
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離（Form schema に昇格しない）
- #5 apps/web D1 direct access forbidden
- #7 memberId/responseId separation
- #13 audit log
- #15 Auth session boundary
- 無料枠（D1 row 数 / Workers CPU 時間）を超過しない設計。

## サブタスク管理

- [ ] D1 schema を確定する
- [ ] API contract（zod）を確定する
- [ ] UI コンポーネント分割を確定する
- [ ] outputs/phase-02/main.md を作成する

## 実装仕様 (CONST_005)

### 変更対象ファイル一覧

| 区分 | パス | 変更内容 |
| --- | --- | --- |
| 新規 | `apps/api/migrations/00XX_meetings_deleted_at.sql` | `meeting_sessions.deleted_at` 列追加（既存 schema に列なき場合のみ） |
| 編集 | `apps/api/src/routes/admin/meetings.ts` | `PATCH /admin/meetings/:id`, `GET /admin/meetings/:id/export.csv` 追加。既存 `GET` / `POST` は破壊しない |
| 編集 | `apps/api/src/repository/meetings.ts` | `updateMeeting`, `softDeleteMeeting` 追加。既存 export は据え置き |
| 編集 | `apps/web/src/components/admin/MeetingPanel.tsx` | 編集 Drawer、CSV download button、削除 (soft delete) 操作 UI 追加 |
| 参照のみ | `apps/api/src/middleware/require-admin.ts` | mount 確認のみ。編集禁止 |
| 参照のみ | `apps/web/middleware.ts` | `/admin/:path*` matcher 確認のみ。編集禁止 |
| 参照のみ | `apps/api/src/index.ts` | `adminMeetingsRoute` mount 済み確認のみ |

### D1 schema 命名整合（必須明示）

実 D1 table 名は `meeting_sessions` / `member_attendance`（`apps/api/migrations/0002_admin_managed.sql` で定義）。
index.md / 旧仕様の `meetings` / `meeting_attendances` は論理名・ドキュメント表記であり、コード・migration では物理名を使う。

### 関数シグネチャ（repository/meetings.ts）

```ts
// 既存 (変更なし)
export async function listMeetings(c: DbCtx): Promise<MeetingSessionRow[]>
export async function insertMeeting(c: DbCtx, input: { heldOn: string; title: string; note?: string | null }): Promise<MeetingSessionRow>
export async function findMeetingById(c: DbCtx, id: string): Promise<MeetingSessionRow | null>

// 追加
export async function updateMeeting(
  c: DbCtx,
  id: string,
  patch: { title?: string; heldOn?: string; note?: string | null; deletedAt?: string | null }
): Promise<MeetingSessionRow | null>

export async function softDeleteMeeting(c: DbCtx, id: string): Promise<void>
```

### zod schema（routes/admin/meetings.ts）

```ts
const PatchMeetingBodyZ = z.object({
  title: z.string().min(1).optional(),
  heldOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().nullable().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
});
```

### CSV serializer 仕様（export.csv）

- 列順: `meetingId, heldOn, memberId, displayName, attended`
- エンコーディング: UTF-8 with BOM (`﻿` 先頭)
- レスポンスヘッダ:
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="meeting-<id>.csv"`
- escape: RFC 4180 準拠（カンマ・改行・ダブルクォートを含む値は `"..."` で囲み、内部 `"` は `""`）

### 副作用 / audit log

全 mutation で `auditAppend` を呼ぶ。actorId / actorEmail は `requireAdmin` 通過後に session から取得し、既存 `meetings.ts` の audit 呼び出しパターンに揃える。

| operation | event |
| --- | --- |
| `POST /admin/meetings` | `admin.meeting.created` |
| `PATCH /admin/meetings/:id`（通常更新） | `meetings.update` |
| `PATCH /admin/meetings/:id`（`deletedAt` セット） | `meetings.delete`（soft） |
| `POST /admin/meetings/:id/attendances`（attended=true） | `attendance.add` |
| `POST /admin/meetings/:id/attendances`（attended=false） | `attendance.remove` |

### UI 設計（MeetingPanel.tsx）

- 既存 Table の各行に「編集」「CSV」「削除」アクション追加
- 編集 Drawer: title / heldOn / note フィールド。submit で `PATCH /api/admin/meetings/:id`
- CSV button: `<a href="/api/admin/meetings/:id/export.csv" download>` でブラウザダウンロード
- 削除 (soft): 確認 dialog → `PATCH` で `deletedAt` セット
- D1 直参照しない。fetch のみ（cookie forwarding は SSR で）

## 成果物

- outputs/phase-02/main.md

## 完了条件

- [x] `meeting_sessions`（論理 `meetings`）/ `member_attendance`（論理 `meeting_attendances`）の DDL 差分が確定する
- [x] 5 endpoint の request/response schema（zod）が確定する
- [x] 未実装 PATCH / export.csv の関数シグネチャが確定する
- [x] apps/web の cookie forwarding 経路が確定する
- [x] 全 mutation が audit log 出力点と紐づく
- [x] DoD: `mise exec -- pnpm typecheck` / `pnpm lint` / `pnpm build` 成功想定が記載される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 3 へ、設計案、依存矩陣、module 配置を渡す。
