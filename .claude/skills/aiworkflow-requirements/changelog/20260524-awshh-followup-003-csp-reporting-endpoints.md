# 2026-05-24 awshh-followup-003-csp-reporting-endpoints

## Summary

`awshh-followup-003-csp-reporting-endpoints` を `implemented_local_evidence_captured / implementation / NON_VISUAL` として同期した。

## Implementation

- `apps/web/src/lib/security-headers.ts`: `CSP_REPORT_GROUP`、`buildSentryCspReportUrl()`、`buildReportingEndpointsHeader()`、CSP `report-to` / `report-uri`、`Reporting-Endpoints` 出力を追加。
- `apps/web/src/lib/env.ts`: `getPublicEnv()` の public subset に既存 `NEXT_PUBLIC_SENTRY_DSN` を追加。
- `apps/web/middleware.ts`: public DSN から Sentry CSP security endpoint を導出して security header config へ注入。
- `apps/web/src/lib/security-headers.spec.ts` / `apps/web/src/lib/__tests__/env.spec.ts`: endpoint 導出、group drift、legacy `report-uri`、未設定時 no-op、public env subset を検証。

## Documentation Sync

- Canonical workflow root、root/output artifacts parity、Phase 12 strict 7、canonical 9 heading compliance check を整備。
- Source placeholder `docs/30-workflows/completed-tasks/unassigned-task/awshh-followup-003-reporting-endpoints.md` を CONSUMED 化。
- `security-web-response-headers.md` の U-AWSHH-003 を本 workflow consumed として更新。
- quick-reference / resource-map / task-workflow-active / artifact inventory / lessons learned / SKILL-changelog / LOGS を同一サイクルで同期。

## Boundary

`apps/api`、D1 migrations、`apps/web/wrangler.toml` は不変更。staging deploy、Sentry receive verification、commit、push、PR、Issue mutation は user-gated。
