# DDL Static Evidence (EV-11-2)

実行日時: 2026-05-02

## 検査内容

`0008_create_schema_aliases.sql` の DDL source で column / index shape を再確認する。

## 状態

local apply は **先行タスク `task-issue-191-schema-aliases-implementation-001`** の Phase 12 で完了しており、当該タスクは `docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001/` に格納済み。

本タスク Phase 9 では実 D1 への接続検査ではなく、DDL ソースの static evidence (S-1〜S-3) によって column / index の source of truth を確認している:

- DDL columns (S-2): id / revision_id / stable_key / alias_question_id / alias_label / source / created_at / resolved_by / resolved_at の **9 column 揃う**
- DDL indexes (S-3): idx_schema_aliases_stable_key / idx_schema_aliases_revision_stablekey_unique / idx_schema_aliases_revision_question_unique の **3 index 揃う**

## Phase 13 で取得する追加 evidence

| ID | path | 内容 |
| --- | --- | --- |
| EV-13-5 | `outputs/phase-13/pragma-table-info.txt` | production apply 後 PRAGMA table_info |
| EV-13-6 | `outputs/phase-13/pragma-index-list.txt` | production apply 後 PRAGMA index_list |

production 実測 PASS は EV-13-5 / EV-13-6 が揃って初めて成立する（Phase 11 完了 ≠ production 実測 PASS）。

## Local PRAGMA Boundary

`apps/api/wrangler.toml` には `[env.development]` がないため、この workflow では `ubm-hyogo-db-prod-local --env development` を正本手順にしない。実測 PRAGMA は Phase 13 の production apply 後に取得する。
