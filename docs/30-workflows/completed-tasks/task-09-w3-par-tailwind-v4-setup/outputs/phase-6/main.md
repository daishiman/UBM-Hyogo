# Phase 6: テスト拡充

`apps/web/src/__tests__/tokens.test.ts` の RED ケースが Phase 5 実装後に全 8 件 GREEN 化したことを確認。

```
$ mise exec -- pnpm vitest run apps/web/src/__tests__/tokens.test.ts
 ✓ apps/web/src/__tests__/tokens.test.ts (8 tests) 15ms
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

bridge 経路の生成 CSS 確認は Phase 11 で `.open-next/assets/_next/static/chunks/*.css` を grep して実証（main.md §3）。
