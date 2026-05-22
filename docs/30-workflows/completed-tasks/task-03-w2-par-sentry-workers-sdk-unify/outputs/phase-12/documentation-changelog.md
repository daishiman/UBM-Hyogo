# Documentation Changelog

| Date | Change |
| --- | --- |
| 2026-05-07 | Phase 11 state を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` に補正 |
| 2026-05-07 | Phase 12 strict 7 outputs を物理配置 |
| 2026-05-07 | `SENTRY_DSN` を Web 正本 secret 名 `SENTRY_DSN_WEB` に寄せた |
| 2026-05-07 | aiworkflow-requirements indexes / active workflow へ canonical root を登録 |
| 2026-05-07 | 実コード差分に合わせて workflow_state を `implemented-local`、Phase 11 を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` へ再同期 |
| 2026-05-07 | `apps/web/src/lib/env.ts` と browser instrumentation test を追加し、`getEnv().SENTRY_DSN_WEB` 経路と client init guard を実装 |
