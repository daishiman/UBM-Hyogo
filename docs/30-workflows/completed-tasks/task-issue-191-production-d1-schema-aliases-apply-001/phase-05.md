# Phase 5: 実装計画

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| 機能名 | task-issue-191-production-d1-schema-aliases-apply-001 |
| visualEvidence | NON_VISUAL |

## 目的

production D1 に対する `0008_create_schema_aliases.sql` の apply / already-applied verification runbook を確定する。実コード変更は本タスクの対象外とし、成果物は production operation evidence と SSOT 同期に限定する。

## 変更対象

| 区分 | パス | 内容 |
| --- | --- | --- |
| 操作 | production D1 (`ubm-hyogo-db-prod`) | migration list / table inventory / PRAGMA verification |
| 文書 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | production applied marker |
| 文書 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | workflow state / dependency notes |
| 文書 | `.claude/skills/aiworkflow-requirements/references/workflow-task-issue-191-production-d1-schema-aliases-apply-001-artifact-inventory.md` | evidence inventory |
| 文書 | `outputs/phase-13/*` | runtime evidence |

## 実行 Runbook

```bash
bash scripts/cf.sh whoami

bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production \
  | tee outputs/phase-13/migrations-list-before.txt

bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" \
  | tee outputs/phase-13/tables-before.txt
```

判定:

- `schema_aliases` が存在せず、`0008_create_schema_aliases.sql` だけが pending なら、ユーザー承認後に migrations apply を実行する。
- `schema_aliases` が存在し、`d1_migrations` が `0008_create_schema_aliases.sql` を示すなら、duplicate apply を実行せず already-applied verification path に進む。
- target 以外の pending migration がある場合は NO-GO とする。

Already-applied verification:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production \
  --command "SELECT * FROM d1_migrations;" \
  | tee outputs/phase-13/d1-migrations-table.txt

bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production \
  --command "PRAGMA table_info(schema_aliases);" \
  | tee outputs/phase-13/pragma-table-info.txt

bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --config apps/api/wrangler.toml --env production \
  --command "PRAGMA index_list(schema_aliases);" \
  | tee outputs/phase-13/pragma-index-list.txt
```

## 検証

- Required columns 9 件が揃う。
- Required indexes 3 件が揃う。
- `migrations-list-after.txt` が duplicate apply 不要の状態を示す。
- `database-schema.md` の production marker と Phase 13 evidence path が一致する。

## 完了条件

- [x] production operation の command / evidence path が定義されている
- [x] duplicate apply を避ける already-applied path が定義されている
- [x] 実コード変更を本タスクの対象外として分離している

## 実行タスク

- Phase 05: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 参照資料

- Phase 05: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 統合テスト連携

- Phase 05: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 成果物/実行手順

- production D1 already-applied verification workflow の一部として、本文の正本記述に従う。
