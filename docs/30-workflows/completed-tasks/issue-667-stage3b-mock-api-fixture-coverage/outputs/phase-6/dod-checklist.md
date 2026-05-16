# Phase 6: DoD checklist

| AC | 内容 | 結果 | evidence |
|----|------|------|----------|
| AC-1 | mock が 23 endpoint をカバー | ✅ | scripts/e2e-mock-api.mjs L300-475 |
| AC-2 | contracts SSOT + zod parse 必須 | ✅ | safeJson() L46-61, schemas import L11 |
| AC-3 | 契約テスト | ✅ | scripts/__tests__/e2e-mock-api.contract.spec.ts (28 tests) |
| AC-4 | seed 強化 (3 members / 2 zones / 2 memberships / negative / 2 tag facets) | ✅ | packages/contracts/src/fixtures.mjs + AC-4 invariants tests |
| AC-5 | CI readiness wait + log upload | ✅ | .github/workflows/e2e-tests.yml L45-56, L75-80 |
| AC-6 | 既存 E2E 維持 | ✅ | mock の既存 endpoint レスポンス shape 維持 (passthrough schemas) |
| AC-7 | typecheck / lint PASS | ✅ | green-evidence.md 参照 |

## DoD detail

| # | DoD | コマンド | 結果 |
|---|-----|---------|------|
| 1 | RED → GREEN | `pnpm vitest run scripts/__tests__/e2e-mock-api.contract.spec.ts packages/contracts` | 49/49 PASS |
| 2 | typecheck | `pnpm typecheck` | exit 0 |
| 3 | lint | `pnpm lint` | exit 0 |
| 6 | `{ok:true}` fallthrough 廃止 | grep | 該当箇所は `/health` (status:ok) と `__test__` 制御 endpoint のみ。404 fallthrough 化済 (L478) |
| 7 | mock 内 zod parse 必須化 | grep `safeJson(` | 24 箇所 (各 endpoint) |
| 8 | workflow patch | grep `Wait for mock API readiness\|upload-artifact.*mock-api` | 2 hit |
| 10 | contracts 依存境界 | `cat packages/contracts/package.json` | dependencies: zod のみ |
