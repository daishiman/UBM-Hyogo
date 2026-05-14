# Phase 3: 詳細設計

## include / exclude 規則

### `vitest.config.ts` (unit / 既定)

```ts
test: {
  include: [
    "apps/**/src/**/*.{test,spec}.{ts,tsx}",
    "apps/**/app/**/*.{test,spec}.{ts,tsx}",
    "apps/**/migrations/**/*.{test,spec}.ts",
    "packages/**/src/**/*.{test,spec}.{ts,tsx}",
    "scripts/**/*.{test,spec}.ts",
  ],
  exclude: [
    // Phase 4 の機械判定で抽出される D1 依存 test path 一覧をここに列挙
    // 例: "apps/api/src/**/*.d1.test.ts",
    //     "apps/api/src/routes/__tests__/admin.test.ts" (D1 binding 利用)
  ],
}
```

### `vitest.d1.config.ts`

```ts
import { defineConfig } from "vitest/config";
import baseConfig from "./vitest.config";

const baseCoverage = ((baseConfig as { test?: { coverage?: Record<string, unknown> } }).test?.coverage ?? {});

export default defineConfig({
  test: {
    include: [
      // Phase 4 で抽出した D1 依存 test path のみ
    ],
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    coverage: {
      ...baseCoverage,
      reportsDirectory: "apps/api/coverage/d1",
    },
  },
});
```

## coverage 出力レイアウト

```
apps/api/coverage/
  unit/coverage-final.json
  unit/coverage-summary.json
  d1/coverage-final.json
  d1/coverage-summary.json
  coverage-final.json        # merge 後 (scripts/coverage-merge.mjs)
  coverage-summary.json      # merge 後

apps/web/coverage/
  coverage-final.json
  coverage-summary.json

packages/*/coverage/
  coverage-final.json
  coverage-summary.json
```

## merge 戦略

- `coverage-merge.mjs` は Istanbul `coverage-final.json` の **file-level union merge**。同一ファイルの同一 statement/function/branch に対する hit count は合算。
- 集約 job では、apps/api unit + d1 を merge し、apps/web / packages はそのまま使う。
- 最終 `coverage-guard.sh --no-run` は merge 済 `coverage-summary.json` を読んで 80% gate 判定。

## CI matrix 設計

```yaml
jobs:
  coverage-gate-shard:
    strategy:
      fail-fast: false
      matrix:
        group: [web, api-unit, api-d1, packages]
    steps:
      - ...setup...
      - run: bash scripts/coverage-guard.sh --group ${{ matrix.group }}
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-${{ matrix.group }}
          path: apps/*/coverage/** packages/*/coverage/**

  coverage-gate:
    needs: [coverage-gate-shard]
    steps:
      - ...setup...
      - uses: actions/download-artifact@v4
        with:
          pattern: coverage-*
          merge-multiple: true
      - run: node scripts/coverage-merge.mjs \
               --inputs="apps/api/coverage/unit/coverage-final.json,apps/api/coverage/d1/coverage-final.json" \
               --output="apps/api/coverage"
      - run: bash scripts/coverage-guard.sh --no-run
```

## 完了条件

- include/exclude 規則の draft が確定
- coverage 出力レイアウトが確定
- merge 戦略が確定
- CI matrix の YAML 骨子が確定
