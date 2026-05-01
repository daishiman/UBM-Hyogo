# cron-deployment-runbook

Workers Cron Triggers の deploy / 確認 / 一時停止 / 再開を staging / production 共通の手順で固定する。
docs-only / spec_created のため、本タスクでは wrangler.toml を変更せず仕様書として記録する。
実コマンドは `bash scripts/cf.sh` ラッパー経由（CLAUDE.md 準拠、wrangler 直接実行は禁止）。

## 09b / 09c の境界

09b は current facts と実行手順を固定する docs-only タスクであり、ここにある deploy / disable / rollback コマンドは **09c または緊急運用で実行する手順**である。09b Phase 12 では `apps/api/wrangler.toml`、Cloudflare 設定、D1 データを変更しない。

## 前提

- mise 経由で Node 24 / pnpm 10 環境（`mise exec --` 自動付与は `cf.sh` 内）
- Cloudflare API Token は 1Password 経由で `.env` に `op://` 参照のみ（実値非平文）
- 本 runbook は staging を `--env staging`、production を `--env production` と表記。production default と `--env production` の DB は同じ `ubm-hyogo-db-prod`

## DB / binding / command target 対応表

| 環境 | Worker | DB binding | D1 `database_name` | wrangler command target |
| --- | --- | --- | --- | --- |
| staging | `ubm-hyogo-api-staging` | `DB` | `ubm-hyogo-db-staging` | `ubm-hyogo-db-staging --env staging` |
| production | `ubm-hyogo-api` | `DB` | `ubm-hyogo-db-prod` | `ubm-hyogo-db-prod --env production` |

## Step 1: wrangler.toml `[triggers]` 仕様

```toml
# apps/api/wrangler.toml（current facts、09b では変更しない）
name = "ubm-hyogo-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-staging"
database_id = "<production_database_id>"

[triggers]
crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]

[env.production]
name = "ubm-hyogo-api"

[[env.production.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-prod"
database_id = "<production_database_id>"

[env.staging]
name = "ubm-hyogo-api-staging"

[[env.staging.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-staging"
database_id = "<staging_database_id>"

[env.staging.triggers]
crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]

[env.production.triggers]
crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]
```

### sanity check

- cron expression が 5 フィールド（`分 時 日 月 曜日`）であること
- staging（`[triggers]`）と production（`[env.production.triggers]`）双方に同一表記
- `apps_script` / `google.script` 等の文字列が一切ない（不変条件 #6）

```bash
rg '^\s*crons\s*=' apps/api/wrangler.toml
# expected: 2 hit
rg -i 'apps_script|google\.script' apps/api/wrangler.toml
# expected: 0 hit
```

### 差し戻し

- cron 表記が 5 フィールドでない / `[env.production.triggers]` が漏れている → wrangler.toml 修正後 Phase 5 sanity に戻る

## Step 2: deploy 後の trigger 確認

```bash
# staging
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
wrangler deployments list --config apps/api/wrangler.toml --env staging | head -5

# production
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
wrangler deployments list --config apps/api/wrangler.toml --env production | head -5

# Cloudflare Dashboard で Triggers タブを目視確認
# staging:    https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api-staging/staging/triggers
# production: https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api/production/triggers
```

### sanity check

- `wrangler deployments list` の最新行が今 deploy したものであること
- Dashboard の Triggers タブで cron 3 件（`0 * * * *`, `*/15 * * * *`, `0 18 * * *`）が表示されること

### 差し戻し

- cron が表示されない → `bash scripts/cf.sh deploy --config apps/api/wrangler.toml [--env production]` を再実行
- それでも表示されない → wrangler.toml の `[env.production.triggers]` が漏れている疑い、Step 1 へ戻る

## Step 3: 二重起動防止確認（sync_jobs running guard）

