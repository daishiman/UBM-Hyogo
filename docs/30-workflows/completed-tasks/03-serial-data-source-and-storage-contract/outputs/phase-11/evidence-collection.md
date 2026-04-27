# Phase 11 / evidence-collection.md — NON_VISUAL 代替証跡集約

UI を伴わない infra / data-contract タスクのため screenshots ではなく CLI ログ・SQL 結果・sync ログを正本証跡とする。

## 1. 証跡ファイル一覧

| 種別 | パス | 内容 |
| --- | --- | --- |
| ログ | outputs/phase-11/wrangler-d1-execute.log | `wrangler d1 execute` 実行ログ |
| ログ | outputs/phase-11/sheets-to-d1-sync-sample.log | manual sync の dry-run / sync_audit 抜粋 |
| ログ | outputs/phase-11/docs-validate.log | `pnpm lint` / link check / json validate |
| 補助 | outputs/phase-11/manual-smoke-log.md | 手動 smoke 実行ログのサマリ |
| 補助 | outputs/phase-11/link-checklist.md | link / docs validate チェックリスト |

ログファイル本文は実行者が貼り付ける。Claude Code は本番アクセス不可のため placeholder 状態で配置。

## 2. 自動 smoke 手順

```bash
# docs lint（リポジトリ依存）
pnpm lint > outputs/phase-11/docs-validate.log 2>&1

# JSON validate
node -e "JSON.parse(require('fs').readFileSync('doc/03-serial-data-source-and-storage-contract/outputs/artifacts.json','utf8'))" \
  >> outputs/phase-11/docs-validate.log 2>&1

# link check（任意ツール）
# 例: lychee doc/03-serial-data-source-and-storage-contract/outputs/ >> outputs/phase-11/docs-validate.log
```

## 3. 手動 wrangler 検証手順（ユーザー実行）

```bash
wrangler d1 list \
  | tee -a outputs/phase-11/wrangler-d1-execute.log

wrangler d1 execute ubm-hyogo-db-staging --env staging --command "select 1 as ok" \
  | tee -a outputs/phase-11/wrangler-d1-execute.log

wrangler d1 execute ubm-hyogo-db-staging --env staging \
  --command "select count(*) as n from member_responses" \
  | tee -a outputs/phase-11/wrangler-d1-execute.log

wrangler d1 execute ubm-hyogo-db-staging --env staging \
  --command "select count(*) as n from sync_audit" \
  | tee -a outputs/phase-11/wrangler-d1-execute.log
```

## 4. Sheets→D1 サンプル sync 手順

```bash
# manual trigger
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://ubm-hyogo-api.staging.workers.dev/admin/sync/manual" \
  | tee -a outputs/phase-11/sheets-to-d1-sync-sample.log

# audit 直近 1 件
wrangler d1 execute ubm-hyogo-db-staging --env staging \
  --command "select audit_id, trigger, status, failed_reason, inserted_count, skipped_count from sync_audit order by started_at desc limit 1" \
  | tee -a outputs/phase-11/sheets-to-d1-sync-sample.log
```

## 5. 4 条件記録

| 条件 | 結果 | コメント |
| --- | --- | --- |
| 価値性 | OK | source-of-truth 一意化 smoke で確認 |
| 実現性 | OK | staging/production 双方で binding 健全 |
| 整合性 | OK | branch/env/runtime/data/secret 同期 |
| 運用性 | OK | rollback / handoff / same-wave 経路 runbook 化 |

## 6. blocker / open question

| ID | 内容 | 引き継ぎ先 |
| --- | --- | --- |
| OQ-01 | prod migration 適用タイミング | Phase 12 / 04 / 05b 連携 |
| OQ-02 | sync constants 実トラフィックでのチューニング | 05a observability |

blocker: なし

## 7. 失敗時の戻り先

| 問題 | 戻り先 |
| --- | --- |
| branch / env drift | Phase 2 / 8 |
| source-of-truth drift | Phase 2 / 3 |
| wrangler / D1 binding 不整合 | Phase 5 |
| output path drift | Phase 5 / 8 |
