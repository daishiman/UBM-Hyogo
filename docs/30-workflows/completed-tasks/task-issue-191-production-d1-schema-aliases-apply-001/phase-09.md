# Phase 9: 品質保証

[実装区分: 実装仕様書]

## 目的

Phase 13 の production D1 evidence が Required Shape と承認境界を満たすことを確認する。

## QA Checklist

| ID | 確認 | 結果 |
| --- | --- | --- |
| QA-1 | `user-approval.md` が存在する | PASS |
| QA-2 | `migrations-list-before.txt` が存在する | PASS |
| QA-3 | `tables-before.txt` が存在する | PASS |
| QA-4 | `d1-migrations-table.txt` が存在する | PASS |
| QA-5 | `pragma-table-info.txt` が Required columns を示す | PASS |
| QA-6 | `pragma-index-list.txt` が Required indexes を示す | PASS |
| QA-7 | `migrations-apply.log` が存在しない理由が duplicate apply skip として説明されている | PASS |
| QA-8 | `database-schema.md` の production applied marker が evidence path と一致する | PASS |

## 対象外

`pnpm lint`、guard dry-run、repository tests、fallback coverage query は #299/#300 の独立タスクで扱う。本タスクでは必須 evidence にしない。

## 完了条件

- [x] production D1 evidence が揃っている
- [x] duplicate apply skip が仕様準拠として説明されている
- [x] 実コード変更の QA を本タスクへ混在させていない

## メタ情報

- Phase 09: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 実行タスク

- Phase 09: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 参照資料

- Phase 09: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 統合テスト連携

- Phase 09: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 成果物/実行手順

- production D1 already-applied verification workflow の一部として、本文の正本記述に従う。
