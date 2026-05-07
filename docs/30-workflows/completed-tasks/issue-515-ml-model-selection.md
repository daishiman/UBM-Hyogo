## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-01-DERIV-04-FU-03-C |
| source | `docs/30-workflows/issue-515-cf-audit-logs-ml-anomaly/` |
| status | 未実施 |
| reason | model selection には 90 日 redacted dataset が必要 |

## 苦戦箇所

Isolation Forest / XGBoost / Workers AI などの比較は runtime dataset なしでは意味が薄い。

## リスクと対策

複雑性が threshold を上回るリスクがある。precision / recall / FP / FN / fallback rate で threshold と比較する。

## 検証方法

offline replay で threshold より precision/recall が改善し、fallback rate が許容内であることを確認する。

## スコープ

含む: モデル候補比較と評価。含まない: production env 切替。

