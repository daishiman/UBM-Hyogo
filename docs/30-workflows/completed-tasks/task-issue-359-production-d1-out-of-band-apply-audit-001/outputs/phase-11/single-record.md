# Single attribution record

| field | value |
| --- | --- |
| timestamp_1 | `2026-05-01 08:21:04 UTC` (`0008_schema_alias_hardening.sql`) |
| timestamp_2 | `2026-05-01 10:59:35 UTC` (`0008_create_schema_aliases.sql`) |
| target_database | `ubm-hyogo-db-prod` (env=production, account: redacted) |
| command | `wrangler d1 migrations apply ubm-hyogo-db-prod --env production --remote` (cloudflare/wrangler-action@v3, `.github/workflows/backend-ci.yml` L82-91) |
| approver | GitHub PR review approval (PR #364 / PR #365 merge by `daishiman`) + `environment: production` 設定 |
| workflow_evidence | `.github/workflows/backend-ci.yml` `deploy-production` job step `Apply D1 migrations` ／ Actions run id `25207878876` (timestamp_1) / `25211958572` (timestamp_2) ／ git merge commit `9841e06a` (PR #364) / `2ced613d` (PR #365) |
| classification | confirmed |
