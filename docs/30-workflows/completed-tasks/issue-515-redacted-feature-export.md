## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-01-DERIV-04-FU-03-B |
| source | `docs/30-workflows/issue-515-cf-audit-logs-ml-anomaly/` |
| status | 未実施 |
| reason | redacted production dataset は Gate-A 達成後でないと不足 |

## 苦戦箇所

D1 raw source store には IP / UA / raw_json があるため、export 時に redacted feature だけへ変換する境界が必要。

## リスクと対策

raw 値混入が最大リスク。`secret-leakage-grep.ts` の clean/positive fixture 検証を export pipeline に組み込む。

## 検証方法

90 日分の redacted JSONL を作成し、secret leakage grep exit 0 と schema validation を確認する。

## スコープ

含む: redacted feature export。含まない: モデル選定、production ML switch。

