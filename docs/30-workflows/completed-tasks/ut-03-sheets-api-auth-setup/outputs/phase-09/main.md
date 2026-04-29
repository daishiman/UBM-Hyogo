# Phase 9: 品質保証 8 項目チェック

| # | 項目 | コマンド | 期待 | 結果 |
| --- | --- | --- | --- | --- |
| 1 | typecheck | `pnpm --filter @ubm-hyogo/integrations-google typecheck` | 0 errors | PASS |
| 2 | package test | `pnpm exec vitest run packages/integrations/google/src/sheets/auth.test.ts packages/integrations/google/src/sheets/auth.contract.test.ts` | all green | PASS |
| 3 | package test script | `pnpm --filter @ubm-hyogo/integrations-google test` | all package tests green | PASS |
| 4 | scope cache regression | `auth.test.ts` scope別 cache case | readonly / write scope を別 token source として扱う | PASS |
| 5 | build boundary | `pnpm --filter @ubm-hyogo/integrations-google typecheck` | Workers 互換 TypeScript build 成功 | PASS |
| 6 | Node API 非依存 | `rg -n "node:crypto|google-auth-library|from \\"crypto\\"" packages/integrations/google/src/sheets` | matches 0 | PASS |
| 7 | 不変条件 #5（D1 不接触）| `rg -n "D1|D1Database" packages/integrations/google/src/sheets` | matches 0 | PASS |
| 8 | secret hygiene | `rg -n "BEGIN PRIVATE KEY|GOOGLE_SERVICE_ACCOUNT_JSON=.*\\{" docs/30-workflows/ut-03-sheets-api-auth-setup --glob '!outputs/phase-06/failure-cases.md'` | real secret matches 0 | PASS |

## 注

- 実 Google Sheets API 200 応答 smoke は Cloudflare Secrets 実投入と Sheets 共有が前提のため UT-26 に分離する。
- Node v22.21.1 では root `package.json` の Node 24.x engine warning が出るが、対象 package の typecheck/test は通過する。
