[実装区分: 実装仕様書]

# Phase 5 — 実装

## 0. 変更対象ファイル一覧（CONST_005）

| ファイル | 変更内容 |
|----------|----------|
| `scripts/verify-design-tokens.ts` | `colorLiteralExcludes` に 4 regex 追加 / `scanForbiddenColorLiterals` `DEFAULTS` を export / 重複 filter 行を 1 行に整理 |
| `scripts/verify-design-tokens.spec.ts` | C-EX-1〜C-EX-6 を追記（Phase 6 で実装） |

`apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` は **変更しない**（HEX は satori 制約上正当）。

## 1. 関数シグネチャ（変更後）

```ts
// 既存 (private) → public 化
export async function scanForbiddenColorLiterals(
  roots: readonly string[],
  excludes?: readonly RegExp[],
): Promise<TokenDrift[]>

// 既存 (private const) → public 化
export const DEFAULTS: {
  specPath: string
  tokensCssPath: string
  globalsCssPath: string
  includeThemeBridge: boolean
  scanColorLiterals: boolean
  colorLiteralRoots: string[]
  colorLiteralExcludes: readonly RegExp[]
}
```

入出力:

- 入力: `roots`（走査対象ディレクトリ配列） / `excludes`（除外 regex 配列・省略時 `DEFAULTS.colorLiteralExcludes`）
- 出力: `TokenDrift[]`（`reason: 'forbidden-color-literal'` を含む配列。違反なしなら空配列）

## 2. Step 1 — `colorLiteralExcludes` に route handler convention を追加

`scripts/verify-design-tokens.ts` line 61-66:

```diff
-  colorLiteralExcludes: [
-    /\/opengraph-image\.tsx$/,
-    /\/twitter-image\.tsx$/,
-    /\/icon\.tsx$/,
-    /\/apple-icon\.tsx$/,
-  ] as readonly RegExp[],
+  colorLiteralExcludes: [
+    // Next.js root convention: app/.../opengraph-image.tsx
+    /\/opengraph-image\.tsx$/,
+    /\/twitter-image\.tsx$/,
+    /\/icon\.tsx$/,
+    /\/apple-icon\.tsx$/,
+    // Next.js route handler convention: app/.../opengraph-image/route.tsx
+    // next/og ImageResponse (satori) は CSS variable を解決しないため HEX literal 必須
+    /\/opengraph-image\/route\.tsx$/,
+    /\/twitter-image\/route\.tsx$/,
+    /\/icon\/route\.tsx$/,
+    /\/apple-icon\/route\.tsx$/,
+  ] as readonly RegExp[],
```

## 3. Step 2 — `scanForbiddenColorLiterals` の重複 filter 整理 & line 495 hardcoded filter の扱い

現状 line 486-497 で `colorLiteralExcludes` を **2 回** filter している（重複バグ）。1 行に整理し、line 495 の `/app/opengraph-image.tsx` hardcoded filter は **DEFAULTS regex で同等に被覆されるため削除**してよい（regex `/\/opengraph-image\.tsx$/` が `apps/web/app/opengraph-image.tsx` をマッチする）。

```diff
-async function scanForbiddenColorLiterals(
+export async function scanForbiddenColorLiterals(
   roots: readonly string[],
   excludes: readonly RegExp[] = DEFAULTS.colorLiteralExcludes,
 ): Promise<TokenDrift[]> {
   const files = (await Promise.all(roots.map((root) => listFiles(root))))
     .flat()
     .filter((file) => /\.(ts|tsx|css)$/.test(file))
     .filter((file) => !file.endsWith('/src/styles/tokens.css'))
-    // next/og ImageResponse は CSS variable を解決しないため HEX literal 必須。
-    .filter((file) => !file.endsWith('/app/opengraph-image.tsx'))
-    .filter((file) => !excludes.some((re) => re.test(file)))
     .filter((file) => !excludes.some((re) => re.test(file)))
```

加えて Step 1 の `DEFAULTS` を `export const DEFAULTS = { ... }` 形に変更する:

```diff
-const DEFAULTS = {
+export const DEFAULTS = {
   specPath: 'docs/00-getting-started-manual/specs/09b-design-tokens.md',
```

> 注: `DEFAULTS` は同ファイル内で `verifyDesignTokens` 等から参照されている。プレフィックス変更（`const` → `export const`）は名前を変えないため、既存参照は影響を受けない。

## 4. Step 3 — ローカル統合検証

```bash
mise exec -- pnpm verify:tokens
# 期待: exit 0、stdout に `forbidden-color-literal` を含まないこと
```

drift report に問題ファイルが残る場合は Step 1 の regex を見直す（`route.tsx` の前のパスセパレータが OS 依存しないか確認）。

## 5. Step 4 — テスト追加（Phase 6 で実装）

`scripts/verify-design-tokens.spec.ts` に Phase 6 仕様の C-EX-1〜C-EX-6 を追記。

```bash
mise exec -- pnpm vitest run scripts/verify-design-tokens.spec.ts
# 期待: 既存 C1〜C7 + 追加 C-EX-1〜C-EX-6 すべて pass
```

## 6. Step 5 — 静的検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 7. DoD チェックリスト

- [ ] `scripts/verify-design-tokens.ts` の `colorLiteralExcludes` に route handler 4 regex 追加済み
- [ ] `scanForbiddenColorLiterals` / `DEFAULTS` を `export` 済み
- [ ] 重複 filter 行を 1 行に整理 / line 495 hardcoded filter を削除
- [ ] `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` に変更なし
- [ ] `mise exec -- pnpm verify:tokens` exit 0
- [ ] `mise exec -- pnpm vitest run scripts/verify-design-tokens.spec.ts` exit 0
- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] PR push 後 `verify-design-tokens` workflow green
