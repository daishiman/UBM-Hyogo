# Task B — Root `/` の async PublicHeader 整合

**[実装区分: 実装仕様書]**

## 1. 目的

`apps/web/app/page.tsx`（route `/`）は `(public)` route group 配下ではなく、直接 `<PublicHeader />` を mount している。Task A で PublicHeader が async server component に変わるため、root page でも `authView` を取得・配信する。

## 2. 変更対象ファイル

| # | パス | 種別 |
|---|------|------|
| 1 | `apps/web/app/page.tsx` | 編集 |
| 2 | `apps/web/app/__tests__/page.spec.tsx`（存在すれば） | 編集（authView mock） |

> route 移動 (`app/page.tsx` → `app/(public)/page.tsx`) は採用しない（Phase 2 案 X 不採用）。

## 3. 編集内容

```diff
+ import { getAuthView } from "../src/lib/auth-view";

  export const revalidate = 60;

- export default async function HomePage() {
+ export default async function HomePage() {
+   const authView = await getAuthView();
    // ...既存 data fetch（getStats, listMembersRaw 等）...
    return (
      <>
-       <PublicHeader />
+       <PublicHeader authView={authView} />
        <Hero ... />
        ...
-       <PublicFooter />
+       <PublicFooter />
      </>
    );
  }
```

既存 `connection()` / `revalidate = 60` / `generateMetadata` は変更しない。

## 4. 入出力・副作用

- 入力: なし（server-side `getAuthView()` のみ）
- 出力: PublicHeader が session に応じて 3 状態描画される DOM
- 副作用: `getAuth().auth()` の 1 回呼出（既存 root page の data fetch と同じ server cycle 内）

## 5. テスト方針

`apps/web/app/__tests__/page.spec.tsx`（既存有無を確認し、無ければ新規）:

1. `getAuthView` を `vi.mock` で `{ kind: "guest" }` 返却 → DOM に `data-auth-state="guest"` + `/login` リンク
2. `getAuthView` を `{ kind: "member", profileHref: "/profile" }` → `data-auth-state="member"` + `/profile` リンク

> root page は重い data fetch を含むため、テストは `getStats` / `listMembersRaw` も併せて `vi.mock` する。既存 spec パターンがある場合はそれを踏襲。

## 6. ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run app/__tests__/page.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web build  # OpenNext build が通ることを確認
```

## 7. DoD

- [ ] `app/page.tsx` で `await getAuthView()` 後 `<PublicHeader authView />`
- [ ] typecheck / lint green
- [ ] page spec で guest / member 2 ケース pass
- [ ] `pnpm build` が green（async server component の OpenNext build 互換）
- [ ] staging で `/` を踏み、session 状態と DOM `data-auth-state` が整合

## 8. 依存

- **前提**: Task A の `getAuthView` / `PublicHeader` async 化が完了していること。
