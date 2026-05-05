# u-04 sync layer runbook

## 概要

manual / scheduled / backfill の 3 経路で Google Sheets → Cloudflare D1 同期を実行する。物理 audit テーブルは `sync_job_logs`、mutex は `sync_locks`。

## 事前条件

- D1 migration 完了 (`sync_job_logs`, `sync_locks`, `member_responses`, `member_identities`, `member_status`, `form_field_aliases`)
- Cloudflare Secrets / Vars 設定:
  - `GOOGLE_SERVICE_ACCOUNT_JSON` (or `GOOGLE_SHEETS_SA_JSON`)
  - `SHEETS_SPREADSHEET_ID`
  - `SYNC_ADMIN_TOKEN`
- 1Password 正本に `SYNC_ADMIN_TOKEN` 値が存在 (記録は op 参照のみ)

## 1. manual sync

```bash
# Bearer は 1Password から (値はログに残さない)
TOKEN="$(op read 'op://Vault/UBM-API/SYNC_ADMIN_TOKEN')"
curl -X POST "https://<api-host>/admin/sync/run" \
  -H "Authorization: Bearer $TOKEN" \
  -H "content-type: application/json"
```

期待レスポンス: `{ "ok": true, "result": { "auditId": "...", "status": "success", "fetched": N, "upserted": N, ... } }`

確認: `GET /admin/sync/audit?limit=1` で trigger=manual / status=success 確認。

## 2. scheduled sync

- Cloudflare Cron Trigger で毎時 0 分に `runScheduledSync(env)` を起動
- `wrangler.toml` `[triggers] crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]`
- デプロイ: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production`
- 起動確認: Cloudflare Dashboard → Workers → ubm-hyogo-api → Triggers / Logs

## 3. backfill (truncate-and-reload)

```bash
# 事前バックアップ
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output backup-$(date +%Y%m%d).sql

# backfill 実行
TOKEN="$(op read 'op://Vault/UBM-API/SYNC_ADMIN_TOKEN')"
curl -X POST "https://<api-host>/admin/sync/backfill" \
  -H "Authorization: Bearer $TOKEN"
```

完了確認: `member_responses` 全件再書込、`member_status.publish_state` / `is_deleted` / `hidden_reason` は不変。

## 4. rollback

```bash
bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production
```

## 5. 禁止事項

- `wrangler` を直接呼ばない (必ず `bash scripts/cf.sh` 経由)
- `.env` の中身を `cat` / `Read` / `grep` で表示しない
- sync 経路で `member_status.publish_state` / `is_deleted` / `hidden_reason` / `meeting_sessions` / `member_attendance` 列を書き換えない (不変条件 #4)
- apps/web から D1 に直接アクセスしない (不変条件 #5)
- `googleapis` / `node:*` import を sync 配下で使わない (不変条件 #6)
