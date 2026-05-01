# Phase 6 成果物 — 異常系検証（合成違反テスト）

## 状態
- 実行済（2026-05-01）

## 手順

`apps/api/src/__violation_test.ts` を一時的に作成:

```ts
// TEMP violation test for 02c-followup-002 dep-cruiser rule (DELETE after evidence taken)
import { seedAdminUsers } from "./repository/__fixtures__/admin.fixture";
export const _x = seedAdminUsers;
```

## 実行コマンド

```bash
mise exec -- pnpm dlx dependency-cruiser -c .dependency-cruiser.cjs \
  --ts-config tsconfig.json "apps/api/src/**/*.ts"
```

## 出力（抜粋）

```
  error no-prod-to-fixtures-or-tests: apps/api/src/__violation_test.ts → ./repository/__fixtures__/admin.fixture

x 1 dependency violations (1 errors, 0 warnings). 440 modules, 724 dependencies cruised.
```

→ AC-3 PASS（rule 発火を確認）。

## 違反ファイル削除後の再実行

ファイル削除後の同コマンド出力:

```
✔ no dependency violations found (438 modules, 723 dependencies cruised)
```

→ false positive なし。production code 内で `__fixtures__` / `__tests__` を import している
箇所は **0 件**。

## 副作用検証

- 02a / 02b / 02c の cross-domain rule は不変（test ファイルは from path に該当しない）。
- `_shared/__tests__/` / `_shared/__fixtures__/` は exclude が narrow に維持されているため、
  従来通り analysis から外れる。
