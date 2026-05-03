# Phase 6: 異常系設計

[実装区分: 実装仕様書]

## 異常系

| ID | 条件 | 対応 |
| --- | --- | --- |
| E-1 | `scripts/cf.sh whoami` 失敗 | production operation を停止 |
| E-2 | target 以外の pending migration がある | apply せず NO-GO |
| E-3 | `schema_aliases` が既存かつ ledger が target migration を示さない | unattributed state としてエスカレーション |
| E-4 | Required columns 不一致 | rollback せず停止 |
| E-5 | Required indexes 不一致 | rollback せず停止 |
| E-6 | rollback が必要 | 追加の明示承認まで実行しない |

## Already-Applied Path

`schema_aliases` が既存で、`d1_migrations` が `0008_create_schema_aliases.sql` を示す場合は duplicate apply を実行しない。PRAGMA shape verification で完了判定する。

## 完了条件

- [x] duplicate apply 防止の異常系が定義されている
- [x] destructive rollback を別承認に分離している
- [x] #299/#300 のコードリスクを本タスクの異常系に混在させていない

## メタ情報

- Phase 06: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 目的

- Phase 06: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 実行タスク

- Phase 06: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 参照資料

- Phase 06: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 統合テスト連携

- Phase 06: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 成果物/実行手順

- production D1 already-applied verification workflow の一部として、本文の正本記述に従う。
