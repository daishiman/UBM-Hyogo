-- 0019_schema_alias_soft_delete.sql
-- Issue #778: schema alias rollback / undo 経路追加に伴う soft delete & 楽観ロック導入
-- 関連: docs/30-workflows/issue-778-schema-alias-rollback-undo/

-- 1. schema_aliases に soft delete + version 列
ALTER TABLE schema_aliases ADD COLUMN deleted_at TEXT;
ALTER TABLE schema_aliases ADD COLUMN deleted_by TEXT;
ALTER TABLE schema_aliases ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- 2. 既存 unique index を deleted_at IS NULL 条件付きで再作成
DROP INDEX IF EXISTS idx_schema_aliases_revision_stablekey_unique;
CREATE UNIQUE INDEX idx_schema_aliases_revision_stablekey_unique
  ON schema_aliases(revision_id, stable_key)
  WHERE deleted_at IS NULL
    AND stable_key IS NOT NULL
    AND stable_key != 'unknown'
    AND stable_key NOT LIKE '__extra__:%';

DROP INDEX IF EXISTS idx_schema_aliases_revision_question_unique;
CREATE UNIQUE INDEX idx_schema_aliases_revision_question_unique
  ON schema_aliases(revision_id, alias_question_id)
  WHERE deleted_at IS NULL;

-- 3. deleted_at 検索用 index
CREATE INDEX IF NOT EXISTS idx_schema_aliases_deleted_at
  ON schema_aliases(deleted_at);

-- 4. audit relation
-- rollback と元 resolve の関係は audit_log.after_json JSON 内の relatedAuditId に保存する。
-- audit_log の DDL は apps/api/migrations/0003_auth_support.sql のまま変更しない。
