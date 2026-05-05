# Migration Runbook — 0007_admin_member_notes_request_status.sql

## 適用前チェック

```bash
# 既存 pending 行（migration 適用前は note_type で代用判定）の件数を控える
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT note_type, COUNT(*) FROM admin_member_notes GROUP BY note_type;"
```

## 適用

```bash
# staging で先行検証
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
# production
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

## 検証 SQL

```sql
-- 想定 0 件: backfill 漏れがあれば 1 以上
SELECT COUNT(*) FROM admin_member_notes
 WHERE note_type IN ('visibility_request','delete_request')
   AND request_status IS NULL;

-- general 行は NULL を維持
SELECT COUNT(*) FROM admin_member_notes
 WHERE note_type = 'general' AND request_status IS NOT NULL;

-- partial index 利用確認
EXPLAIN QUERY PLAN
SELECT 1 FROM admin_member_notes
 WHERE member_id = 'm_001' AND note_type='visibility_request' AND request_status='pending'
 LIMIT 1;
-- 期待: USING INDEX idx_admin_notes_pending_requests
```

## Rollback 手順

SQLite は `DROP COLUMN` を後付け migration で行う場合テーブル再作成が必要となるため、
本タスクでは **論理 rollback** とする:

1. 新規 migration を追加し `UPDATE admin_member_notes SET request_status=NULL, resolved_at=NULL, resolved_by_admin_id=NULL` を実行
2. `DROP INDEX IF EXISTS idx_admin_notes_pending_requests`
3. アプリ側は前 commit に revert（列は無害な未使用列として残置）

物理 rollback が必要な場合は `admin_member_notes` のテーブル再作成 migration を別途用意する。
