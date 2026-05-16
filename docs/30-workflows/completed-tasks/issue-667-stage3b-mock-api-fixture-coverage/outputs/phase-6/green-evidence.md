# Phase 6: GREEN evidence

## 契約テスト結果

```bash
$ mise exec -- pnpm vitest run scripts/__tests__/e2e-mock-api.contract.spec.ts packages/contracts

 ✓ packages/contracts/src/index.spec.ts (21 tests) 77ms
 ✓ scripts/__tests__/e2e-mock-api.contract.spec.ts (28 tests) 1552ms

 Test Files  2 passed (2)
      Tests  49 passed (49)
   Start at  23:20:49
   Duration  4.97s
```

## 全体 vitest

```text
Test Files  1 failed | 194 passed | 1 skipped (196)
Tests       1406 passed | 6 skipped (1412)
```

唯一の失敗 `apps/api/migrations/seed/__tests__/issue-399-seed-syntax.spec.ts` は D1 staging seed の hook
timeout で **issue-667 の責務外**（issue-399 既知の flaky）。本実装の 49 tests は全 GREEN。

## typecheck / lint

```text
$ mise exec -- pnpm typecheck
... apps/api typecheck: Done

$ mise exec -- pnpm lint
✔ no dependency violations found (1378 modules, 1985 dependencies cruised)
[stablekey-literal-lint] OK
... apps/api lint: Done
```

## DoD 実測

| # | DoD | 結果 |
|---|-----|------|
| 1 | RED → GREEN | 49/49 PASS |
| 2 | typecheck | PASS |
| 3 | lint | PASS |
| 6 | `{ok:true}` fallthrough 廃止 | `grep "ok: true" scripts/e2e-mock-api.mjs` は __test__ control endpoint と /health のみ |
| 7 | `safeJson` 経由 | 全 23 endpoint で `safeJson(...schemas.XxxZ)` 適用 |
| 8 | workflow patch | `Wait for mock API readiness` + `Upload mock API log` 追加済 |
| 10 | contracts 依存境界 | `packages/contracts/package.json#dependencies` は `zod` のみ。`@ubm-hyogo/shared` 参照 0 hit |
