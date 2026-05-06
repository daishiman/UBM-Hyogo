# U-FIX-CF-ACCT-01-DERIV-04-FU-04: GitHub audit log correlation

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-FIX-CF-ACCT-01-DERIV-04-FU-04 |
| 状態 | unassigned |
| 優先度 | MEDIUM |
| 親 | `docs/30-workflows/issue-408-cf-audit-logs-monitoring/` |

## 目的

Cloudflare Audit Logs と GitHub Actions / organization audit log を相関し、Token 漏洩経路や workflow misuse を追跡できるようにする。

## スコープ

- 含む: GitHub audit log 取得権限確認、redacted correlation key、Cloudflare finding との timeline merge、Phase 11 evidence。
- 含まない: Cloudflare hourly monitor の初期 green 化、GitHub Org Owner 権限の即時取得。

## 着手判断

Issue #408 本番化後に HIGH alert が 1 件でも発生した時点、または Org Owner 権限による audit log 取得経路が確立した時点で着手する。

## 検証方法

synthetic GitHub workflow event と Cloudflare audit event の fixture correlation、secret / full IP / user agent 非保存 grep、incident runbook dry-run を確認する。
