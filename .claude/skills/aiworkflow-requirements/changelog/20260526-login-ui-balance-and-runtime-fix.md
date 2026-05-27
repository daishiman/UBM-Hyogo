# 2026-05-26 login-ui-balance-and-runtime-fix

`login-ui-balance-and-runtime-fix` を `implemented_local_runtime_pending / implementation / VISUAL` として同期。Phase 11 local screenshots 取得済み、staging smoke / staging visual baseline は user-gated。

- `/login` input/button balance を `auth.css` で補正
- Google brand icon を legacy `[data-size]` CSS から隔離
- magic-link / gate-state / admin / me / helper fetch の `INTERNAL_API_BASE_URL` 解決を `apps/web/src/lib/env.ts` accessor 経由へ統一
- `scripts/verify-no-process-env-internal-api.sh` と focused magic-link route specs を追加
- prototype HTML を jsdelivr 固定 + stale SRI 撤去に更新し、`.jsx` MIME 用 `scripts/serve-prototype.sh` を追加
- Phase 12 strict 7、output artifacts parity、quick-reference / resource-map / task-workflow-active / artifact inventory / system specs / task-specification-creator feedback を同一 wave 反映

Staging smoke、Playwright visual evidence、commit、push、PR は user-gated。