```bash
# staging
wrangler d1 execute ubm-hyogo-db-staging \
  --command "SELECT id, type, status, started_at FROM sync_jobs WHERE status='running';" \
  --config apps/api/wrangler.toml --env staging

# production
wrangler d1 execute ubm-hyogo-db-prod \
  --command "SELECT id, type, status, started_at FROM sync_jobs WHERE status='running';" \
  --config apps/api/wrangler.toml --env production
```

### sanity check

- `running` 行が 0 件、または直近 30 分以内の started_at の active な job のみ
- 30 分以上前の `running` は stale であり以下で復旧:

```sql
UPDATE sync_jobs
SET status = 'failed', error = 'timeout: stale running cleared by runbook'
WHERE status = 'running' AND started_at < datetime('now', '-30 minutes');
```

### 差し戻し

- 古い running が残ってる → 上記 UPDATE で clear。recurrence する場合は 03b（response sync）へ差し戻し

## Step 4: cron 一時停止（incident 時）

優先順位: 方法 A（再 deploy）> 方法 B（Dashboard 手動）。CI/履歴に残るため A を推奨。

### 方法 A: wrangler.toml の `[triggers]` を空に再 deploy

```toml
# apps/api/wrangler.toml の該当箇所を以下に変更
[triggers]
crons = []

[env.production.triggers]
crons = []
```

```bash
# staging
bash scripts/cf.sh deploy --config apps/api/wrangler.toml
# production
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

### 方法 B: Cloudflare Dashboard で個別 trigger を disable

```text
Cloudflare Dashboard
→ Workers & Pages
→ ubm-hyogo-api / ubm-hyogo-api-staging
→ Settings → Triggers → 各 cron の "Disable"
```

### sanity check

- Dashboard の Triggers タブで cron 0 件（または all disabled）
- 15 分待機後、`SELECT MAX(started_at) FROM sync_jobs;` で値が更新されていない

### 差し戻し

- cron が止まらない → wrangler.toml の env が staging/production で混在していないか確認。`--env` 指定誤りも疑う
- 方法 B 後に `wrangler deploy` を実行すると Disable がリセットされる場合があるため、停止中は deploy しない

## Step 5: cron 再開

```toml
# wrangler.toml の crons を元に戻す
[triggers]
crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]

[env.production.triggers]
crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]
```

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

### sanity check

- 次の `*/15` 周期で sync_jobs に新規 running が出現
- 再開後 30 分以内に少なくとも 1 件 success が記録される

## Step 6: cron 単発手動実行（runbook 走破 / 障害復旧）

cron を直接 trigger するのではなく、admin endpoint 経由で sync を起動する（04c 仕様）。

```bash
# schema sync
curl -X POST https://ubm-hyogo-api.<account>.workers.dev/admin/sync/schema \
  -H "Authorization: Bearer <admin_token>"
# response sync
curl -X POST https://ubm-hyogo-api.<account>.workers.dev/admin/sync/responses \
  -H "Authorization: Bearer <admin_token>"
```

### sanity check

- HTTP 200 / 202
- sync_jobs に新規 row 1 件追加、`status='running'` → `success` に遷移

## 不変条件チェック

| 不変条件 | 本 runbook での対応 |
| --- | --- |
| #5 apps/web → D1 直接禁止 | 本 runbook の D1 操作はすべて `--config apps/api/wrangler.toml` 経由。apps/web 経由のコマンドはなし |
| #6 GAS prototype 昇格しない | apps script trigger を使う手順なし。Workers Cron Triggers 限定 |
| #10 Cloudflare 無料枠 | 121 req/day（Phase 9）、cron 一時停止/再開を含めても無料枠 0.121% 内 |
| #15 attendance 重複防止 / 削除済み除外 | rollback 時の attendance 整合性 SQL は rollback-procedures.md（Phase 6）に記載 |

## 改訂履歴

| 日付 | 内容 |
| --- | --- |
| 2026-04-26 | 初版（Phase 5 で擬似 → docs-only 確定） |
