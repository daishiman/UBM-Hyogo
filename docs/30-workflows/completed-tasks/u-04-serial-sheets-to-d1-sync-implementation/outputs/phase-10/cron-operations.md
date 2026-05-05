# u-04 Cron 運用手順

## 現行 cron 構成 (`apps/api/wrangler.toml`)

| cron | trigger | owner |
| --- | --- | --- |
| `0 * * * *` | u-04 sheets→D1 全件 upsert sync | u-04 |
| `0 18 * * *` (= 03:00 JST) | 03a schema sync | 03a |
| `*/15 * * * *` | 03b forms response sync | 03b |

production / staging とも同一構成。

## 操作

### cron 式変更

1. `apps/api/wrangler.toml` の `[triggers] crons` (および `[env.staging.triggers]`) を編集
2. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` で staging 検証
3. メトリクス (sync_job_logs / Cloudflare Logs) を 1 週間確認
4. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` で本番反映

### 一時停止

- 該当 cron を `[triggers] crons` 配列から除外して deploy
- または Cloudflare Dashboard → Workers → Triggers で disable

### staging 先行検証

- `[env.staging.triggers] crons` を `*/30 * * * *` 等の高頻度に変更
- 1 週間運用してメトリクス確認後に production 反映

### 09b co-owner ハンドオフ

- triggers 配列を変更するときは 09b owner (cron 監視 / alert / runbook) に事前通知
- 09b 着手時は本ファイル + sync-audit-recipes.md を入力として参照
