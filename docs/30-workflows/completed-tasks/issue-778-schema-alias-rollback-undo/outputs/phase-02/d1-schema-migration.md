# Phase 2 output: D1 schema migration

[実装区分: 実装仕様書]

## migration file

`apps/api/migrations/0019_schema_alias_soft_delete.sql`

## 変更内容

```sql
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
```

## 影響範囲（既存 query への `WHERE deleted_at IS NULL` 追加）

Phase 06 で `rg "FROM schema_aliases" apps/api/src --type ts` で全件抽出し、以下に該当するもの全てに条件追加:

- `apps/api/src/repository/schemaAliases.ts`（存在すれば）
- `apps/api/src/services/aliasRecommendation.ts`
- `apps/api/src/workflows/schemaAliasAssign.ts`
- `apps/api/src/workflows/schemaAliasBackfillBatch.ts`
- `apps/api/src/repository/schemaDiffQueue.ts`（join している場合）
- 他 hit 全件

検証: 適用後の grep で `deleted_at` を含まない `FROM schema_aliases` が 0 件であること。

## rollback (migration の取消) 手順

```sql
-- 0019 を rollback する場合（緊急時のみ）
DROP INDEX IF EXISTS idx_schema_aliases_deleted_at;
DROP INDEX IF EXISTS idx_schema_aliases_revision_stablekey_unique;
DROP INDEX IF EXISTS idx_schema_aliases_revision_question_unique;
-- ALTER TABLE DROP COLUMN は SQLite で限定的。本番では実施せず、列は残置する
-- 必要なら 0020_schema_alias_soft_delete_revert.sql を新規作成して unique index のみ元に戻す
CREATE UNIQUE INDEX idx_schema_aliases_revision_stablekey_unique
  ON schema_aliases(revision_id, stable_key)
  WHERE stable_key IS NOT NULL
    AND stable_key != 'unknown'
    AND stable_key NOT LIKE '__extra__:%';
CREATE UNIQUE INDEX idx_schema_aliases_revision_question_unique
  ON schema_aliases(revision_id, alias_question_id);
```

## local 検証

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db --local
bash scripts/cf.sh d1 execute ubm-hyogo-db --local --command "PRAGMA table_info(schema_aliases);"
bash scripts/cf.sh d1 execute ubm-hyogo-db --local --command "PRAGMA index_list(schema_aliases);"
bash scripts/cf.sh d1 execute ubm-hyogo-db --local --command "PRAGMA table_info(audit_log);"
```

期待:
- `schema_aliases` に `deleted_at` / `deleted_by` / `version` 列存在
- `idx_schema_aliases_deleted_at` index 存在
- `audit_log` は既存 DDL のまま。rollback relation は `after_json` JSON 内の `relatedAuditId` として保存
