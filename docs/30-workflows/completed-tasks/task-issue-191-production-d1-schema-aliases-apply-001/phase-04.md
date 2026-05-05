# Phase 4: テスト戦略

[実装区分: 実装仕様書]

## 目的

production D1 operation を NON_VISUAL evidence で検証する。実コード、guard script、fallback retirement のテストは本タスクの対象外。

## 検証項目

| ID | 対象 | Command / Evidence | 期待 |
| --- | --- | --- | --- |
| S-1 | migration inventory | `outputs/phase-13/migrations-list-before.txt` | target state が確認できる |
| S-2 | table inventory | `outputs/phase-13/tables-before.txt` | `schema_aliases` の有無が確認できる |
| S-3 | migration ledger | `outputs/phase-13/d1-migrations-table.txt` | `0008_create_schema_aliases.sql` が記録されている |
| S-4 | table shape | `outputs/phase-13/pragma-table-info.txt` | Required columns 9 件 |
| S-5 | index shape | `outputs/phase-13/pragma-index-list.txt` | Required indexes 3 件 |
| S-6 | after state | `outputs/phase-13/migrations-list-after.txt` | duplicate apply 不要 |
| S-7 | SSOT sync | `database-schema.md` / `task-workflow-active.md` | production applied marker と evidence path が一致 |

## 完了条件

- [x] production D1 evidence の必須ファイルが定義されている
- [x] duplicate apply skip が PASS 条件として扱われている
- [x] code-change 系 evidence を本タスクから除外している

## メタ情報

- Phase 04: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 実行タスク

- Phase 04: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 参照資料

- Phase 04: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 統合テスト連携

- Phase 04: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 成果物/実行手順

- production D1 already-applied verification workflow の一部として、本文の正本記述に従う。
