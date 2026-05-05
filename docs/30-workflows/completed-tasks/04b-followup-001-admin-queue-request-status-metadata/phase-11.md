# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04b-followup-001-admin-queue-request-status-metadata |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| Wave | 4 (followup) |
| 実行種別 | serial |
| 作成日 | 2026-04-30 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | completed |
| visualEvidence | NON_VISUAL |

## visualEvidence: NON_VISUAL の縮約テンプレ適用

本タスクは `admin_member_notes` の DB schema / repository helper / route guard 変更のみで UI を伴わないため、screenshot / 動画 / Storybook / Lighthouse / a11y アサーションは **すべて取得不要**。代わりに以下 3 種の text evidence で完了判定する:

1. wrangler 出力（migration 適用ログ）
2. D1 SELECT 出力（backfill / state transition の確認）
3. curl 出力（routes/me の 202 / 409 差分）
4. `manual-smoke-log.md` / `link-checklist.md`（NON_VISUAL 縮約テンプレの必須 output）

screenshot は不要であり `outputs/phase-11/screenshots/` ディレクトリは作成しない。

## 目的

migration 0007 / repository helper / route guard をローカル D1 + apps/api dev サーバーで手動疎通し、AC-2 / AC-7 / AC-8 / AC-9 を text evidence で実証する。

## 実行タスク

1. ローカル D1 に migration 0007 を dry-run 適用（`scripts/cf.sh d1 migrations apply` の `--local` 相当）
2. backfill / 列 NULL 固定の SELECT 検証
3. partial index 適用の `EXPLAIN QUERY PLAN` 検証
4. apps/api dev で本人再申請 → 409 / 202 の curl 差分取得
5. markResolved 経由で resolved 化した後の再申請が 202 になることを検証

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/migration-runbook.md | 適用 / rollback 手順 |
| 必須 | apps/api/migrations/0007_admin_member_notes_request_status.sql | 対象 migration |
| 必須 | docs/00-getting-started-manual/specs/07-edit-delete.md | 受入基準 |

## smoke シナリオ

### シナリオ 1: migration 適用（local）
```bash
# placeholder（実行時に出力を outputs/phase-11/wrangler/migration-apply.txt へ保存）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --local
```
- expected: `0007_admin_member_notes_request_status.sql` が `Migrations applied` として表示
- evidence: `outputs/phase-11/wrangler/migration-apply.txt`

### シナリオ 2: backfill 検証（AC-2）
```sql
-- placeholder（出力を outputs/phase-11/sql/backfill-status-counts.txt へ保存）
SELECT request_status, COUNT(*)
FROM admin_member_notes
WHERE note_type IN ('visibility_request','delete_request')
GROUP BY request_status;
```
- expected: `pending` のみが行として返り、`NULL` / `resolved` / `rejected` が 0 件
- evidence: `outputs/phase-11/sql/backfill-status-counts.txt`

### シナリオ 3: general 行の NULL 固定（AC-1）
```sql
SELECT COUNT(*)
FROM admin_member_notes
WHERE note_type='general'
  AND (request_status IS NOT NULL OR resolved_at IS NOT NULL OR resolved_by_admin_id IS NOT NULL);
```
- expected: `0`
- evidence: `outputs/phase-11/sql/general-null-check.txt`

### シナリオ 4: partial index 検証（AC-9）
```sql
EXPLAIN QUERY PLAN
SELECT 1 FROM admin_member_notes
WHERE member_id = ? AND note_type = ? AND request_status = 'pending';
```
- expected: `SEARCH admin_member_notes USING INDEX idx_admin_notes_pending_requests`
- evidence: `outputs/phase-11/sql/explain-pending-index.txt`

