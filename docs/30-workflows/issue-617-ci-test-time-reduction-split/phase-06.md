# Phase 6: package.json scripts 整備

## 変更対象

- `apps/api/package.json`
- `apps/web/package.json`

## `apps/api/package.json` 差分

既存:
```json
"test:coverage": "vitest run --passWithNoTests --root=../.. --config=vitest.config.ts --coverage --coverage.reportsDirectory=apps/api/coverage --coverage.include=\"apps/api/src/**/*.{ts,tsx}\" --maxWorkers=1 --minWorkers=1 apps/api"
```

変更後:
```json
"test:coverage:unit": "vitest run --passWithNoTests --root=../.. --config=vitest.config.ts --coverage --coverage.reportsDirectory=apps/api/coverage/unit --coverage.include=\"apps/api/src/**/*.{ts,tsx}\" apps/api",
"test:coverage:d1": "vitest run --passWithNoTests --root=../.. --config=vitest.d1.config.ts --coverage --coverage.reportsDirectory=apps/api/coverage/d1 --coverage.include=\"apps/api/src/**/*.{ts,tsx}\" apps/api",
"test:coverage": "pnpm run test:coverage:unit && pnpm run test:coverage:d1 && node ../../scripts/coverage-merge.mjs --inputs=\"apps/api/coverage/unit/coverage-final.json,apps/api/coverage/d1/coverage-final.json\" --output=\"apps/api/coverage\""
```

## `apps/web/package.json` 差分

`test:coverage:web` alias を追加（CI matrix 用）:

```json
"test:coverage:web": "pnpm run test:coverage"
```

既存 `test:coverage` は触らない（後方互換）。

## 検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:unit
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage:web
```

期待: 各コマンドが exit 0、`apps/api/coverage/{unit,d1}/coverage-final.json` と merge 後 `apps/api/coverage/coverage-final.json` が生成。

## 完了条件

- 全 script が動作
- merge 後 `coverage-summary.json` で従来通り 80% 閾値が判定可能
