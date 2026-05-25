# Phase 5 — 実装

## 実装順序

1. task-01: `getPublicEnvSafe` を `apps/web/src/lib/env.ts` に追加し、unit test を先に green にする。
2. task-02: `apps/web/src/lib/seo/site-metadata.ts` を `getPublicEnvSafe` + `DEFAULT_PUBLIC_ENV` fallback に置換し、追加 spec を green にする。
3. task-03: playwright smoke `apps/web/playwright/tests/terms-prefetch.spec.ts` を追加し、`/` → `/terms` prefetch で console error / 4xx 0 件を確認。

## 完了条件

- 各 task の DoD（spec 内記載）を全て満たす。
- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` / `lint` green。
- 上記 vitest + playwright smoke 全 PASS。
