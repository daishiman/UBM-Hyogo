# Phase 2 — 既存実装調査

## 調査対象

### 2.1 #325 / #621 成果物

- Issue #325: `apps/api` 内 test を種別別 `.{contract,authz,repository,unit}.spec.ts` に統一（commit `26da6bb9`, merged via PR #625）。`docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/`（または完了済み workflow ディレクトリ）に Phase 1-13 evidence が存在。
- Issue #621: `apps/web` 内 test を `.spec.ts` に統一（commit `5bfb647f`）。種別 prefix は導入せず単純 rename。

### 2.2 ルート vitest.config

`vitest.config.ts` L42-48:

```ts
include: [
  "apps/**/src/**/*.{test,spec}.{ts,tsx}",
  "apps/**/app/**/*.{test,spec}.{ts,tsx}",
  "apps/**/migrations/**/*.{test,spec}.ts",
  "packages/**/src/**/*.{test,spec}.{ts,tsx}",
  "scripts/**/*.{test,spec}.ts",
],
```

`coverage.exclude` も `*.test.{ts,tsx}` / `*.spec.{ts,tsx}` 両方を含む（L58-59）。**rename 後も既存 include / exclude のままで動作する**ことが確認できる。

### 2.3 既存 test 件数（rename 対象 28 件）

#### packages/shared (17 件)

```
packages/shared/src/auth.test.ts
packages/shared/src/db/transaction.test.ts
packages/shared/src/errors.test.ts
packages/shared/src/gate-metadata/__tests__/schema.test.ts
packages/shared/src/index.test.ts
packages/shared/src/logging.test.ts
packages/shared/src/retry.test.ts
packages/shared/src/schemas/admin/admin-request-resolve.test.ts
packages/shared/src/schemas/admin/tag-queue-resolve.test.ts
packages/shared/src/schemas/identity-conflict.test.ts
packages/shared/src/types/ids.test.ts
packages/shared/src/utils/consent.test.ts
packages/shared/src/zod/field.test.ts
packages/shared/src/zod/identity.test.ts
packages/shared/src/zod/index.test.ts
packages/shared/src/zod/response.test.ts
packages/shared/src/zod/viewmodel.test.ts
```

#### packages/integrations (11 件)

```
packages/integrations/google/src/forms/auth.test.ts
packages/integrations/google/src/forms/backoff.test.ts
packages/integrations/google/src/forms/client.branches.test.ts
packages/integrations/google/src/forms/client.test.ts
packages/integrations/google/src/forms/index.test.ts
packages/integrations/google/src/forms/mapper.test.ts
packages/integrations/google/src/forms-client.test.ts
packages/integrations/google/src/index.test.ts
packages/integrations/google/src/sheets/auth.contract.test.ts
packages/integrations/google/src/sheets/auth.test.ts
packages/integrations/src/index.test.ts
```

### 2.4 既存 spec 件数

```
find packages -name '*.spec.ts' | wc -l → 0
```

rename 前後で `28 → 0 / 0 → 28` が期待値。

### 2.5 glob 参照箇所

`rg "packages.*\.test\."` で grep（実行は Phase 11 evidence で取得）。想定対象:

- `vitest.config.ts`（glob は package 名と独立で `{test,spec}` 二段階のため変更不要）
- `package.json` 各 workspace（`scripts.test` は `vitest` 起動のみで個別 path 言及なし想定）
- `.github/workflows/*.yml`（CI からの直接 path 言及があるか確認、想定はゼロ）
- 各種 docs（言及ありの場合は historical reference として残置可）

## 調査出力

- 上記 28 件のリストを Phase 5 で `rename-mapping.csv` に転記
- glob 参照のうち変更必要なものを Phase 7 で確定
