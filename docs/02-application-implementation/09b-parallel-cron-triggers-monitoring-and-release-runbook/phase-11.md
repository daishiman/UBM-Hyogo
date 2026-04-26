# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09b-parallel-cron-triggers-monitoring-and-release-runbook |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

cron trigger / rollback / 監視 dashboard の存在 / runbook 走破を staging 環境で人が確認し、evidence を `outputs/phase-11/cron-trigger-evidence.md` に保存する。

## 実行タスク

1. cron trigger 動作 evidence を取得
2. rollback 手順を staging で 1 回試走
3. dashboard URL 一覧を click 確認
4. runbook 走破 evidence
5. manual evidence checklist

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-05.md | runbook |
| 必須 | doc/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-11/ | staging URL / sync_jobs id |

## 実行手順

### ステップ 1: cron trigger evidence
- `wrangler triggers list` 出力 / Cloudflare Dashboard screenshot

### ステップ 2: rollback 試走（staging）
- 直前 deploy id で worker rollback → URL 確認 → 元 deploy へ rollforward

### ステップ 3: dashboard URL click 確認
- 6 URL（Workers staging/prod, D1 staging/prod, Pages staging/prod）

### ステップ 4: runbook 走破 evidence

### ステップ 5: manual evidence checklist

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | release runbook の "過去実績" として参照 |
| 並列 09a | staging URL / sync_jobs id の整合性確認 |
| 下流 09c | rollback 手順の信頼性を引き渡す |

## 多角的チェック観点（不変条件）

- #5: rollback 試走で web に D1 操作なし
- #10: dashboard で staging req 数を確認
- #15: rollback 後 attendance 整合性 SELECT で 0 重複

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | cron trigger evidence | 11 | pending | wrangler / dashboard |
| 2 | rollback 試走 | 11 | pending | staging worker |
| 3 | dashboard URL click | 11 | pending | 6 URL |
| 4 | runbook 走破 | 11 | pending | cron-deployment / release / incident |
| 5 | manual evidence checklist | 11 | pending | 全項目 ✓ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke サマリ |
| 証跡 | outputs/phase-11/cron-trigger-evidence.md | cron 動作 evidence |
| メタ | artifacts.json | Phase 11 を completed に更新 |

## 完了条件

- [ ] cron evidence 保存
- [ ] rollback 試走 evidence
- [ ] 6 dashboard URL all 200
- [ ] runbook 走破 evidence

## タスク100%実行確認【必須】

- 全実行タスクが completed
- evidence 配置
- artifacts.json の phase 11 を completed に更新

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: cron-trigger-evidence / rollback 試走 log
- ブロック条件: evidence 欠落で次 Phase に進まない

## cron-trigger-evidence（テンプレ）

```text
# cron triggers list（staging）
$ wrangler deployments list --config apps/api/wrangler.toml | head -3
Created    Author          Source     Deployment ID
2026-04-26 ci@github       Upload     <id>

# Cloudflare Dashboard screenshot:
- ANALYTICS_URL_API_STAGING の "Triggers" タブで `*/15 * * * *` と `0 3 * * *` を確認
- screenshot を outputs/phase-11/dashboard-cron-triggers-staging.png に保存

# sync_jobs（cron 起動後）
$ wrangler d1 execute ubm_hyogo_staging \
    --command "SELECT id, type, status, started_at FROM sync_jobs ORDER BY started_at DESC LIMIT 3;" \
    --config apps/api/wrangler.toml
[
  {"id": 123, "type": "responses", "status": "success", "started_at": "..."}
]
```

## rollback 試走（staging worker）

```text
# 直前 deploy
$ wrangler deployments list --config apps/api/wrangler.toml | head -5

# rollback
$ wrangler rollback <prev_id> --config apps/api/wrangler.toml
$ curl -sI https://ubm-hyogo-api-staging.<account>.workers.dev/public/stats | head -1
HTTP/2 200

# rollforward
$ wrangler rollback <latest_id> --config apps/api/wrangler.toml
$ curl -sI https://ubm-hyogo-api-staging.<account>.workers.dev/public/stats | head -1
HTTP/2 200
```

## dashboard URL click 確認

| URL | 結果 |
| --- | --- |
| ANALYTICS_URL_API_STAGING | 200 |
| ANALYTICS_URL_API_PRODUCTION | 200（access 権限あり） |
| ANALYTICS_URL_D1_STAGING | 200 |
| ANALYTICS_URL_D1_PRODUCTION | 200 |
| Pages staging dashboard | 200 |
| Pages production dashboard | 200 |

## manual evidence checklist

- [ ] cron triggers list の出力 / dashboard screenshot
- [ ] rollback / rollforward log
- [ ] 6 dashboard URL の click 結果（screenshot）
- [ ] sync_jobs SELECT 結果
- [ ] attendance 重複確認 SQL の結果（0 行）
- [ ] runbook 走破 log（cron-deployment / release / incident）
