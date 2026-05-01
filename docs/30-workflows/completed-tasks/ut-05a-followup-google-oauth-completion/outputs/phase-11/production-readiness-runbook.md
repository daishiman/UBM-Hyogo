# Production Readiness Runbook

## Scope

Staging smoke で手動補正した Google OAuth / response sync / D1 schema の前提を、production でも再現可能にするための確認手順。

## Repo-side changes already encoded

- `apps/web/wrangler.toml`
  - production web worker に `API_SERVICE -> ubm-hyogo-api` service binding を追加。
  - production web worker に `INTERNAL_API_BASE_URL=https://ubm-hyogo-api.daishimanju.workers.dev` を追加。
- `apps/api/wrangler.toml`
  - production D1 binding に `migrations_dir = "migrations"` を明示。
- `apps/web/package.json`
  - `build:cloudflare` 後に `scripts/patch-open-next-worker.mjs` を自動実行。
- `scripts/patch-open-next-worker.mjs`
  - OpenNext 生成 worker に Cloudflare env / service binding / secrets を Auth.js runtime へ渡す bridge を注入。

## Production secrets

production では最低限、次の secret が必要。

### API worker

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production
```

期待:

- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SERVICE_ACCOUNT_JSON`（互換用。コードで不要になれば削除検討）
- `SYNC_ADMIN_TOKEN`
- `INTERNAL_AUTH_SECRET`

### Web worker

```bash
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production
```

期待:

- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `INTERNAL_AUTH_SECRET`

`INTERNAL_AUTH_SECRET` は API / Web で同一値にする。

## Production D1 schema gate

production deploy 前に、少なくとも以下が存在することを確認する。

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --remote \
  --command "SELECT name FROM sqlite_master WHERE type IN ('table','view') ORDER BY name;"
```

必須:

- `member_responses`
- `member_identities`
- `member_status`
- `response_fields`
- `schema_diff_queue`
- `sync_jobs`
- `sync_locks`
- `sync_job_logs`
- `member_tags`
- `tag_assignment_queue`
- `tag_definitions`
- view `members`

`member_responses` の必須列:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --remote \
  --command "PRAGMA table_info(member_responses);"
```

- `response_id`
- `form_id`
- `revision_id`
- `schema_hash`
- `response_email`
- `submitted_at`
- `edit_response_url`
- `answers_json`
- `raw_answers_json`
- `extra_fields_json`
- `unmapped_question_ids_json`
- `search_text`

`member_status` は `member_id` primary key の現行 shape であること:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --remote \
  --command "PRAGMA table_info(member_status);"
```

- `member_id`
- `public_consent`
- `rules_consent`
- `publish_state`
- `is_deleted`
- `hidden_reason`
- `last_notified_at`
- `updated_by`
- `updated_at`

## Migration application

production DB が未初期化または current schema と一致していない場合は、順序を守って migration を適用する。

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --remote --env production
```

既存 production DB に legacy schema drift がある場合、`CREATE TABLE IF NOT EXISTS` migration だけでは shape は直らない。`PRAGMA table_info` の結果を確認し、必要なら専用 repair migration を作ってから適用する。

## Response sync

production の `apps/api/wrangler.toml` は `*/15 * * * *` で response sync を実行する。手動確認:

```bash
curl -i -X POST \
  "https://ubm-hyogo-api.daishimanju.workers.dev/admin/sync/responses?fullSync=true" \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"
```

期待:

- HTTP 200
- `result.status=succeeded`
- `processedCount > 0`

## OAuth callback smoke

production web deploy 後:

```bash
bash scripts/cf.sh tail ubm-hyogo-web-production --format pretty
```

Google login 後の期待ログ:

```text
[auth] session-resolve url { ..., transport: 'service-binding' }
[auth] session-resolve response { status: 200 }
[auth] session-resolve result { hasMemberId: true, gateReason: null }
```

## Known follow-up

Staging では Forms response sync が `rules_consent/public_consent` を `unknown` で上書きした。production で同じ事象を避けるには、Form schema alias / consent mapper が実フォーム回答を `consented` として解決できることを production full sync 前に確認する。
