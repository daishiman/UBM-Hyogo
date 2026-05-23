# Phase 8: リファクタ

## 8.1 結論: 本タスクではリファクタを行わない

不変条件 5（`StatusDistribution.tsx` のロジック不変）に従い、リファクタリングは対象外。

## 8.2 観察された改善候補（次タスク送りの判断 — CONST_007 例外）

Phase 5 で caller を確認した際に、もし以下のような改善候補があれば本タスクでは記録のみ行い、別タスクとする:

| 候補 | 理由 | 送り先 |
|---|---|---|
| `StatusDistribution` への storybook 追加 | 視覚 regression baseline 整備 | task-18 visual-design-tokens スコープ |
| `byStatus` populated 用の test fixture を `__fixtures__/` に切り出し | 将来の screenshot 再取得を再現可能にする | 不採用。今回の一時注入 + revert で足り、恒久 fixture は過剰設計 |

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

refactor 候補を評価し、今回サイクルで採用しない理由を記録する。

## 実行タスク

- 恒久 fixture 化の必要性を評価する。
- screenshot 取得のためだけの抽象化を避ける。

## 参照資料

- `phase-2-design.md`
- `phase-5-implementation.md`

## 成果物

- refactor 不採用判断
- 過剰設計回避の根拠

## 完了条件

恒久コード変更なしの方針が維持されている。

- [ ] 恒久 fixture や新規抽象化を採用しない判断が記録されている

## 統合テスト連携

Phase 11 の git status と grep-gate で refactor 不採用の結果を確認する。
| caller (admin page) の prop 取得経路の整理 | 本タスクでは未確認、Phase 5 で観察後判断 | 観察結果により判断 |

これらは「今サイクル内で完了させると本タスクの 0.25 人日スコープを破壊する」明確な理由のもと先送りとする。先送りする場合は本ファイルに項目を記入し、ユーザーへエスカレーションする。

## 8.3 改善候補が無かった場合

→ 本 Phase は no-op で完了。
