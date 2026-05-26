# Phase 5 output: 実装サマリ

変更 5 ファイル:
- `security-headers.ts`（CSP_REPORT_GROUP / CSP_REPORT_MAX_AGE_SECONDS / reportEndpoint / buildReportingEndpointsHeader / buildReportToHeader / report-to・report-uri / Reporting-Endpoints・Report-To）
- `env.ts`（NEXT_PUBLIC_SENTRY_DSN を EnvSchema + PublicEnvSchema）
- `middleware.ts`（reportEndpoint 注入）
- 既存 public DSN 導出（wrangler 差分なし）
- `security-headers.spec.ts`（TC-1〜5）

詳細 diff: [phase-05.md](../../phase-05.md)
