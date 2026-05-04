# Phase 5: 実装ランブック — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 5 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 実装区分

[実装区分: 実装仕様書]

本タスクは admin meetings 機能の follow-up 実装を含むため、CONST_005 必須項目を満たす実装仕様書として作成する。

## 目的

実装手順を runbook + placeholder + 擬似コードで確定する。コードはこの仕様では書かない。

## 実行タスク

1. D1 migration `apps/api/migrations/00XX_meetings.sql` の追加手順を書く。完了条件: 列・index・FK が記載される。
2. `apps/api/src/routes/admin/meetings.ts` の擬似コード（route handler / requireAdmin mount / zod schema / audit log emit）を書く。完了条件: 5 endpoint が placeholder で揃う。
3. `apps/web/app/admin/meetings/page.tsx` の擬似コード（SSR fetch / Drawer / Form / Table / CSV download）を書く。完了条件: cookie forwarding のみが使われる。
4. sanity check（`pnpm typecheck` / `pnpm lint` / `pnpm test --filter @repo/api`）を列挙する。完了条件: コマンドが mise exec 経由で記録される。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/08-free-database.md
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
- apps/api/src/middleware/require-admin.ts

## 実行手順

- 対象 directory: docs/30-workflows/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。
- 実装担当は本 phase の runbook を上から順に踏む。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離
- #5 apps/web D1 direct access forbidden
- #7 memberId/responseId separation
- #13 audit log
- #15 Auth session boundary

## サブタスク管理

- [ ] D1 migration runbook を書く
- [ ] api route handler placeholder を書く
- [ ] web page placeholder を書く
- [ ] sanity check 一覧を書く
- [ ] outputs/phase-05/main.md を作成する

## 実装仕様 (CONST_005) — 実装ランブック

### 対象ファイル → 関数 → テスト → 検証コマンド

#### Step 1. D1 schema 確認 / migration 追加（必要時のみ）

- 対象: `apps/api/migrations/0002_admin_managed.sql` を確認
- `meeting_sessions.deleted_at` 列が無い場合のみ新規 migration `apps/api/migrations/00XX_meetings_deleted_at.sql` を追加
- 検証: `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production`（apply は Phase 11 で実施、本 phase では作成のみ）

#### Step 2. repository 拡張

- 対象: `apps/api/src/repository/meetings.ts`
- 追加関数: `updateMeeting`, `softDeleteMeeting`（Phase 2 シグネチャ参照）
- テスト: `apps/api/src/repository/meetings.test.ts` に追記
- 検証: `mise exec -- pnpm test --filter @ubm-hyogo/api -- meetings`

#### Step 3. API route 拡張

- 対象: `apps/api/src/routes/admin/meetings.ts`
- 追加: `PATCH /admin/meetings/:id`（`PatchMeetingBodyZ` で zod validate、`requireAdmin` 通過、`auditAppend` 呼び出し）
- 追加: `GET /admin/meetings/:id/export.csv`（`member_attendance` を `member` JOIN し CSV serialize、UTF-8 BOM、RFC 4180 escape）
- テスト: `apps/api/src/routes/admin/meetings.test.ts` に追記
- 検証: `mise exec -- pnpm test --filter @ubm-hyogo/api -- routes/admin/meetings`

#### Step 4. attendance route の整合確認

- 対象: `apps/api/src/routes/admin/attendance.ts`
- 確認: index.md `POST /api/admin/meetings/:id/attendances` のパスが mount 済みか（実装確認のみ、編集が必要なら本 phase で対応）
- 不変条件 #15: 削除済み member への attendance 付与は 410 を返す

#### Step 5. UI 拡張（apps/web）

- 対象: `apps/web/src/components/admin/MeetingPanel.tsx`
- 追加: 編集 Drawer（fetch `PATCH /api/admin/meetings/:id`）、CSV download `<a>` button、削除確認 dialog
- cookie forwarding のみ。D1 直参照禁止
- テスト: `apps/web/src/components/admin/MeetingPanel.test.tsx`
- 検証: `mise exec -- pnpm test --filter @ubm-hyogo/web -- MeetingPanel`

#### Step 6. 全体検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test --filter @ubm-hyogo/api
mise exec -- pnpm test --filter @ubm-hyogo/web
mise exec -- pnpm build
```

全コマンド成功で本 phase 完了。

## 成果物

- outputs/phase-05/main.md

## 完了条件

- [x] 実装担当が runbook を見て手戻りなく進められる粒度
- [x] placeholder と擬似コードがコンパイル可能な構造で書かれる
- [x] sanity check が `mise exec --` 経由で記載される
- [x] DoD: Step 6 の 5 コマンド全て成功
- [x] audit log の手動確認手順が Phase 11 へ引き継がれる

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 6 へ、runbook と placeholder を渡す。
