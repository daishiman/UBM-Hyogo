# Phase 11 成果物 — リンク / 配線チェックリスト

| 項目 | パス | 状態 |
| --- | --- | --- |
| scheduled() export | `apps/api/src/index.ts` | ✅ runSync を ctx.waitUntil で起動 |
| /admin/sync 配線 | `apps/api/src/index.ts` → `app.route('/admin', adminSyncRoute)` | ✅ |
| Bearer 認証 | `apps/api/src/routes/admin/sync.ts` | ✅ 401/500 を区別 |
| Cron schedule (prod) | `apps/api/wrangler.toml` `[triggers] crons = ["0 */6 * * *"]` | ✅ |
| Cron schedule (staging) | `[env.staging.triggers] crons = ["0 * * * *"]` | ✅ |
| D1 binding | `[[d1_databases]]` / `[[env.staging.d1_databases]]` | ✅ 既存維持 |
| migration | `apps/api/migrations/0002_sync_logs_locks.sql` | ✅ sync_locks / sync_job_logs |
| Secret 注入 | `wrangler secret put` (担当者作業) | ⏳ Secret 登録は人手 |

## ヘルスチェック手順

1. `mise exec -- pnpm typecheck` → 全 PASS
2. `mise exec -- pnpm vitest run apps/api/src` → 22/22 PASS
3. wrangler dev で `/__scheduled` を叩いて 200
4. `/admin/sync` で 401 (誤トークン) / 200 (正トークン) を確認