### シナリオ 5: 本人再申請の 409 / 202 差分（AC-7 / AC-8）
```bash
# 5a: 同一 member × 同一 type の pending が存在する状態 → 409
curl -i -X POST http://localhost:8787/me/visibility-request \
  -H "Cookie: session=fixture-member-001" \
  -H "Content-Type: application/json" \
  -d '{"reason":"smoke 1"}'
# expected: HTTP/1.1 409, body に DUPLICATE_PENDING_REQUEST

# 5b: markResolved で resolved 化（admin operation を repository 経由で実行）
# placeholder: D1 直接 UPDATE で resolved 化、もしくは 07a/07c の resolve endpoint を mock
UPDATE admin_member_notes
SET request_status='resolved', resolved_at=strftime('%s','now')*1000, resolved_by_admin_id='admin_smoke'
WHERE id = '<noteId>';

# 5c: resolved 後の再申請 → 202
curl -i -X POST http://localhost:8787/me/visibility-request \
  -H "Cookie: session=fixture-member-001" \
  -H "Content-Type: application/json" \
  -d '{"reason":"smoke 2"}'
# expected: HTTP/1.1 202, 新 noteId を返す
```
- evidence:
  - `outputs/phase-11/curl/me-visibility-409.txt`
  - `outputs/phase-11/sql/mark-resolved-update.txt`
  - `outputs/phase-11/curl/me-visibility-202.txt`

### シナリオ 6: delete-request も同等動作
```bash
curl -i -X POST http://localhost:8787/me/delete-request ...
```
- expected: visibility-request と同じ 409 → resolved → 202 の遷移
- evidence: `outputs/phase-11/curl/me-delete-{409,202}.txt`

## evidence 一覧

| evidence | path | 種別 |
| --- | --- | --- |
| migration 適用 | outputs/phase-11/wrangler/migration-apply.txt | text |
| smoke log | outputs/phase-11/manual-smoke-log.md | text |
| link checklist | outputs/phase-11/link-checklist.md | text |
| backfill 件数 | outputs/phase-11/sql/backfill-status-counts.txt | text |
| general NULL 固定 | outputs/phase-11/sql/general-null-check.txt | text |
| EXPLAIN partial index | outputs/phase-11/sql/explain-pending-index.txt | text |
| 409 curl | outputs/phase-11/curl/me-visibility-409.txt | text |
| markResolved UPDATE | outputs/phase-11/sql/mark-resolved-update.txt | text |
| 202 curl | outputs/phase-11/curl/me-visibility-202.txt | text |
| delete-request 差分 | outputs/phase-11/curl/me-delete-{409,202}.txt | text |
| screenshot | — | **不要（NON_VISUAL）** |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke 結果を documentation-changelog へ |
| Phase 13 | PR description の evidence セクション |

## 多角的チェック観点

| 不変条件 | 手動確認 | 確認方法 |
| --- | --- | --- |
| #4 | member_responses が非更新 | smoke 中に `SELECT updated_at FROM member_responses WHERE member_id=...` で diff 0 |
| #5 | curl host が `localhost:8787 (apps/api)` のみ | curl ログ |
| #11 | admin 操作で member 本文に変更が入らない | member_responses diff 0 |
| 無料枠 | smoke で writes ≤ 10 | wrangler tail |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | migration 適用 | 11 | completed | scripts/cf.sh |
| 2 | backfill 検証 | 11 | completed | SQL |
| 3 | general NULL 固定 | 11 | completed | SQL |
| 4 | partial index | 11 | completed | EXPLAIN |
| 5 | 409 / 202 差分 | 11 | completed | curl |
| 6 | delete-request | 11 | completed | curl |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 結果サマリー |
| ドキュメント | outputs/phase-11/manual-smoke-log.md | NON_VISUAL smoke 実行コマンド / 期待結果 / 実測 |
| ドキュメント | outputs/phase-11/link-checklist.md | workflow 内リンク / evidence リンク確認 |
| evidence | outputs/phase-11/wrangler/* | migration ログ |
| evidence | outputs/phase-11/sql/* | D1 SELECT / EXPLAIN |
| evidence | outputs/phase-11/curl/* | 409 / 202 差分 |
| メタ | artifacts.json | Phase 11 を completed |

## 完了条件

- [x] 6 シナリオすべて期待通り
- [x] `main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 点が揃う
- [x] text evidence 一式が `outputs/phase-11/` に揃う
- [x] 不変条件 #4 / #5 / #11 を手動でも確認
- [x] screenshot 不要であることを main.md に明記

## タスク100%実行確認

- 全シナリオに evidence
- NON_VISUAL 必須 outputs 3 点
- artifacts.json で phase 11 を completed

## 次 Phase への引き渡し

- 次: 12 (ドキュメント更新)
- 引き継ぎ: evidence を documentation-changelog へ
- ブロック条件: violation / 期待外応答があれば差し戻し
