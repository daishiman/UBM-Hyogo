# Phase 5 — 実装 evidence

## 反映ファイル

- `.github/workflows/e2e-tests.yml`（全面書換）
- `apps/web/playwright.config.ts`（reporter 末尾に `monocart-reporter` 追加）
- `apps/web/package.json`（`monocart-reporter@^2.9.0` / `c8@^10.1.0` 追加 / `e2e` script 追加）
- `scripts/coverage-gate-e2e.sh`（新規, +x）
- `scripts/__tests__/coverage-gate-e2e.fixture/{pass,fail-79,missing}/`（新規）
- `pnpm-lock.yaml`（`mise exec -- pnpm install` で更新）

## 実行コマンド

```
mise exec -- pnpm install
chmod +x scripts/coverage-gate-e2e.sh
mise exec -- pnpm --filter @ubm-hyogo/web typecheck   # exit 0
mise exec -- pnpm --filter @ubm-hyogo/web lint        # exit 0
shellcheck scripts/coverage-gate-e2e.sh               # violation 0
```
