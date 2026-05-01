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

docs-only / NON_VISUAL タスクとして、実測 screenshot や Cloudflare 操作を要求せず、runbook の手動確認計画とリンク整合を `outputs/phase-11/manual-smoke-log.md` / `outputs/phase-11/link-checklist.md` に保存する。

## 実行タスク

1. NON_VISUAL 判定と screenshot N/A 根拠を記録
2. cron trigger 確認コマンドを manual-smoke-log テンプレートへ整理
3. rollback / rollforward 手順を実行前 checklist として整理
4. dashboard URL placeholder と参照リンクを link-checklist に記録
5. Phase 12 へ渡す manual evidence checklist を完成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-05.md | runbook |
| 必須 | docs/30-workflows/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-11/ | staging URL / sync_jobs id |

## 実行手順

### ステップ 1: NON_VISUAL 判定
- 本タスクは docs-only / workflow_state=spec_created のため screenshot を要求しない
- runtime 実測は 09a / 09c または後続実行タスクに委譲する

### ステップ 2: manual-smoke-log.md テンプレート
- cron trigger 確認コマンド、rollback 手順、sync_jobs 確認 SQL を「実行予定」として記録

### ステップ 3: link-checklist.md
- Workers / D1 / Pages dashboard placeholder と 09a / 09c 引き渡しリンクを確認

### ステップ 4: runbook 走破 checklist

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
| 1 | NON_VISUAL 判定 | 11 | pending | screenshot N/A |
| 2 | manual-smoke-log | 11 | pending | 実行予定コマンド |
| 3 | link-checklist | 11 | pending | placeholder / link |
| 4 | runbook 走破 checklist | 11 | pending | cron-deployment / release / incident |
| 5 | manual evidence checklist | 11 | pending | 全項目 ✓ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke サマリ |
| 証跡 | outputs/phase-11/manual-smoke-log.md | NON_VISUAL 手動確認ログ |
| 証跡 | outputs/phase-11/link-checklist.md | dashboard / runbook link checklist |
| メタ | artifacts.json | Phase 11 を completed に更新 |

## 完了条件

- [ ] NON_VISUAL 判定と screenshot N/A 根拠を保存
- [ ] manual-smoke-log.md 完成
- [ ] link-checklist.md 完成
- [ ] runbook 走破 checklist 完成

## タスク100%実行確認【必須】

- 全実行タスクが completed
- main.md + manual-smoke-log.md + link-checklist.md 配置
- artifacts.json の phase 11 を completed に更新

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: manual-smoke-log / link-checklist
- ブロック条件: evidence 欠落で次 Phase に進まない

## manual-smoke-log.md（テンプレ）

```text
# cron triggers list（staging）
$ wrangler deployments list --config apps/api/wrangler.toml | head -3
Created    Author          Source     Deployment ID
2026-04-26 ci@github       Upload     <id>

# Cloudflare Dashboard:
- ANALYTICS_URL_API_STAGING の "Triggers" タブで `0 * * * *`、`0 18 * * *`、`*/15 * * * *` を確認する手順を記録
- docs-only / NON_VISUAL のため screenshot は取得しない

# sync_jobs（cron 起動後）
$ wrangler d1 execute ubm-hyogo-db-staging \
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
| ANALYTICS_URL_API_STAGING | placeholder 確認 |
| ANALYTICS_URL_API_PRODUCTION | placeholder 確認 |
| ANALYTICS_URL_D1_STAGING | placeholder 確認 |
| ANALYTICS_URL_D1_PRODUCTION | placeholder 確認 |
| Pages staging dashboard | placeholder 確認 |
| Pages production dashboard | placeholder 確認 |

## manual evidence checklist

- [ ] screenshot N/A 根拠
- [ ] cron triggers list の実行予定コマンド
- [ ] rollback / rollforward 手順
- [ ] 6 dashboard URL placeholder
- [ ] sync_jobs SELECT 実行予定 SQL
- [ ] attendance 重複確認 SQL
- [ ] runbook 走破 checklist（cron-deployment / release / incident）
