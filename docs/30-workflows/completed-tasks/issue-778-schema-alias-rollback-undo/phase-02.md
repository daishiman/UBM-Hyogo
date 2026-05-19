# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 2 / 13 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | spec_created |

## 目的

D1 schema 変更・API contract・UI 状態機械を確定し、実装可能な仕様まで落とし込む。

## 主成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-02/d1-schema-migration.md | `0019_schema_alias_soft_delete.sql` 設計 |
| outputs/phase-02/api-contract.md | `POST /admin/schema/aliases/:aliasId/rollback` 設計 |
| outputs/phase-02/ui-state-machine.md | SchemaDiffPanel rollback / undo 状態遷移 |

## 設計サマリ

### D1 schema 変更（0019）

```sql
ALTER TABLE schema_aliases ADD COLUMN deleted_at TEXT;
ALTER TABLE schema_aliases ADD COLUMN deleted_by TEXT;
ALTER TABLE schema_aliases ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

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

CREATE INDEX IF NOT EXISTS idx_schema_aliases_deleted_at
  ON schema_aliases(deleted_at);
```

audit relation は現行 schema alias workflow と同じ application `audit_log` に保存する。`cf_audit_log` は Cloudflare Audit Logs 取り込み専用なので変更しない。元 resolve audit id は rollback 行の `after_json.relatedAuditId` に格納する。

### API contract

`POST /admin/schema/aliases/:aliasId/rollback`

- header: `If-Match: version=<N>`（楽観ロック）
- body: `{ "reason"?: string }`
- response 200: `{ aliasId, rolledBackAt, relatedAuditId, newVersion, impact: { affectedResponseCount, recomputeRequired } }`
- response 409: version mismatch
- response 404: alias not found / already deleted

### UI 状態機械

```
idle ──(rollback click)──> confirm_modal ──(confirm)──> calling_api ──> success_toast / error_toast
                              │
                              └──(cancel)──> idle

resolve_success ──(toast shown ≤5min)──> undo_available ──(undo click)──> calling_api
                                              │
                                              └──(>5min OR dismiss)──> idle
```

## 不変条件確認

- D1 直接アクセスは `apps/api` 側のみ（CLAUDE.md #5）
- 既存 `POST /admin/schema/aliases` には触れない
- `*.spec.{ts,tsx}` 命名

## 完了条件

- [x] D1 migration 設計
- [x] API contract 設計
- [x] UI 状態機械設計
- [x] 3 outputs 配置計画

## 次 Phase

- 次: 3（設計レビュー）
