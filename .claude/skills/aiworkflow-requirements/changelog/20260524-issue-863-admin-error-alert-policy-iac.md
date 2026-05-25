# 2026-05-24 issue-863 admin error alert policy IaC

`issue-863-admin-error-alert-policy-iac` を `implemented_local_runtime_pending / implementation / NON_VISUAL` として同期。

- `apps/web/src/lib/logger.ts` で Sentry tags に `scope` / `digest` を string の場合のみ昇格。
- `infra/sentry-alerts/` に admin `error.boundary.caught` policy、schema、load/diff/canonicalize/api-client/CLI、unit tests、README を追加。
- `.github/workflows/sentry-alerts-drift.yml`、`.github/CODEOWNERS`、`package.json` scripts、runbook を追加/更新。
- Source one-pager `fix-admin-scr-err-stg-followup-002-admin-runtime-sentry-alert-policy.md` を consumed pointer に更新。
- Sentry API apply、staging notification smoke、commit、push、PR は user-gated。
