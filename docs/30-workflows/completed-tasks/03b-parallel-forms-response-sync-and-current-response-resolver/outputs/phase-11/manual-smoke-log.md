# Phase 11 manual smoke log

## 判定

NON_VISUAL API / cron / D1 同期タスクのため、画面スクリーンショットは不要。Phase 11 の手動 smoke は `manual-evidence.md` / `curl-recipes.md` / `wrangler-checks.md` に実行手順と証跡欄を分離して管理する。

## ローカル確認済み

| 観点 | コマンド | 結果 |
| --- | --- | --- |
| response sync unit | `pnpm vitest run apps/api/src/jobs/sync-forms-responses.test.ts` | PASS |
| mapper / route | `pnpm vitest run apps/api/src/jobs/mappers/extract-consent.test.ts apps/api/src/jobs/mappers/normalize-response.test.ts apps/api/src/routes/admin/responses-sync.test.ts` | PASS |
| API typecheck | `pnpm --filter @ubm-hyogo/api typecheck` | PASS |

## Staging 実機 smoke

実 deploy / 実 wrangler 実行は本ワークフローの禁止範囲に含めるため未実施。ステージング担当は `manual-evidence.md` の欄に実 stdout を貼り、実施後に本ファイルへ日時・担当・結論を追記する。

