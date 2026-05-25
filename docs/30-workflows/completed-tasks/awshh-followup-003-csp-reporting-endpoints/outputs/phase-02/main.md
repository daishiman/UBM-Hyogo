# Phase 2 output: 設計サマリ

- 受信先: Sentry CSP security endpoint（公開 URL を `NEXT_PUBLIC_SENTRY_DSN` で注入）。
- canonical 定数 `CSP_REPORT_GROUP = "csp-endpoint"` で CSP report-to と Reporting-Endpoints / Report-To のグループ名を一致。
- 新規関数 `buildReportingEndpointsHeader(cfg): string | null` / `buildReportToHeader(cfg): string | null`。
- env は `getPublicEnv()` 経由（pick 拡張）。
- 詳細: [phase-02.md](../../phase-02.md)
