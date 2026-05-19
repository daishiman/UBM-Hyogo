# Phase 11 output: migration apply evidence

[実装区分: 実装仕様書]

## 状態

`PENDING_USER_GATE` — staging / production への migration apply は user 明示承認後のみ実行。

## staging apply 手順（user-gated）

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db --env staging
```

## 検証 query（read-only, gate 前実行可）

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db --env staging --command "PRAGMA table_info(schema_aliases);"
bash scripts/cf.sh d1 execute ubm-hyogo-db --env staging --command "PRAGMA index_list(schema_aliases);"
bash scripts/cf.sh d1 execute ubm-hyogo-db --env staging --command "PRAGMA table_info(audit_log);"
```

## 期待結果

| 項目 | 期待値 |
| --- | --- |
| `schema_aliases.deleted_at` | TEXT, nullable |
| `schema_aliases.deleted_by` | TEXT, nullable |
| `schema_aliases.version` | INTEGER NOT NULL DEFAULT 1 |
| `idx_schema_aliases_deleted_at` | exists |
| `idx_schema_aliases_revision_stablekey_unique` | partial (`WHERE deleted_at IS NULL ...`) |
| `audit_log.after_json` | existing JSON field; `relatedAuditId` stored in rollback row JSON |

## production apply

staging 検証完了後、別 user 承認で:

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

## evidence 記録

apply 完了後に以下を本 MD に追記:
- migration apply log（command 出力）
- `PRAGMA` 結果（json or table）
- apply 実行 timestamp / actor email
