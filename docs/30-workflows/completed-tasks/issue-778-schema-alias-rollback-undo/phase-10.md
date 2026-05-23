# Phase 10: リファクタ

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 10 / 13 |
| 前 Phase | 9 (local 受入確認) |
| 次 Phase | 11 (VISUAL evidence + runtime) |
| 状態 | spec_created |

## 目的

機能追加に伴うコード重複・名前付け改善を最小差分で実施。

## リファクタ候補

| ID | 対象 | 内容 | 採否 |
| --- | --- | --- | --- |
| R-01 | `schemaAliasRollback` / 既存 `schemaAliasAssign` の共通 audit log insert を helper 化 | DRY | 採用判定: 重複 2 箇所のみなら**不採用**（過剰抽象化回避） |
| R-02 | `<SchemaDiffPanel.HistoryPane>` を別ファイル分離 | 可読性 | 採用判定: followup-003 history view 来た時に分離。**今は不採用** |
| R-03 | `RollbackApiError` を既存 admin api error 体系に統合 | 一貫性 | 既存体系に組み込む形で**採用** |
| R-04 | UI token 統一（OKLch token 直接記述の整合性） | 品質 | grep gate で漏れがあれば**採用** |

## 不変条件

- 機能追加スコープを越えた refactor は禁止（CLAUDE.md style: 必要な変更のみ）
- 既存 spec/test を壊さない

## 完了条件

- [ ] R-03 / R-04 採用判定の結果が実装に反映
- [ ] typecheck / lint / test 全 pass

## 次 Phase

- 次: 11（VISUAL evidence + runtime）
