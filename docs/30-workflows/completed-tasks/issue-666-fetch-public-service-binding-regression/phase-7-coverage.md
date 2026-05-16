# Phase 7: カバレッジ

[実装区分: 実装仕様書]

> Phase: 7 / 13

---

## カバレッジ目標

`apps/web/src/lib/fetch/public.ts` 全体で line coverage 90% 以上、branch coverage 80% 以上を維持する(既存基準を下げない)。

新規追加コードに対する branch coverage:

| 関数 | branch | テストケース |
|------|--------|-------------|
| `isTestOrPlaywright()` | `NODE_ENV==='test'` (true / false) | AC-R-01(NODE_ENV=test) / AC-R-02(NODE_ENV=production) |
| `isTestOrPlaywright()` | `PLAYWRIGHT_TEST==='1'` (true / false) | edge-3 (PLAYWRIGHT_TEST=1) / AC-R-02 (未設定) |
| `getServiceBinding()` | `isTestOrPlaywright() && PUBLIC_API_BASE_URL` (true) | AC-R-01 / edge-3 |
| `getServiceBinding()` | `isTestOrPlaywright() && PUBLIC_API_BASE_URL` (false) | AC-R-02 / AC-R-03 / edge-1 / edge-2 |

## 確認コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/fetch/public.spec.ts --coverage
```

カバレッジレポートの該当行(`apps/web/src/lib/fetch/public.ts`) を確認し、`isTestOrPlaywright()` の 2 つの OR 条件すべてに hit が記録されていることを Phase 11 evidence に記録。

## CI coverage gate との関係

- `e2e-tests-coverage-gate` (`.github/workflows/e2e-tests.yml`) は E2E line coverage を gate するもので、unit test coverage とは別 gate。本タスクの追加は unit test のみのため、`e2e-tests-coverage-gate` の数値には影響しない。
- 既存 unit test の coverage gate (`coverage-gate` workflow) が存在する場合、追加 test で coverage が**下がる**ことはない(追加 test は既存コード+新規コードの両方を hit するため)。

## 完了条件(Phase 7)

1. `apps/web/src/lib/fetch/public.ts` の line coverage が既存値以上
2. `isTestOrPlaywright()` 2 branch すべてに hit
3. `getServiceBinding()` 両 branch に hit
