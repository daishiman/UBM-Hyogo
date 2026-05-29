# Phase 2: 設計

| 項目      | 値                          |
| --------- | --------------------------- |
| Phase     | 2 / 13                      |
| 名称      | 設計                        |
| 状態      | completed                   |
| 作成日    | 2026-05-28                  |
| 担当      | task-specification-creator  |

## 1. 設計方針

`apps/web/app/page.tsx` は既に async server component。Task A/B 共通で `getAuthView` helper（`apps/web/src/lib/auth-view/index.ts`）と `PublicHeader authView` prop が利用可能。root page は server cycle 内で 1 回 `await getAuthView()` を呼び、結果を `<PublicHeader authView={authView} />` に渡すだけで整合する。

## 2. データフロー

```
HomePage (async server)
  ├─ await getAuthView()     ── apps/web/src/lib/auth-view/index.ts
  ├─ getStats() / listMembersRaw() （既存）
  └─ <PublicHeader authView={authView} /> （async server child）
       └─ session に応じて guest / member / admin の3状態を描画
```

## 3. 変更内容（diff 設計）

```diff
+ import { getAuthView } from "../src/lib/auth-view";

  export const revalidate = 60;

  export default async function HomePage() {
+   const authView = await getAuthView();
    // ...既存 data fetch（getStats, listMembersRaw 等）...
    return (
      <>
-       <PublicHeader />
+       <PublicHeader authView={authView} />
        <Hero ... />
        ...
        <PublicFooter />
      </>
    );
  }
```

## 4. 関数シグネチャ

| 関数             | シグネチャ                                                        | 由来      |
| ---------------- | ----------------------------------------------------------------- | --------- |
| `getAuthView`    | `() => Promise<AuthView>`                                         | Task A    |
| `PublicHeader`   | `async function PublicHeader(props: { authView: AuthView })`      | Task A    |
| `HomePage`       | `async function HomePage(): Promise<JSX.Element>`                 | 本 task   |

## 5. 再利用 vs 新規

| 観点                    | 判断                                              |
| ----------------------- | ------------------------------------------------- |
| 既存 helper 再利用      | YES（`getAuthView` は Task A の正本 helper）       |
| 新規 component 作成     | NO                                                |
| 新規 type 定義          | NO（`AuthView` は Task A で export 済）            |
| Apple HIG / a11y 担保   | Task A の `PublicHeader` 側で担保（既存 link a11y） |

## 6. props vs state（VSCPKR-03 対応）

`PublicHeader` は **server component**。`authView` は props（外部入力）として渡る。client 側 `useState` は使用しない。

## 7. shallow / deep merge / null 扱い

該当なし（props は単一値で merge 不要）。

## 8. エッジケース

| ケース                           | 期待挙動                                                |
| -------------------------------- | ------------------------------------------------------- |
| `getAuthView` が throw           | error.tsx boundary が補足。root page は throw を握らない |
| `authView.kind === "guest"`      | `data-auth-state="guest"` + `/login` link               |
| `authView.kind === "member"`     | `data-auth-state="member"` + `/profile` link            |
| `authView.kind === "admin"`      | （Task E 範囲。本 task は guest/member の2軸で十分）     |

## 9. lock / ref / 同期戦略

該当なし（server component で state lock は不要）。
