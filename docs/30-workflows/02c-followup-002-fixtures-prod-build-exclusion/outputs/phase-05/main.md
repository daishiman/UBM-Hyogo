# Phase 5 成果物 — 実装ランブック

## 状態
- 実行済（2026-05-01）

## 適用差分

### 1. `apps/api/tsconfig.build.json`（新規）

```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "noEmit": true },
  "include": [
    "src/**/*.ts",
    "../../packages/shared/src/**/*.ts",
    "../../packages/integrations/src/**/*.ts"
  ],
  "exclude": [
    "src/**/__tests__/**",
    "src/**/__fixtures__/**",
    "src/**/*.test.ts",
    "src/**/*.spec.ts",
    "../../packages/**/__tests__/**",
    "../../packages/**/*.test.ts"
  ]
}
```

### 2. `apps/api/package.json`

`build` script を `tsc -p tsconfig.build.json --noEmit` に変更。`typecheck` / `lint` は
`tsconfig.json` のまま（test/fixture も型検査対象）。

### 3. `.dependency-cruiser.cjs`

- header コメントに「6. production code → __fixtures__ / __tests__」を追記。
- forbidden 配列末尾に `no-prod-to-fixtures-or-tests` rule を追加。
- `options.exclude.path` を `(__tests__|__fixtures__|_shared)` から `(_shared/__tests__/|_shared/__fixtures__/)` に narrow。

### 4. 02c implementation-guide.md

`不変条件 #6 の三重防御（02c-followup-002 で追加）` sub-section を `## 6. 不変条件の遵守
方法` 直下に追記。build 構成 / 境界 lint / runtime bundling の三層を列挙。

## 実行コマンド（順序）

```bash
# 1. build 検査
mise exec -- pnpm --filter @ubm-hyogo/api build

# 2. typecheck（test も含めて型 OK）
mise exec -- pnpm --filter @ubm-hyogo/api typecheck

# 3. dep-cruiser 通常実行
mise exec -- pnpm dlx dependency-cruiser -c .dependency-cruiser.cjs --ts-config tsconfig.json "apps/api/src/**/*.ts"

# 4. dep-cruiser 合成違反テスト（Phase 6 参照）

# 5. esbuild bundle size 計測
mise exec -- npx esbuild --bundle apps/api/src/index.ts --platform=neutral --format=esm \
  '--external:cloudflare:*' '--external:node:*' \
  --outfile=/tmp/api-bundle.js --metafile=/tmp/api-meta.json \
  --tsconfig=apps/api/tsconfig.build.json
```

## 自走禁止

deploy / commit / push / PR は本ランブックの対象外。
