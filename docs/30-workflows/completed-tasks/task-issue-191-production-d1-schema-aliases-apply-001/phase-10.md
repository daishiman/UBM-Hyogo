# Phase 10: GO / NO-GO

[実装区分: 実装仕様書]

## Design GO

| 条件 | 判定 |
| --- | --- |
| target database / env が `ubm-hyogo-db-prod` / production で固定されている | GO |
| target migration が `0008_create_schema_aliases.sql` のみである | GO |
| user approval before production operation が明記されている | GO |
| duplicate apply skip path が定義されている | GO |
| rollback は別承認である | GO |

## Runtime GO

| 条件 | 判定 |
| --- | --- |
| user approval recorded | GO |
| migration ledger confirms target migration | GO |
| PRAGMA table shape matches Required columns | GO |
| PRAGMA index shape matches Required indexes | GO |
| SSOT applied marker synchronized | GO |

## NO-GO

| 条件 | 対応 |
| --- | --- |
| target 以外の pending migration がある | apply せず停止 |
| `schema_aliases` exists but ledger does not show target migration | unattributed state としてエスカレーション |
| Required Shape 不一致 | rollback せず追加承認まで停止 |
| destructive rollback が必要 | 別途明示承認を取得 |

## 完了条件

- [x] already-applied verification path で Runtime GO
- [x] code deploy / #299 / #300 を Runtime GO 条件に含めない

## メタ情報

- Phase 10: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 目的

- Phase 10: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 実行タスク

- Phase 10: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 参照資料

- Phase 10: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 統合テスト連携

- Phase 10: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 成果物/実行手順

- production D1 already-applied verification workflow の一部として、本文の正本記述に従う。
