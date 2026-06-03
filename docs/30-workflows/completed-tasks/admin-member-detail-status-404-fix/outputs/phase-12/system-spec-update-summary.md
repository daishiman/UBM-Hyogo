# システム仕様更新サマリ

> **[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]** — local 実装・focused evidence は完了。公開 API surface は不変。

## 概要

| 項目 | 値 |
|------|-----|
| workflow_id | `admin-member-detail-status-404-fix` |
| workflow_state | **implemented_local_evidence_captured** |
| 分類 | NON_VISUAL（`apps/api` + D1 migration のみ・`apps/web` 無変更） |
| 公開 API surface | **不変**（endpoint / request / response shape の追加・変更なし） |

---

## Step 1-A: 完了タスク記録（implemented local）

本 workflow は **implemented_local_evidence_captured** として記録する。remote D1 apply / staging deploy / commit / push / PR は completed ではない。

- F-1〜F-5 の local 実装（`ensureMemberStatusRow` / builder degraded view / route 404 境界変更 / ingest 予防 / migration 0024）を完了。
- focused D1 Vitest 5 files / 67 tests PASS、typecheck PASS、lint PASS、apps/web diff 0 を確認。
- commit・PR・remote D1 migration apply・staging deploy は全て Phase 13 のユーザーゲート。

## Step 1-B: 実装状況テーブル

| 対象 | 実装状況 | 備考 |
|------|---------|------|
| F-1 `ensureMemberStatusRow` / `defaultMemberStatusRow`（status.ts） | **implemented_local** | helper / default row を追加 |
| F-2 builder degraded view（builder.ts） | **implemented_local** | status / current_response 欠落で 200 degraded view |
| F-3 route 404 境界変更（member-status.ts） | **implemented_local** | 404 は identity 不在のみ。欠落 status は ensure |
| F-4 ingest 予防（sync-forms-responses.ts） | **implemented_local** | 新規 identity 作成時に status 既定行を保証 |
| F-5 migration 0024（0025_backfill_member_status.sql） | **implemented_local** | orphan status backfill SQL 追加 |
| 自動テスト（5 spec + FakeD1 / beforeEach 改修） | **PASS** | D1 focused 5 files / 67 tests PASS |
| Phase 11 evidence（manual-test-result.md の PASS 件数） | **present** | typecheck / lint / focused vitest / apps-web diff 0 |

> 実装状況は local completed。external ops は user-gated。

## Step 1-C: 関連タスク

| 関連 | 内容 | 状態 |
|------|------|------|
| 起点ブランチ | `fix/admin-member-detail-status-404`（`origin/dev` = `bd0393a29` 起点） | 依存なし |
| 直前コミット | #1031 member self photo / #1029 public photo / #1084 OG worker | 本件と無関係（carry-over なし・Phase 1 §1.6） |
| 将来層分離 | MINOR-FUT-1（member 作成経路統一）/ MINOR-FUT-2（member_status FK 制約導入） | 別 Issue/backlog 候補（`unassigned-task-detection.md`・ユーザーゲート） |

## Step 2: 新規インターフェース追加 — **N/A（該当なし）**

本タスクは **新規インターフェース（公開 API / IPC 契約）を追加しない**。

- **理由**: `ensureMemberStatusRow` は `apps/api/src/repository/status.ts` の **内部 repository helper** であり、外部に公開する API endpoint / リクエスト / レスポンス shape ではない。member_status の既定行生成は内部実装の挙動変更にとどまる。
- 既存 endpoint（`GET /admin/members/:memberId` / `PATCH /admin/members/:memberId/status`）の surface（パス・メソッド・request body・response shape）は不変。404 が返る条件（identity 不在）に絞り込まれるが、これは契約の追加ではなく境界の是正であり、正常系のレスポンス shape は変わらない。
- `defaultMemberStatusRow` も builder 内部で使う純関数で、外部契約には現れない。
- migration 0024 は DB データの補完であり、schema（テーブル定義）は変更しない。

### aiworkflow-requirements への spec 更新要否

公開 API contract references の更新は **不要**。ただし workflow/index/inventory 登録は **必要** と判断する。

- 根拠: API contract（endpoint surface / request / response shape）が不変であり、aiworkflow-requirements の references（API / IPC 契約 spec）に反映すべき新規・変更契約が存在しない。
- 不変条件への影響もなし（#5 web→D1 禁止維持・既存 API のみ接続・Google Form schema 不変）。
- よって API / IPC 正本仕様は変更しない。ただし `task-workflow-active.md` / quick-reference / resource-map / artifact inventory（`## Lessons Learned` 節）/ changelog / `lessons-learned-admin-member-detail-status-404-fix-2026-06.md`（L-ADMDET-001..005）/ `docs/30-workflows/LOGS.md` は implemented workflow として same-wave 同期する。inventory が `references/` 配下のため `pnpm indexes:rebuild` で topic-map / keywords を再生成する（冪等 drift 0）。

## 参照資料

- Phase 1 §1.5 inventory / Phase 5 §5.1 変更ファイル一覧 / Phase 10 §10.3 MINOR
- `apps/api/src/repository/status.ts` / `apps/api/migrations/0002_admin_managed.sql:5-15`
