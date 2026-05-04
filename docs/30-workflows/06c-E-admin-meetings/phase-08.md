# Phase 8: DRY 化 — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 8 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 実装区分

[実装区分: 実装仕様書]

本タスクは admin meetings 機能の follow-up 実装（PATCH /api/admin/meetings/:id, GET /api/admin/meetings/:id/export.csv, 論理削除, audit log 全 mutation カバレッジ, web 側編集 Drawer / CSV download）を含むため、CONST_005 必須項目を満たす実装仕様書として作成する。メタ情報の `taskType` は実態に合わせて `implementation` とする。

## 目的

命名・型・path・endpoint の重複を排し、Before / After で記録する。

## 実行タスク

1. endpoint 命名（`/api/admin/meetings`）を他 admin endpoint と整合させる。完了条件: kebab-case / 単数複数の規約が他 admin route と一致する。
2. zod schema の `MeetingSchema` / `AttendanceSchema` を `packages/shared` に置くか api 内に置くかを判断する。完了条件: 重複が無い。
3. CSV serializer を共通 util にできるか検討する。完了条件: Before / After で diff が記述される。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- packages/shared/src/
- apps/api/src/routes/admin/

## 実行手順

- 対象 directory: docs/30-workflows/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離
- #5 apps/web D1 direct access forbidden
- #13 audit log
- #15 Auth session boundary
- DRY と早すぎる抽象化のトレードオフ。

## サブタスク管理

- [ ] endpoint 命名を確認する
- [ ] zod schema 配置を確定する
- [ ] CSV serializer の共通化を検討する
- [ ] outputs/phase-08/main.md を作成する

## 実装仕様 (CONST_005)

### 重複検出対象（DRY 候補）

1. **zod error response 形式**: `apps/api/src/routes/admin/meetings.ts`, `members.ts`, `tags.ts`, `schema.ts` 等で `z.ZodError` を 422 に変換する処理が重複していないか確認する。`apps/api/src/routes/admin/_shared.ts`（または同等の共有 util）に `formatZodError(err): { error: string; issues: ... }` 形式の helper があるかを `grep -rn "ZodError" apps/api/src/routes/admin/` で確認し、無い場合は作成候補として列挙する。
2. **audit log 呼び出し**: `auditAction` + `auditAppend` の呼び出しが `meetings.ts` / `attendance.ts` / 他 admin route で重複していないか確認する。`writeAudit({ actor, action, target, payload })` という単一 entry-point の wrapper を `apps/api/src/lib/audit.ts`（仮）に集約する候補として記述する。対象 mutation: `meeting.created` / `meeting.updated` / `meeting.deleted` / `attendance.added` / `attendance.removed` の 5 種。
3. **CSV serializer**: `meetings/:id/export.csv` の serializer と、もし他 admin route（members 名簿 CSV 等）に存在すれば共通化する。BOM (`﻿`) 付与・改行 `\r\n`・filename `Content-Disposition` の組み立てを `apps/api/src/lib/csv.ts`（仮）の `toCsvResponse(rows, filename)` に切り出す候補とする。
4. **requireAdmin の二段防御**: `apps/api/src/middleware/requireAdmin.ts` と `apps/web/middleware.ts` の matcher の責務分担が他 admin route と整合しているかを確認する。重複ロジックがあれば抽出候補に挙げる。

### 検証コマンド

```bash
mise exec -- pnpm lint
grep -rn "ZodError" apps/api/src/routes/admin/
grep -rn "auditAction\|auditAppend" apps/api/src/routes/admin/
grep -rn "Content-Disposition" apps/api/src/
grep -rn "\\\\uFEFF" apps/api/src/
```

### Before / After 記録

仕様書段階では候補列挙のみ。実装担当が実コード適用後、Before / After diff を `outputs/phase-08/main.md` に貼る。

### DoD（CONST_005）

- 重複削減対象が 4 カテゴリすべてで候補列挙されている
- 抽出候補ごとに「採用 / 不採用 / 保留」の判断材料が揃っている（早すぎる抽象化リスクが言及されている）
- 検証コマンドが記録され、実装担当がそのまま実行できる粒度になっている

## 成果物

- outputs/phase-08/main.md
- outputs/phase-08/dry-candidates.md（重複検出対象の Before / After 表）

## 完了条件（CONST_005 強化版）

- [x] 命名・型・path・endpoint の Before / After が記録される
- [x] 早すぎる抽象化が回避される（DRY と YAGNI のトレードオフが言及されている）
- [x] 検証コマンド（`mise exec -- pnpm lint`, 上記 grep 群）の実行ログが evidence path に保存されている
- [x] evidence path: `outputs/phase-08/main.md`, `outputs/phase-08/dry-candidates.md`

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 9 へ、Before / After 表を渡す。
