# Phase 4 成果物 — テスト戦略

## 状態
- 実行済（2026-05-01）

## 戦略

本タスクは runtime コードを変更しないため、新規 unit / integration test は追加しない。
build 構成と境界 lint の正しさを以下の **構造的検証** と **合成違反 evidence** で確認する。

### 検証マトリクス

| AC | 検証種別 | 手段 | 期待結果 |
| --- | --- | --- | --- |
| AC-1 | bundle 検査 | esbuild bundle → grep `__fixtures__` / `__tests__` / `miniflare` | 0 件 |
| AC-2 | 既存 test suite | `pnpm test` for `apps/api` | green（新規変更なし） |
| AC-3 | dep-cruiser | (a) 通常実行 (b) 合成違反ファイル投入後実行 | (a) 0 violations (b) `no-prod-to-fixtures-or-tests` 1 error |
| AC-4 | bundle size 計測 | esbuild bundle size + 除外 source 行数/byte | 縮小傾向の数値 evidence |
| AC-5 | doc 整合 | 02c implementation-guide.md に三重防御 sub-section が存在 | 存在を確認 |

### 合成違反テスト手順（reproducible）

1. `apps/api/src/__violation_test.ts` を一時的に作成し、`./repository/__fixtures__/admin.fixture` を import。
2. `pnpm dlx dependency-cruiser -c .dependency-cruiser.cjs --ts-config tsconfig.json "apps/api/src/**/*.ts"` を実行。
3. `error no-prod-to-fixtures-or-tests: apps/api/src/__violation_test.ts → ./repository/__fixtures__/admin.fixture` が出ることを確認（Phase 6 で実測済）。
4. ファイルを削除して再実行 → 0 violations を確認。
