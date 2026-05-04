# Phase 1: 要件定義 — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 1 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 実装区分

[実装区分: 実装仕様書]

本タスクは admin meetings 機能の follow-up 実装を含むため、CONST_005 必須項目を満たす実装仕様書として作成する。本体未実装の API エンドポイント（PATCH / export.csv）と UI 機能（編集 Drawer / CSV download）が残存していたため、artifacts.json は `taskType=implementation` / `docs_only=false` へ正規化し、実装ギャップを今回 cycle 内で閉じる。

## 目的

`/admin/meetings` 機能の真の責務、scope、依存境界、成功条件を確定する。Form schema 外の admin-managed data として扱う原則を固定する。

## 実行タスク

1. 参照資料と該当ソースを確認する。完了条件: meetings の責務境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/06-member-auth.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx

## 実行手順

- 対象 directory: docs/30-workflows/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver, requireAdmin middleware
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離（Form schema に昇格しない）
- #5 apps/web D1 direct access forbidden
- #7 memberId/responseId separation
- #13 audit log
- #15 Auth session boundary（admin gate 二段防御）
- 未実装/未実測を PASS と扱わない。
- gas-prototype の挙動を本番仕様に昇格させない。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-01/main.md を作成する

## 実装仕様 (CONST_005)

### 既存実装ベースライン（読取専用・編集禁止）

- `apps/api/src/routes/admin/meetings.ts` — `GET /admin/meetings`, `POST /admin/meetings` 実装済み
- `apps/api/src/routes/admin/attendance.ts` — attendance route 実装済み
- `apps/api/src/repository/meetings.ts` — `MeetingSessionRow`, `listMeetings`, `insertMeeting`, `findMeetingById`
- `apps/api/src/repository/attendance.ts` — attendance repository 実装済み
- `apps/api/migrations/0002_admin_managed.sql` — 実 D1 table は `meeting_sessions` / `member_attendance`
- `apps/web/app/(admin)/admin/meetings/page.tsx` — SSR page、`MeetingPanel` に委譲
- `apps/web/src/components/admin/MeetingPanel.tsx` — UI component
- `apps/api/src/index.ts` — `adminMeetingsRoute` mount 済み

### 実装ギャップ（本仕様書で確定し、Phase 5 で実装する）

- `PATCH /api/admin/meetings/:id`（更新 / 論理削除）未実装
- `GET /api/admin/meetings/:id/export.csv`（CSV export）未実装
- `POST /api/admin/meetings/:id/attendances` の index.md 表記と attendance.ts 実装の整合確認
- `meeting_sessions.deleted_at` 列の有無確認、無い場合は migration 追加
- 編集 Drawer / CSV ダウンロードボタン UI（`MeetingPanel`）未実装
- audit log の `meetings.update` / `meetings.delete` カバレッジ

### D1 schema 命名整合（重要）

| 論理名（index.md / 仕様書表記） | 物理名（実 D1 table） |
| --- | --- |
| `meetings` | `meeting_sessions` |
| `meeting_attendances` | `member_attendance` |

仕様書本文・runbook・テスト記述では物理名 `meeting_sessions` / `member_attendance` を必ず併記する。

### AC 定量化（Phase 7 マトリクスへ引き継ぎ）

| AC-ID | 内容 | 期待値 |
| --- | --- | --- |
| AC-01 | `/admin/meetings` admin session | HTTP 200 |
| AC-02 | `/admin/meetings` 未ログイン | `/login?gate=admin_required` への redirect |
| AC-03 | `/admin/meetings` 非 admin session | HTTP 403 |
| AC-04 | `POST /api/admin/meetings` | `meeting_sessions` 行追加、201 |
| AC-05 | `PATCH /api/admin/meetings/:id` | title/heldOn/note/deletedAt 更新可 |
| AC-06 | `POST /api/admin/meetings/:id/attendances` | `member_attendance` upsert、200 |
| AC-07 | `GET /api/admin/meetings/:id/export.csv` | CSV `meetingId,heldOn,memberId,displayName,attended` 列順 |
| AC-08 | 全 mutation | audit log 1 件以上 |

### 変更対象ファイル一覧（Phase 2 で詳細化）

- 新規候補: `apps/api/migrations/00XX_meetings_deleted_at.sql`（`deleted_at` 列なき場合）
- 編集: `apps/api/src/routes/admin/meetings.ts`（PATCH / export.csv 追加）
- 編集: `apps/api/src/repository/meetings.ts`（updateMeeting / softDeleteMeeting 追加）
- 編集: `apps/web/src/components/admin/MeetingPanel.tsx`（編集 Drawer / CSV button）
- 参照のみ: `apps/api/src/middleware/require-admin.ts`, `apps/web/middleware.ts`, `apps/api/src/index.ts`

### 成功条件 = DoD

- 上記 AC-01〜AC-08 が AC マトリクス（Phase 7）に紐づく
- `mise exec -- pnpm typecheck` / `pnpm lint` / `pnpm build` 成功
- 該当 unit / contract test が green
- audit log の手動確認手順が Phase 11 runbook に記録される

## 成果物

- outputs/phase-01/main.md

## 完了条件

- [x] `/admin/meetings` が admin session で 200 を返し、未ログイン / 非 admin は 403 になる
- [x] `meeting_sessions`（論理名 `meetings`）/ `member_attendance`（論理名 `meeting_attendances`）の D1 schema が確定する
- [x] API endpoint と HTTP メソッドが確定し、未実装ギャップ（PATCH / export.csv）が明示される
- [x] apps/web は cookie forwarding のみで成立する
- [x] 全 mutation が audit log 対象であることが明記される
- [x] ビルド / 型チェック / lint / 該当テスト成功が DoD として明記される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 2 へ、AC、blocker、evidence path、approval gate、D1 schema 案を渡す。
