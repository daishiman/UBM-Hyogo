# Phase 8 出力: DRY 化

## 1. 目的

09a / 09c と共通化できる用語 / URL 命名 / runbook step を統一し、release-runbook 内の placeholder 表記をひとつのスタイルに揃える。

## 2. Before / After 表

| 種別 | Before | After |
| --- | --- | --- |
| 用語 | "ロールバック" / "rollback" / "戻し" | **`rollback`** に統一 |
| 用語 | "クーロン" / "cron" / "定期実行" | **`cron`** に統一 |
| 用語 | "本番" / "production" | **`production`** に統一（runbook 内） |
| 用語 | "ステージング" / "staging" | **`staging`** に統一 |
| URL | dashboard URL を runbook 各所で再記述 | **`${ANALYTICS_URL_*}` env var** に統一し、release-runbook の冒頭セクションで一覧表示 |
| sanity check | "rollback 後確認" を runbook ごとに重複記述 | **共通 snippet `check-rollback`**（spec のみ、実装は 09c で sh 化） |
| placeholder | "（後で埋める）" / "TBD" / "TODO" / "XXXX" | **`<placeholder>`** で統一 |
| アカウント id | `<account_id>` / `<account>` / `<your-account>` | **`<account>`** に統一 |
| deploy ID | `<deployment_id>` / `<deploy_id>` / `<id>` | **`<deploy_id>`** に統一 |

## 3. URL / env var 命名規則（09a と統一）

| env var | 用途 |
| --- | --- |
| `STAGING_API` | `https://ubm-hyogo-api-staging.<account>.workers.dev` |
| `STAGING_WEB` | `https://ubm-hyogo-web-staging.pages.dev` |
| `STAGING_D1` | `ubm-hyogo-db-staging` |
| `PRODUCTION_API` | `https://ubm-hyogo-api.<account>.workers.dev` |
| `PRODUCTION_WEB` | `https://ubm-hyogo-web.pages.dev` |
| `PRODUCTION_D1` | `ubm-hyogo-db-prod` |
| `ANALYTICS_URL_API_STAGING` | `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api-staging/staging/analytics` |
| `ANALYTICS_URL_API_PRODUCTION` | `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api/production/analytics` |
| `ANALYTICS_URL_D1_STAGING` | `https://dash.cloudflare.com/<account>/d1/databases/ubm-hyogo-db-staging/metrics` |
| `ANALYTICS_URL_D1_PRODUCTION` | `https://dash.cloudflare.com/<account>/d1/databases/ubm-hyogo-db-prod/metrics` |
| `ANALYTICS_URL_PAGES_STAGING` | `https://dash.cloudflare.com/<account>/pages/view/ubm-hyogo-web-staging` |
| `ANALYTICS_URL_PAGES_PRODUCTION` | `https://dash.cloudflare.com/<account>/pages/view/ubm-hyogo-web` |
| `TRIGGER_URL_API_STAGING` | `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api-staging/staging/triggers` |
| `TRIGGER_URL_API_PRODUCTION` | `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api/production/triggers` |

## 4. 共通 snippet

### 4.1 check-rollback（擬似）

```bash
echo "Worker rollback target: ${API_NAME} (${ENV})"
wrangler deployments list --config apps/api/wrangler.toml ${ENV:+--env "$ENV"} | head -5
echo "Pages rollback: Cloudflare Dashboard ${PAGES_NAME} → Deployments → '...' → Rollback"
echo "D1 migration rollback: 後方互換 fix migration（直接 SQL 禁止）"
echo "Cron rollback: wrangler.toml triggers crons=[] 再 deploy（cf.sh deploy 経由）"
```

### 4.2 check-cron（擬似）

```bash
wrangler d1 execute "${D1_NAME}" \
  --command "SELECT id, type, status, started_at FROM sync_jobs ORDER BY started_at DESC LIMIT 5;" \
  --config apps/api/wrangler.toml ${ENV:+--env "$ENV"}
```

### 4.3 check-free-tier（09a と同一）

```bash
echo "Workers analytics: ${ANALYTICS_URL_API_${ENV^^}}"
echo "D1 metrics:       ${ANALYTICS_URL_D1_${ENV^^}}"
echo "Pages dashboard:  ${ANALYTICS_URL_PAGES_${ENV^^}}"
```

### 4.4 check-attendance-integrity（不変条件 #15）

```bash
wrangler d1 execute "${D1_NAME}" \
  --command "SELECT meeting_id, member_id, COUNT(*) c FROM member_attendance WHERE deleted_at IS NULL GROUP BY meeting_id, member_id HAVING c > 1;" \
  --config apps/api/wrangler.toml ${ENV:+--env "$ENV"}
# expected: 0 rows
```

## 5. 用語ゆれ audit

```bash
rg -niw "ロールバック|戻し|クーロン|定期実行|TBD|TODO|XXXX|account_id|deployment_id" \
  docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/outputs/
# expected: 0 hit（用語統一後）
```

本 wave 内で完成版 release-runbook / incident-response-runbook（Phase 12）が上記 After 表記に揃っていることを Phase 9 / Phase 10 で再確認する。

## 6. 完了条件

- [x] Before / After 表完成（9 種）
- [x] URL 命名統一（15 env var）
- [x] 共通 snippet 抽出済み（4 snippet）
- [x] 用語 audit コマンド明記

## 7. 09a / 09c との一致確認

- 09a phase-08 の env var 命名規則と一致（命名 prefix `STAGING_*` / `PRODUCTION_*` / `ANALYTICS_URL_*`）
- 09c の post-release verification は本 env var を import して使用する想定（09c Phase 1 で参照）

## 8. 次 Phase への引き継ぎ

- Phase 9 で secret hygiene + a11y チェック実行時に本 DRY 化結果を grep base にする
- Phase 12 release-runbook / incident-response-runbook で本 env var / snippet を transclude
