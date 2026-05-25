# Phase 9 — 品質保証

## 実行コマンド

```
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/terms-prefetch.spec.ts --project=desktop-chromium
mise exec -- pnpm verify:tokens
bash scripts/verify-pr-ready.sh
```

## 完了条件

- 全 6 コマンドが exit 0。
- Playwright smoke は `/` の public data fetch に deterministic mock API (`node scripts/e2e-mock-api.mjs`) が必要。
- `verify-pr-ready.sh` の内部ゲート (`gate-metadata:validate` / `verify:phase12-compliance` / `indexes:rebuild` drift) が green。
