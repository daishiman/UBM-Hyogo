# Phase 2: ESLint / Boundary rule 設計

> Phase 2 サブ成果物。`apps/web` から `integrations/google` および `apps/api` への import を禁止することで、不変条件 #5（D1 access は `apps/api` に閉じる）を補強する。

## 1. 採用方式

実装は ESLint plugin ではなく **`scripts/lint-boundaries.mjs` のカスタムスクリプト** で実施する。CI/lint タスクから呼び出される。

理由:
- monorepo 構造（pnpm workspace）で、ESLint plugin の zone 解決が複雑になることを回避。
- カスタムスクリプトのほうが追加パッケージ追跡や allowlist 管理が容易。

## 2. 禁止 import 一覧

| target | from（禁止） | 不変条件 |
| --- | --- | --- |
| `apps/web/**` | `@ubm-hyogo/integrations-google` | #5 |
| `apps/web/**` | `apps/api/**`（相対 / alias 問わず） | #5 |
| `packages/shared/**` | `@ubm-hyogo/integrations-google` | 層分離 |
| `packages/shared/**` | `apps/**` | 層分離 |

## 3. allowlist 設計

- `apps/web` は **`@ubm-hyogo/shared`** のみ import 可。
- `apps/api` は **`@ubm-hyogo/shared` + `@ubm-hyogo/integrations-google`** を import 可。
- `packages/integrations/google` は `@ubm-hyogo/shared` のみ。

## 4. 実装結果

- `scripts/lint-boundaries.mjs` に `@ubm-hyogo/integrations-google` を追加済み。
- `pnpm -w lint` 経由で実行され、違反があれば exit code != 0 で fail。

## 5. 参考: ESLint plugin 形式（ドキュメント上の参照例）

```js
// 参考実装（採用していない）
module.exports = {
  rules: {
    "import/no-restricted-paths": ["error", {
      zones: [
        { target: "./apps/web", from: "./packages/integrations/google" },
        { target: "./apps/web", from: "./apps/api" },
      ],
    }],
  },
};
```

## 6. テスト

| ケース | 期待 |
| --- | --- |
| `apps/web/page.tsx` から `@ubm-hyogo/integrations-google` import | lint error |
| `apps/api/route.ts` から `@ubm-hyogo/integrations-google` import | OK |
| `apps/web/page.tsx` から `../../../apps/api/handler` import | lint error |

詳細テストは Phase 4 / Phase 6（異常系 #17, #18）を参照。
