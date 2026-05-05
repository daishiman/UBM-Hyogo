# Phase 11 NON_VISUAL Evidence

## 判定

PASS（local static/runtime evidence collected; deploy evidence remains user-gated）。

## visualEvidence

`NON_VISUAL` — UI スクリーンショットは不要。

## Runtime Evidence

| 項目 | 結果 | 取得方法 |
| --- | --- | --- |
| typecheck | PASS | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` |
| lint | PASS（typecheck 兼用） | `mise exec -- pnpm --filter @ubm-hyogo/api lint` |
| cap-alert.test.ts | 12 / 12 PASS | `pnpm exec vitest run --config=vitest.config.ts apps/api/src/jobs/cap-alert.test.ts apps/api/src/jobs/sync-forms-responses.test.ts` |
| sync-forms-responses.test.ts | 15 / 15 PASS | 同上 |
| 全 api テスト | 100 files / 640 tests PASS | `mise exec -- pnpm --filter @ubm-hyogo/api test ...` |
| writeCapHit grep | 実装に記録 | `grep -rn writeCapHit apps/api/src` |
| cap-alert grep | 新規ファイル + import 確認 | `grep -rn cap-alert apps/api/src` |
| wrangler.toml | top / production / staging に `[[analytics_engine_datasets]]` 追加 | `grep -n analytics_engine_datasets apps/api/wrangler.toml` |
| PII redaction | event payload に email / responseId / questionId なし。`jobId` は UUID。 | source review |

## Staging Dry-Run

未実施（commit / push / deploy 禁止のため）。staging deploy は user 明示承認後に実施する。

## SQL evidence

未取得（D1 への書き込み確認は staging 反映後）。
