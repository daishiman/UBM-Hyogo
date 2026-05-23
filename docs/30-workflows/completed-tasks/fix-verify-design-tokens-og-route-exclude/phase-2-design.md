[実装区分: 実装仕様書]

# Phase 2 — 設計

## 2.1 修正方針

`scripts/verify-design-tokens.ts` の `DEFAULTS.colorLiteralExcludes` 配列に、Next.js App Router の **route handler convention** (`*/route.tsx`) 形式 4 つを追加する。既存の **file convention** (`*.tsx`) 形式 4 つと対称に扱う。

## 2.2 根拠

### 2.2.1 satori は CSS variable を解決しない

- `next/og` の `ImageResponse` は内部で [satori](https://github.com/vercel/satori) を使用して JSX → SVG → PNG を生成する。
- satori はランタイムの CSSOM を持たず、`var(--ubm-color-*)` 等の CSS custom property を **解決できない**。
- 公式ドキュメントおよび vercel/satori README で「inline style に literal な color 値（HEX / RGB / HSL）を渡すこと」が要求されている。
- 親仕様書 `docs/30-workflows/issue-806-dynamic-member-og-image/index.md` の不変条件 §2 にも同制約が明記されている。

### 2.2.2 既存 exclude pattern との整合

現行の `colorLiteralExcludes`（scripts/verify-design-tokens.ts:61-66）は file convention 形式のみを除外している:

```ts
colorLiteralExcludes: [
  /\/opengraph-image\.tsx$/,
  /\/twitter-image\.tsx$/,
  /\/icon\.tsx$/,
  /\/apple-icon\.tsx$/,
] as readonly RegExp[],
```

Next.js App Router は同じ意味論を持つ 2 つの命名 convention をサポートする:

| convention | 例 | satori 制約 |
|---|---|---|
| file convention | `app/.../opengraph-image.tsx`（default export = `ImageResponse`） | あり |
| route handler convention | `app/.../opengraph-image/route.tsx`（`GET` export = `ImageResponse`） | あり |

両者は satori 経由の同一制約下にあるため、exclude pattern も対称であるべき。

### 2.2.3 代替案を採用しなかった理由

HEX → OKLch literal 置換（例: `#1e3a8a` → `oklch(0.30 0.15 264)`）も技術的には可能だが:

1. drift script の精神（「色は token 経由で参照する」）と矛盾する。token 化されていない literal を量産することになる。
2. satori で展開される最終色は HEX と OKLch literal で等価であり、本質的な改善にならない。
3. token と CSS variable が link されないため、theme switching（warm / cool / dark）に追随できない（OG 画像は static SSG なので switching 不要だが、設計の純度が下がる）。

→ Phase 3 review で再評価し、却下を確定する。

## 2.3 diff snippet

### 2.3.1 `scripts/verify-design-tokens.ts`（line 61-66）

```diff
   colorLiteralExcludes: [
     /\/opengraph-image\.tsx$/,
     /\/twitter-image\.tsx$/,
     /\/icon\.tsx$/,
     /\/apple-icon\.tsx$/,
+    // Next.js App Router の route handler convention (`*/route.tsx`) 形式。
+    // file convention (`*.tsx`) 形式と同様に next/og satori 配下のため
+    // CSS variable 不可・HEX/RGB literal 必須。
+    /\/opengraph-image\/route\.tsx$/,
+    /\/twitter-image\/route\.tsx$/,
+    /\/icon\/route\.tsx$/,
+    /\/apple-icon\/route\.tsx$/,
   ] as readonly RegExp[],
```

### 2.3.2 `scripts/verify-design-tokens.ts`（line 493-497 周辺）

line 495 の hardcoded filter `apps/web/app/opengraph-image.tsx` は `DEFAULTS.colorLiteralExcludes` の `/\/opengraph-image\.tsx$/` と重複する個別 carve-out。route handler convention も同じ `colorLiteralExcludes` に集約するため、hardcoded filter と重複 `excludes.some(...)` は Phase 5 で削除し、除外条件を 1 箇所に統一する。

## 2.4 関数シグネチャ

| 関数 | 変更 |
|---|---|
| `scanForbiddenColorLiterals(roots, excludes)` | `export` し、既存 `scripts/verify-design-tokens.spec.ts` から route convention の除外境界を直接検証する |
| `DEFAULTS` | `export` し、除外条件の単一正本として維持する |

## 2.5 テスト方針

既存 `scripts/verify-design-tokens.spec.ts` に追記し、以下 6 ケースを検証する:

| TC | 入力ファイルパス | HEX literal 含む | 期待 drift |
|----|------------------|------------------|-----------|
| TC-1 | `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` | yes | 0 件（exclude） |
| TC-2 | `apps/web/app/foo/icon/route.tsx` | yes | 0 件（exclude） |
| TC-3 | `apps/web/app/foo/twitter-image/route.tsx` | yes | 0 件（exclude） |
| TC-4 | `apps/web/app/foo/apple-icon/route.tsx` | yes | 0 件（exclude） |
| TC-5 | `apps/web/src/components/Foo.tsx` | yes | 1 件以上（検出） |
| TC-6 | `apps/web/app/foo/opengraph-image.tsx`（root file convention） | yes | 0 件（既存 exclude） |

実装は `scanForbiddenColorLiterals` を export しているか確認のうえ、必要なら named export 化する。または `DEFAULTS.colorLiteralExcludes` 配列に対する regex match の純関数 unit test にとどめる。

## 2.6 実行コマンド

```bash
# ローカル検証
mise exec -- pnpm verify:tokens

# unit test
mise exec -- pnpm vitest run scripts/verify-design-tokens.spec.ts

# 全体型チェック
mise exec -- pnpm typecheck
```

## 2.7 影響範囲

| 影響先 | 内容 | 評価 |
|---|---|---|
| `scripts/verify-design-tokens.ts` | exclude regex 4 件追加 | 純粋に false positive のみを抑制 |
| CI gate `verify-design-tokens` | green 化 | 期待動作 |
| `apps/web` ランタイム | 変更なし | 影響なし |
| 既存の HEX literal drift 検出 | exclude 対象が `*/route.tsx` の特定 4 命名のみのため、汎用コードへの抑制リーク**なし** | 回帰なし |

## 2.8 DoD (Definition of Done)

1. `scripts/verify-design-tokens.ts` の `colorLiteralExcludes` 配列に 4 pattern が追加されている。
2. `mise exec -- pnpm verify:tokens` がローカルで exit 0。
3. `scripts/verify-design-tokens.spec.ts` の既存 C1〜C7 と追加 C-EX-1〜C-EX-6 が pass。
4. `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` が pass。
5. PR #175（または本タスク用の新規 PR）で GitHub Actions `verify-design-tokens / verify-design-tokens` が success。
6. `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` に変更がない（diff 0 行）。
