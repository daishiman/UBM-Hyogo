# Phase 13: ローカル checks 結果

| check | コマンド | 期待 | 結果 |
| --- | --- | --- | --- |
| integrations-google typecheck | `pnpm --filter @ubm-hyogo/integrations-google typecheck` | 0 errors | PASS |
| Sheets auth tests | `pnpm exec vitest run packages/integrations/google/src/sheets/auth.test.ts packages/integrations/google/src/sheets/auth.contract.test.ts` | all tests pass | PASS |
| secret grep | `rg -n "BEGIN PRIVATE KEY|GOOGLE_SERVICE_ACCOUNT_JSON=.*\\{" docs/30-workflows/ut-03-sheets-api-auth-setup --glob '!outputs/phase-06/failure-cases.md'` | no real secret values | PASS |
| Node API grep | `rg -n "node:crypto|google-auth-library|from \\"crypto\\"" packages/integrations/google/src/sheets` | no matches | PASS |
| link check | Phase 11 link-checklist.md の grep 検証 | broken 0 | PASS |

## 注

本タスクは Sheets auth 実装を含む。実 Google Sheets API への 200 応答 smoke は `GOOGLE_SERVICE_ACCOUNT_JSON` / Sheets 共有 / Cloudflare Secrets 実投入が必要なため UT-26 で扱う。
