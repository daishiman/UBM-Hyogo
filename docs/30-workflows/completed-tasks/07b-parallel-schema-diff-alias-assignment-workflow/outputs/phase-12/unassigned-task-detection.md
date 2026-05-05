# Unassigned Task Detection

| 未対応項目 | 理由 | 後続候補 |
|----------|------|---------|
| `schema_questions(revision_id, stable_key)` の DB UNIQUE INDEX 化 | 現状 pre-check のみで防御。race condition の二段防御として将来別 migration で追加が望ましい | `docs/30-workflows/unassigned-task/UT-07B-schema-alias-hardening-001.md` |
| 大規模 back-fill (10000+ 行) の wrangler 実機計測 | 本タスクは in-memory D1 + 250 行までの検証 | `docs/30-workflows/unassigned-task/UT-07B-schema-alias-hardening-001.md` |
| back-fill cron 分割 (案 C) | 性能超過時のみ採用、現状未実装 | `docs/30-workflows/unassigned-task/UT-07B-schema-alias-hardening-001.md` |
| recommended アルゴリズムの label 多言語化 | 日本語 label でも Levenshtein は文字列差で動作するが Unicode 正規化が望ましい | `docs/30-workflows/unassigned-task/UT-07B-alias-recommendation-i18n-001.md` |
| back-fill 中断時の RetryableError → HTTP 5xx マッピング | 現実装は generic Error throw。専用 status code 化は別 task | `docs/30-workflows/unassigned-task/UT-07B-schema-alias-hardening-001.md` |
