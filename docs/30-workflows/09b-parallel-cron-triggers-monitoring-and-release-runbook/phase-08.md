# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09b-parallel-cron-triggers-monitoring-and-release-runbook |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

09a / 09c と共通化できる用語 / URL 命名 / runbook step を統一し、release runbook 内の placeholder 表記をひとつのスタイルに揃える。

## 実行タスク

1. Before / After 表
2. URL 命名統一（09a と同じ env var 名）
3. 共通 snippet 抽出
4. 用語 audit

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-08.md | 用語 / URL 命名（同期） |
| 必須 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-05.md | runbook |
| 必須 | docs/30-workflows/02-application-implementation/09c-serial-production-deploy-and-post-release-verification/ | 共通化対象 |

## 実行手順

### ステップ 1: Before / After 表

### ステップ 2: URL 命名統一

### ステップ 3: 共通 snippet 抽出

### ステップ 4: 用語 audit

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化結果を品質チェックに反映 |
| 並列 09a | 用語 / URL 命名統一 |
| 下流 09c | 共通 snippet を再利用 |

## 多角的チェック観点（不変条件）

- 共通 sanity check に「web bundle に D1 import なし」「Cloudflare Analytics URL」を含める

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Before / After 表 | 8 | pending | 用語 / path / endpoint |
| 2 | URL 命名統一 | 8 | pending | 09a と同じ env var |
| 3 | 共通 snippet 抽出 | 8 | pending | wrangler / curl |
| 4 | 用語 audit | 8 | pending | rg で揺れ検出 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果 |
| メタ | artifacts.json | Phase 8 を completed に更新 |

## 完了条件

- [ ] Before / After 表完成
- [ ] URL 命名統一
- [ ] 共通 snippet 抽出済み
- [ ] 用語ゆれ 0

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 用語ゆれ 0
- artifacts.json の phase 8 を completed に更新

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: DRY 化 snippet と URL 命名
- ブロック条件: 用語ゆれ残存で次 Phase に進まない

## Before / After 表

| 種別 | Before | After |
| --- | --- | --- |
| 用語 | "ロールバック" / "rollback" / "戻し" | `rollback` に統一 |
| 用語 | "クーロン" / "cron" / "定期実行" | `cron` に統一 |
| URL | dashboard URL を runbook 各所で再記述 | `${ANALYTICS_URL_*}` env var に統一して `outputs/phase-08/env-vars.md` に集約 |
| sanity check | "rollback 後確認" を runbook ごとに重複記述 | 共通 snippet `check-rollback.sh`（spec のみ） |
| placeholder | "（後で埋める）" / "TBD" / "TODO" | `<placeholder>` で統一 |

## URL / env var 命名規則（09a と統一）

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

## 共通 snippet

### check-rollback（擬似）

```bash
echo "Worker rollback target: ${API_NAME} (${ENV})"
wrangler deployments list --config apps/api/wrangler.toml --env "${ENV}" | head -5
echo "Pages rollback: Cloudflare Dashboard ${PAGES_NAME} → Deployments"
```

### check-cron（擬似）

```bash
wrangler d1 execute "${D1_NAME}" \
  --command "SELECT id, type, status, started_at FROM sync_jobs ORDER BY started_at DESC LIMIT 5;" \
  --config apps/api/wrangler.toml ${ENV:+--env "$ENV"}
```

### check-free-tier（09a と同一）

```bash
echo "Workers: ${ANALYTICS_URL_API_${ENV^^}}"
echo "D1: ${ANALYTICS_URL_D1_${ENV^^}}"
```

## 用語ゆれ audit 結果

```bash
rg -niw "ロールバック|戻し|クーロン|定期実行|TBD|TODO" docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/
# expected: 0 hit（用語統一後）
```
