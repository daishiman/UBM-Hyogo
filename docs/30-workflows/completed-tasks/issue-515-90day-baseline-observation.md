## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-01-DERIV-04-FU-03-A |
| source | `docs/30-workflows/issue-515-cf-audit-logs-ml-anomaly/` |
| status | 未実施 |
| reason | Issue #408 hourly run の90日 runtime evidence が外部依存 |

## 苦戦箇所

90 日連続の Cloudflare Audit Logs 監視実績がないと false positive rate と tuning cost を判断できない。

## リスクと対策

runtime evidence 不足のまま ML 比較へ進むと過学習・誤検知増のリスクがある。90 日 gate を満たすまで threshold を継続する。

## 検証方法

`gh run list --workflow=cf-audit-log-monitor.yml` と D1 `cf_audit_log` の集計で連続稼働、false positive rate、tuning cost を記録する。

## スコープ

含む: 90 日観測と Gate-A〜C 判定。含まない: モデル学習、production switch。

