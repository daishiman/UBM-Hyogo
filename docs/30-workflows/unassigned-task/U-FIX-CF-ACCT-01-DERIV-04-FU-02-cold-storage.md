# U-FIX-CF-ACCT-01-DERIV-04-FU-02: Cloudflare Audit Logs cold storage

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-01-DERIV-04-FU-02 |
| 状態 | unassigned |
| 優先度 | LOW |
| 親 | `docs/30-workflows/issue-408-cf-audit-logs-monitoring/` |

## 目的

D1 の 30 日 TTL を超える Cloudflare Audit Logs を R2 などの cold storage へエクスポートし、半期監査や事後調査に備える。

## スコープ

- 含む: D1 から redacted audit log を定期 export、R2 bucket / lifecycle / retention runbook、secret redaction evidence。
- 含まない: Issue #408 の hourly detection 本体、ML anomaly detection。

## 着手判断

半期監査要件が確定した時点、または D1 容量が 50% を継続して超過した時点で着手する。

## 検証方法

fixture export、R2 object manifest、secret / full IP / user agent 非保存 grep、restore drill を Phase 11 evidence とする。
