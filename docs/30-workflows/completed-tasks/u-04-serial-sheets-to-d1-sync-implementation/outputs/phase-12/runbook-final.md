# u-04 Sync Runbook（最終版）

Phase 10 `sync-runbook.md` を最終版へ昇格。manual / scheduled / backfill の 3 経路と失敗時 recovery / 禁止事項を網羅。

## 共通前提

- すべての Cloudflare CLI 操作は **`bash scripts/cf.sh` 経由**（UBM-012）。`wrangler` 直接実行は禁止。
- Bearer token は **1Password** から `op://` 参照経由で注入（`.env` に実値を書かない）。
- staging 反映は co-owner 09b へ事前通知（cron 改変時）。

## 1. Manual sync（オペレータ起動）

```bash
# local
mise exec -- pnpm --filter @ubm-hyogo/api dev    # ターミナル A
curl -s -X POST http://localhost:8787/admin/sync/run \
  -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN}" \
  -H "Content-Type: application/json"            # ターミナル B
# 期待: 200 + { ok:true, result:{ status:"success", auditId, fetched, upserted, ... } }

# staging
curl -s -X POST https://api-staging.<host>/admin/sync/run \
  -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN_STAGING}"
```

事後確認:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging \
  --command "SELECT id, trigger, status, started_at, finished_at, fetched, upserted, retry_count
             FROM sync_job_logs ORDER BY id DESC LIMIT 1" \
  --env staging
```

## 2. Scheduled sync（Cron Trigger 自動）

cron 表現は `apps/api/wrangler.toml` の `[triggers] crons` で管理（既定 `0 * * * *`）。

確認手順:

```bash
# 直近 24h の scheduled 実行
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging \
  --command "SELECT trigger, status, COUNT(*) FROM sync_job_logs
             WHERE started_at >= datetime('now','-1 day')
             GROUP BY trigger, status" \
  --env staging
```

手動発火（staging で動作検証する場合）:

```bash
# A) wrangler dispatch（推奨）
bash scripts/cf.sh dispatch --config apps/api/wrangler.toml --env staging --cron "0 * * * *"

# B) cron 一時短縮代替（A が失敗した場合の TECH-M-04 fallback）
#    wrangler.toml の [triggers] crons を一時的に ["* * * * *"] に変更
#    bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
#    → 1 分待機 → audit ledger 確認 → 元に戻して再 deploy
```

## 3. Backfill（admin 起動）

Sheets を真として全件 reload。admin 列（publish_state, is_deleted, meeting_sessions）は touch しない。

```bash
# before snapshot（admin 列温存確認）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging \
  --command "SELECT member_id, publish_state, is_deleted FROM member_status" \
  --env staging --json > before.json

# backfill 実行
curl -s -X POST https://api-staging.<host>/admin/sync/backfill \
  -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN_STAGING}"

# after snapshot
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging \
  --command "SELECT member_id, publish_state, is_deleted FROM member_status" \
  --env staging --json > after.json

diff before.json after.json
# 期待: 差分なし
```

## 4. Audit ledger 参照

```bash
# API 経由（top N）
curl -s "http://localhost:8787/admin/sync/audit?limit=20" \
  -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN}"

# 直近 7 日の差分推移
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging \
  --command "SELECT date(started_at) AS d, SUM(fetched) AS f, SUM(upserted) AS u, SUM(failed) AS x
             FROM sync_job_logs WHERE started_at >= datetime('now','-7 day')
             GROUP BY d ORDER BY d" --env staging
```

## 5. 失敗時 recovery

| 症状 | 一次対応 | 恒久対応 |
| --- | --- | --- |
| status='running' が 30 分以上残留 | mutex 強制解放（下記） | 09b alert 設計 |
| 429 / 5xx で failed 連発 | 1 回手動再実行で復帰確認、ダメなら secret 再配置 | rate limit 緩和申請（GCP） |
| 401 sheets_unauthorized | `GOOGLE_SERVICE_ACCOUNT_JSON` 再配置（cf secret put） | 1Password の rotation 周期確認 |
| mapping_unmapped 多発 | `form_field_aliases` を確認し、追加 alias を 07b へ relay | 07b form schema diff 受入 |

### mutex 強制解放（運用者専用）

```bash
# 1) 残留 running を確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging \
  --command "SELECT id, trigger, started_at FROM sync_job_logs WHERE status='running'" \
  --env staging

# 2) 該当 row を skipped に finalize（手動）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging \
  --command "UPDATE sync_job_logs SET status='skipped', finished_at=datetime('now'),
             error_class='mutex_held', error_reason='manual recovery'
             WHERE id='<id>'" --env staging

# 3) sync_locks の解放
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging \
  --command "DELETE FROM sync_locks WHERE name='sync'" --env staging
```

## 6. Rollback

```bash
# 直近の安定版に戻す
bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env staging
# Cron は wrangler.toml に書かれているため、rollback で cron 表現も自動復元
```

## 7. 禁止事項

- `wrangler` を `scripts/cf.sh` を介さず直接実行する
- `.env` に API token 等の実値を書く
- `apps/web` から D1 へ直接アクセスする（不変条件 #5 違反）
- `member_status` の admin 列（publish_state / is_deleted / meeting_sessions）を sync 経路で更新する（不変条件 #4 違反）
- `googleapis` / `google-auth-library` 等の Node 専用 SDK を導入する（不変条件 #6 違反）
- production cron 表現を staging で先行検証せずに変更する（co-owner 09b 事前通知）
