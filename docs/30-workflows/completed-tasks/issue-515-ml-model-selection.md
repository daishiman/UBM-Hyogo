## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-01-DERIV-04-FU-03-C |
| source | `docs/30-workflows/issue-515-cf-audit-logs-ml-anomaly/` |
| status | formalized_by_issue_548_spec_created |
| canonical successor | `docs/30-workflows/issue-548-ml-model-selection/` |
| reason | model selection には 90 日 redacted dataset が必要。Issue #548 で比較基盤・候補・選定基準・promotion 境界を仕様化済み。本番 winner は FU-03-B dataset replay 後に確定する |

## 苦戦箇所

Isolation Forest / XGBoost / Workers AI などの比較は runtime dataset なしでは意味が薄い。

## リスクと対策

複雑性が threshold を上回るリスクがある。precision / recall / FP / FN / fallback rate で threshold と比較する。

## 検証方法

offline replay で threshold より precision/recall が改善し、fallback rate が許容内であることを確認する。

## スコープ

含む: モデル候補比較と評価。含まない: production env 切替。
