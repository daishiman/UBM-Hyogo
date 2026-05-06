# U-FIX-CF-ACCT-01-DERIV-04-FU-03: Cloudflare Audit Logs anomaly model

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-01-DERIV-04-FU-03 |
| 状態 | unassigned |
| 優先度 | LOW |
| 親 | `docs/30-workflows/issue-408-cf-audit-logs-monitoring/` |

## 目的

Issue #408 の閾値ベース判定が 90 日以上安定した後、誤検知率と運用コストを評価し、必要なら異常検知モデルへ置換する。

## スコープ

- 含む: 教師データ設計、redacted feature set、offline evaluation、false positive / false negative 指標。
- 含まない: raw audit event の外部送信、Token 値や full IP / user agent の学習データ保存。

## 着手判断

閾値運用が 90 日以上安定し、誤検知率 <= 5% を維持しつつチューニングコストが月 4h を超えた場合に着手する。

## 検証方法

過去 redacted dataset に対する offline replay、precision / recall、secret leakage grep、rollback to threshold classifier を確認する。
