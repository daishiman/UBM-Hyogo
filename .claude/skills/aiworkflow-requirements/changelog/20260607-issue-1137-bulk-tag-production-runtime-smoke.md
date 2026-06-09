# 2026-06-07 issue-1137 bulk tag production runtime smoke

`issue-1137-bulk-tag-production-runtime-smoke` を `implemented_local_runtime_pending / implementation / NON_VISUAL` として同期した。

- `scripts/smoke/runtime-tag-bulk.sh` に `production` env 分岐、`assert_production_guard`、production D1 / prefix / SQL selection、dual marker gate を追加。
- `apps/api/migrations/seed/bulk-tag-production-{seed,cleanup}.sql` を追加し、`e2e_test_prod_tagbulk_%` synthetic rows のみを touch する。
- `.github/workflows/production-runtime-smoke.yml` に `bulk-tag-production-runtime-smoke` job を追加。`workflow_dispatch` + environment approval + runner dual marker。
- `scripts/smoke/__tests__/runtime-tag-bulk.test.sh` に production guard / dual marker / host allowlist / prod D1 refusal / production stub pass を追加。
- local shell test と actionlint は PASS。production real D1 runtime evidence、commit、push、PR は user-gated。
