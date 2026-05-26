# Phase 4 — テスト作成

## 追加テスト一覧

| テスト | path | 種別 |
| --- | --- | --- |
| env safe accessor | `apps/web/src/lib/__tests__/env.spec.ts` | vitest unit |
| site-metadata fallback | `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` | vitest unit（追記） |
| `/terms` prefetch smoke | `apps/web/playwright/tests/terms-prefetch.spec.ts` | playwright smoke |

## 完了条件

- 上記 3 テストが新規 or 追記され、PASS する。
- 既存 vitest / playwright suite に regression なし。
