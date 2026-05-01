# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09a-parallel-staging-deploy-smoke-and-forms-sync-validation |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

staging-only の用語 / path / endpoint / runbook step が production（09c）と重複しているため、共通部品（command snippet / URL 命名 / sanity check）を `09a` と `09c` で再利用できる形に整理する。同時に 09b の release runbook と用語を統一する。

## 実行タスク

1. Before / After 表で「09a 固有 vs 09a/09c 共通」を分離
2. URL 命名規則（`<env>-<resource>` 形式）を統一
3. 共通 sanity check を `outputs/phase-08/main.md` に切り出す
4. 用語ゆれを修正（例: "ステージング" / "staging" / "stg" の混在を排除）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-05.md | runbook |
| 必須 | docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/ | release runbook（用語統一） |
| 必須 | docs/30-workflows/02-application-implementation/09c-serial-production-deploy-and-post-release-verification/ | production runbook（共通化対象） |

## 実行手順

### ステップ 1: Before / After 表
- 用語 / 命名 / path / endpoint / runbook step

### ステップ 2: URL 命名統一
- `<env>-<resource>`: `staging-api` / `production-api` / `staging-web` / `production-web`

### ステップ 3: 共通 snippet 抽出
- wrangler / curl / pnpm の共通部分を共通化

### ステップ 4: 用語 audit
- "ステージング", "staging", "stg" 等の揺れを `staging` に統一

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化結果を品質チェックリストに反映 |
| 並列 09b | 用語と URL 命名を統一 |
| 下流 09c | DRY 化された snippet を production runbook で再利用 |

## 多角的チェック観点（不変条件）

- 不変条件 #5: 共通 sanity check に「apps/web に D1 import 不在」を含める
- 不変条件 #10: 共通 sanity check に「Cloudflare Analytics URL」を含める

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Before / After 表作成 | 8 | pending | 用語 / path / endpoint |
| 2 | URL 命名統一 | 8 | pending | `<env>-<resource>` |
| 3 | 共通 snippet 抽出 | 8 | pending | wrangler / curl |
| 4 | 用語 audit | 8 | pending | rg で揺れ検出 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果 |
| メタ | artifacts.json | Phase 8 実行時に artifacts.json を更新 |

## 完了条件

- [ ] Before / After 表が完成
- [ ] URL 命名が統一
- [ ] 共通 snippet が抽出済み

## タスク100%実行確認【必須】

- 全実行タスクが実行時に完了条件を満たす
- 用語ゆれ 0 件
- artifacts.json の phase 8 は実行時に更新

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: DRY 化された snippet と URL 命名規則
- ブロック条件: 用語ゆれが 1 件でも残れば次 Phase に進まない

## Before / After 表

| 種別 | Before | After |
| --- | --- | --- |
| 用語 | "ステージング", "staging", "stg", "stagging" | `staging` に統一 |
| 用語 | "本番", "production", "prod" | `production` に統一 |
| URL | `https://ubm-hyogo-api-staging.<account>.workers.dev` を runbook 各所で再記述 | `${STAGING_API}` env var に統一して `outputs/phase-08/env-vars.md` で定義 |
| URL | 同上 web | `${STAGING_WEB}` に統一 |
| endpoint | `POST /admin/sync/schema`, `/admin/sync/responses` を curl 例ごとに full URL | `${STAGING_API}/admin/sync/schema` のように env var プレフィックス |
| sanity check | "deploy 完了確認" / "smoke 確認" / "monitoring 確認" | 共通 snippet `check-deploy-status.sh` / `check-smoke.sh` / `check-free-tier.sh`（spec のみ） |
| smoke 手順 | 10 ページ URL を runbook 内に直書き | `outputs/phase-08/smoke-pages.md` に切り出し、09c でも参照 |

## 共通 snippet

### check-deploy-status（擬似）

```bash
curl -sI "${BASE_URL}" | head -1
curl -sI "${API_BASE_URL}/public/stats" | head -1
```

### check-sync-jobs（擬似）

```bash
wrangler d1 execute "${D1_NAME}" \
  --command "SELECT id, type, status, started_at, finished_at, error FROM sync_jobs ORDER BY started_at DESC LIMIT 5;" \
  --config apps/api/wrangler.toml
```

### check-free-tier（擬似）

```bash
echo "Workers: https://dash.cloudflare.com/${ACCOUNT_ID}/workers/services/view/${API_NAME}/${ENV}/analytics"
echo "D1: https://dash.cloudflare.com/${ACCOUNT_ID}/d1/databases/${D1_NAME}/metrics"
```

### check-d1-import-in-web

```bash
rg -n "D1Database|env\.DB" apps/web/.vercel/output || echo "OK"
```

## URL / env var 命名規則

| env var | 用途 |
| --- | --- |
| `STAGING_API` | `https://ubm-hyogo-api-staging.<account>.workers.dev` |
| `STAGING_WEB` | `https://ubm-hyogo-web-staging.pages.dev` |
| `STAGING_D1` | `ubm_hyogo_staging` |
| `PRODUCTION_API` | `https://ubm-hyogo-api.<account>.workers.dev` |
| `PRODUCTION_WEB` | `https://ubm-hyogo-web.pages.dev` |
| `PRODUCTION_D1` | `ubm_hyogo_production` |

## 用語ゆれ audit 結果

```bash
rg -niw "stg|stagging|本番系|prod系" docs/30-workflows/09*/
# expected: 0 hit
```
