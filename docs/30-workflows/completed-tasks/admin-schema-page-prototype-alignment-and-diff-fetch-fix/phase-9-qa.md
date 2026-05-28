# Phase 9: QA

[実装区分: 実装仕様書]

## 実行コマンド一覧

```bash
# 1. 依存
mise exec -- pnpm install --force

# 2. 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 3. unit / component spec
mise exec -- pnpm --filter @ubm-hyogo/web test --run
mise exec -- pnpm --filter @ubm-hyogo/api test --run

# 4. tokens / a11y / build
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
mise exec -- pnpm --filter @ubm-hyogo/web build

# 5. Playwright (local darwin baseline)
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-schema-page.spec.ts --project=visual-chromium

# 6. workflow gate
mise exec -- pnpm verify:phase12-compliance
mise exec -- pnpm gate-metadata:validate
mise exec -- pnpm indexes:rebuild
bash scripts/verify-pr-ready.sh
```

## 合否基準

| Command | 期待 |
|---------|------|
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm --filter @ubm-hyogo/web test --run` | 全 PASS |
| `pnpm --filter @ubm-hyogo/api test --run` | 全 PASS |
| `verify-design-tokens` | PASS |
| `build` | exit 0 |
| Playwright | 3 ケース PASS（baseline 初回は --update-snapshots） |
| `verify:phase12-compliance` | OK |
| `gate-metadata:validate` | ERROR 0 |
| `indexes:rebuild` | idempotent（md5 一致） |
| `verify-pr-ready.sh` | exit 0 |

## 既知の environment 制約

- D1 contract spec は `apps/api/vitest.d1.config.ts` 経由で実行される（既定 unit lane では skip）
- Playwright visual baseline は CI Linux で生成される `-linux.png` が正本。local darwin baseline はコミットしない
- staging deploy / authenticated runtime screenshot は user-gated（Phase 11）
