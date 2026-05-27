# Phase 11 — pending staging deploy (user-gated)

実 staging へのデプロイと visual baseline 撮影は user-gated。本ローカル実装サイクルでは以下のみ完了:

- T-5.1 fallback 撤去でコードレベルの 404 root cause を解消
- 全 unit + a11y spec green (1163 passed / 1 skipped / 0 failed)
- design tokens drift 0

user による次アクション:

1. `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`（必要なら API も）
2. staging で `/admin/members` を admin session で開き 200 を確認
3. `pnpm exec playwright test --project=staging-visual --grep admin-members-list-aligned --update-snapshots`
4. drawer 展開状態の visual baseline 取得
5. baseline png 2 件を `outputs/phase-11/evidence/` に配置

備考: `INTERNAL_API_BASE_URL` が staging で確実に注入されていることを `bash scripts/cf.sh secret list --env staging` などで事前確認すること。
