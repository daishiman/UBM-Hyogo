# Phase 7: カバレッジ

> workflow: admin-audit-prototype-alignment

## カバレッジ観点

- `AuditLogPanel`: filter / error / empty / table / pagination / PII masking。
- `safeServerFetch`: 404 / 5xx / unknown / generic error。
- `apps/api`: route mount が `notFoundHandler` に落ちないこと。

数値カバレッジの閾値変更は行わない。既存閾値内で focused tests を追加する。

