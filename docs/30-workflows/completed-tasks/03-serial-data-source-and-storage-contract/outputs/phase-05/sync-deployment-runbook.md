# Phase 5 / sync-deployment-runbook.md — sync worker deploy runbook

## 対象

- ランタイム: Cloudflare Workers (`apps/api`, Hono)
- sync エントリ: manual / scheduled / backfill
- secret: `GOOGLE_SERVICE_ACCOUNT_JSON`（Cloudflare Secrets が canonical）
- 1Password Environments がローカル正本

## 1. secret 登録

```bash
# staging
wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging
# stdin に 1Password から取得した service account JSON 全文を貼り付け

# production（top-level env）
wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON
```

確認:

```bash
wrangler secret list --env staging
# 期待: GOOGLE_SERVICE_ACCOUNT_JSON が表示
```

## 2. 環境変数（vars / 非機密）

`apps/api/wrangler.toml`:

```toml
[vars]
SHEET_ID = "<formId 紐付き spreadsheetId>"   # 非機密、GitHub Variables から CI 注入も可
SYNC_BATCH_SIZE = "100"
SYNC_RETRY_MAX = "3"
SYNC_RETRY_BASE_MS = "1000"
SYNC_TIMEOUT_MS = "30000"
SYNC_SCHEDULE_CRON = "0 * * * *"
```

実値はコミット禁止。GitHub Variables / 1Password から CI で注入。

## 3. sync worker 配置（apps/api/src/sync/）

| ファイル | 役割 |
| --- | --- |
| `client.ts` | Sheets API fetch クライアント。401/403/429/5xx 切り分け |
| `mapping.ts` | Sheets row → D1 row 変換、consent 正規化（不変条件 2/3） |
| `runner.ts` | manual / scheduled / backfill エントリ |
| `audit.ts` | sync_audit へ run 追記 |

不変条件 5: 上記は `apps/api` のみに存在し `apps/web` からは import されない。

## 4. route / scheduled handler 登録

`apps/api/src/index.ts` 抜粋方針:

```ts
app.post('/admin/sync/manual', adminAuth, manualSync);
app.post('/admin/sync/backfill', adminAuth, backfill);

export default {
  fetch: app.fetch,
  scheduled: scheduledSync,  // wrangler triggers.crons
};
```

## 5. deploy

```bash
# staging
wrangler deploy --env staging

# production（Phase 11 smoke 後）
wrangler deploy
```

## 6. cron 確認

```bash
wrangler triggers list --env staging
# 期待: cron "0 * * * *"
```

## 7. smoke（Phase 4 verification-commands.md と接続）

```bash
# manual trigger（admin endpoint）
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://ubm-hyogo-api.staging.workers.dev/admin/sync/manual"

# audit 確認
wrangler d1 execute ubm-hyogo-db-staging --env staging \
  --command "select audit_id, status, failed_reason, inserted_count from sync_audit order by started_at desc limit 5"
```

## 8. rollback

- 直前 deploy に戻す: `wrangler rollback --env staging`
- secret 失効時: `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging` で再投入
- D1 復旧は `d1-bootstrap-runbook.md §6/§7` 参照

## 9. sanity check

- [ ] Cloudflare Secrets に実値、GitHub Secrets / Variables との混線なし
- [ ] apps/web に Sheets API / D1 アクセスがないこと（不変条件 5）
- [ ] consent / responseEmail の取扱が mapping.ts で不変条件 2/3 を満たす
- [ ] GAS prototype のロジックが apps/api に持ち込まれていない（不変条件 6）

## 10. 参照

- migration: `d1-bootstrap-runbook.md`
- 異常系: `outputs/phase-06/failure-cases.md`
- 設計: `outputs/phase-02/sync-flow.md`
