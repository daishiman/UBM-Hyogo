# Phase 6: 単体テスト実行

## 実行コマンド

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/loading
```

## 期待結果

```
 ✓ apps/web/app/profile/loading.spec.tsx (4)
   ✓ ProfileLoading
     ✓ TC-01: role=status と aria-busy を持つ
     ✓ TC-02: sr-only テキストが存在
     ✓ TC-03: avatar skeleton 要素を持つ
     ✓ TC-04: KV pair skeleton 4 行を持つ

 Test Files  1 passed (1)
      Tests  4 passed (4)
```

## 失敗時の trouble-shooting

| 症状 | 原因候補 | 対処 |
|------|---------|------|
| `getByRole("status")` not found | role 属性欠落 | `loading.tsx` の `<main role="status">` を確認 |
| `bg-surface-2` 要素 0 件 | utility 未解決 | Phase 5 Step 1/2 を再実行 |
| jsdom 未認識 | vitest config | `apps/web/vitest.config.ts` の `environment: "jsdom"` 確認 |

## evidence 保存

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/loading 2>&1 \
  | tee docs/30-workflows/profile-loading-skeleton-oklch/outputs/phase-11/evidence/test.log
```

## 完了条件

- [ ] 4 件全 PASS
- [ ] `test.log` が outputs/phase-11/evidence/ に保存される
