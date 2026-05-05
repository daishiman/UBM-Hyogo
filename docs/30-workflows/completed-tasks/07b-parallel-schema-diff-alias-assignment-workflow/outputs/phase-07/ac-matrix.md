# AC マトリクス

| AC | 検証 | 実装 | 異常系 | 不変条件 |
|----|------|------|--------|---------|
| AC-1 apply で stableKey 更新 + queue resolved | unit `apply_updates_stable_key` | `schemaAliasAssign` apply branch | 5xx D1 失敗 | #14 |
| AC-2 dryRun 書き込みなし | unit `dryRun_no_write` | dryRun branch | regression は test 失敗 | #14 |
| AC-3 collision 422 | unit `collision_422` | pre-check + UNIQUE | 422 | #14 |
| AC-4 back-fill response_fields | unit `backfill_batch_loop` | back-fill loop | CPU 超過は retry | #1 |
| AC-5 batch=100 で 30s 内 | back-fill 計測 | batch UPDATE ループ | RetryableError | #5 |
| AC-6 audit_log 記録 | unit `audit_apply_recorded` | audit append | INSERT 失敗時手動補完 | 監査 |
| AC-7 recommendedStableKeys | unit `recommend_score_order` | service `recommendAliases` | empty=[] | UX |
| AC-8 stableKey 文字列 0 件 | grep test (Phase 11) | schema_questions row 経由のみ | regression | #1 |
| AC-9 削除 skip | unit `deleted_response_skip` | NOT IN deleted_members | regression | data integrity |
| AC-10 401/403 | route test | requireAdmin | 401/403 | 認可 |

## 不変条件 → AC

- #1: AC-4, AC-8
- #5: AC-5, AC-10
- #14: AC-1, AC-2, AC-3
