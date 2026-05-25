# Phase 6: テスト実装結果

## 1. 実装済みテスト

| File | Coverage |
| --- | --- |
| `apps/web/src/lib/security-headers.spec.ts` | `SecurityHeaderConfig.nonce`、nonce CSP、`strict-dynamic`、`style-src-attr` 分離、script/style inline fallback不在 |
| `apps/web/__tests__/middleware.spec.ts` | requestごとのnonce一意性、response CSPとの一致、既存admin/profile guard挙動 |
| `apps/web/playwright/tests/security-headers.spec.ts` | HTTP response nonce CSP expectations |

## 2. 実行結果

`mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/security-headers.spec.ts apps/web/__tests__/middleware.spec.ts`

Result: PASS（2 files / 17 tests）。

## 3. grep gate

`rg "'unsafe-inline'" apps/web/src apps/web/middleware.ts apps/web/__tests__/middleware.spec.ts`

Result: PASS（0 hit / rg exit 1）。
