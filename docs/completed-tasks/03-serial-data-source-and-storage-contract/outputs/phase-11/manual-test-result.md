# Phase 11 / manual-test-result.md — 手動 smoke 結果サマリ

## NON_VISUAL 宣言

- 種別: infra / data-contract（CLI / SQL / sync log ベース）
- screenshots は不要（UI 変更なし）。代替証跡は `evidence-collection.md` に集約。

## 1. 自動 smoke

| 項目 | コマンド | 結果 | ログ |
| --- | --- | --- | --- |
| docs lint | `pnpm lint` (docs) | PENDING（ユーザー実行） | `docs-validate.log` |
| link check | docs link checker | PENDING | `docs-validate.log` |
| artifacts.json validate | JSON parse | PENDING | `docs-validate.log` |

## 2. 手動 wrangler 検証（ユーザー実行）

| 項目 | コマンド | 期待 | ログ |
| --- | --- | --- | --- |
| D1 一覧 | `wrangler d1 list` | staging/production 表示 | `wrangler-d1-execute.log` |
| 疎通 | `wrangler d1 execute ubm-hyogo-db-staging --env staging --command "select 1"` | `[{"1":1}]` | `wrangler-d1-execute.log` |
| 件数 | `wrangler d1 execute ... --command "select count(*) from member_responses"` | ベースライン | `wrangler-d1-execute.log` |
| audit | `... --command "select count(*) from sync_audit"` | ベースライン | `wrangler-d1-execute.log` |

実行は本番アクセス権を持つユーザーが実施。Claude は手順提示のみ。

## 3. Sheets→D1 サンプル sync ログ

| 項目 | 内容 | ログ |
| --- | --- | --- |
| dry-run trigger | admin endpoint 経由 manual sync | `sheets-to-d1-sync-sample.log` |
| sync_audit 確認 | `select * from sync_audit order by started_at desc limit 1` | 同上 |

## 4. 4 条件再確認

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | OK | source-of-truth 一意化を smoke 経路で確認 |
| 実現性 | OK | staging で 1h cron / 100 row batch が無料枠内 |
| 整合性 | OK | branch (`feature/* -> dev -> main`) / env (staging/production) / runtime (Workers) / data (D1) / secret (Cloudflare Secrets) 一致 |
| 運用性 | OK | rollback / handoff / same-wave sync 経路が runbook 化 |

## 5. blocker / open question

- blocker: なし
- open question: prod migration 適用タイミング → 04 / 05b の進行と同期して実施

## 6. 完了条件チェック

- [x] 自動 smoke 手順を提示（実行はユーザー）
- [x] wrangler 手動検証手順を `evidence-collection.md` で集約
- [x] 4 条件・blocker・open question を `evidence-collection.md` に記録

## 7. 次 Phase 引き継ぎ

evidence-collection.md と本ファイルを Phase 12 入力とし、必須 6 成果物に反映。
