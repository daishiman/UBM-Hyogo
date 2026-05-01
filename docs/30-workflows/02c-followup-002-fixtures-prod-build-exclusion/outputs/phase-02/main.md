# Phase 2 成果物 — 設計

## 状態
- 実行済（2026-05-01）

## 設計判断

### 1. tsconfig 二重構成

`apps/api/tsconfig.json` は test / typecheck で fixture や test ファイルも含めて型検証する
必要があるため、production build と等価にできない。よって以下二層に分割:

| ファイル | 用途 | include / exclude |
| --- | --- | --- |
| `apps/api/tsconfig.json` | typecheck / vitest / IDE | `__tests__` `__fixtures__` `*.test.ts` も対象 |
| `apps/api/tsconfig.build.json` | `pnpm build` (production typecheck) | `extends ./tsconfig.json` ＋ `exclude: src/**/__tests__/**, src/**/__fixtures__/**, src/**/*.test.ts, src/**/*.spec.ts, ../../packages/**/__tests__/**, ../../packages/**/*.test.ts` |

`build` script を `tsc -p tsconfig.build.json --noEmit` に切り替える。

### 2. dependency-cruiser rule

旧 `options.exclude: { path: "(__tests__|__fixtures__|_shared)" }` は `__tests__` /
`__fixtures__` を analysis 対象から外しており、production import 検出ができなかった。
新 exclude を `(_shared/__tests__/|_shared/__fixtures__/)` に narrow し、`__tests__` /
`__fixtures__` ファイルを graph に残す。

新規 forbidden rule:

```js
{
  name: "no-prod-to-fixtures-or-tests",
  severity: "error",
  from: {
    path: "^(apps|packages)/.+/src/",
    pathNot: "(__tests__|__fixtures__)/|\\.test\\.ts$|\\.spec\\.ts$",
  },
  to: { path: "(__tests__|__fixtures__)/" },
}
```

### 3. vitest

vitest はリポジトリ root の `vitest.config.ts` を直接参照（`apps/api/package.json` の
`test` script で `--config=vitest.config.ts --root=../..`）。tsconfig.build.json は build
のみで使われるため vitest 設定の変更は不要。`include` / `exclude` は既に test ファイルを
網羅。

### 4. runtime bundling（情報・変更なし）

Cloudflare Workers の wrangler/esbuild は `src/index.ts` から到達可能な module だけを
bundle するので、`no-prod-to-fixtures-or-tests` が green である限り構造的に test/fixture
は bundle に乗らない。

### 5. 02c implementation-guide.md 補強

Phase 12 で「#6 の三重防御」sub-section を追記し、build 構成・境界 lint・runtime bundling
の三層を明示する。
