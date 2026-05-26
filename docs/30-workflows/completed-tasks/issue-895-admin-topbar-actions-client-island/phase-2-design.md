# Phase 2 — 設計

## 2.1 アーキテクチャ概観

```
(admin)/layout.tsx                       [Server Component, async, getSession()]
  └─ <AdminTopbar actions={...} />       [Server Component, props 受け]
       └─ actions slot                   [ここに client island を流し込む]
            └─ <AdminTopbarActions />    [Client Component, "use client"]
                 └─ <SignOutButton />    [既存 client island, signOut() + Button primitive]
```

Server Component (`AdminTopbar` / `(admin)/layout.tsx`) から Client Component を `props.actions` 経由で渡すパターン。Next.js App Router 公式の合法パターン（server が client を子として描画できる）。

## 2.2 責務境界（最重要設計判断）

| 場所 | 役割 | 例 |
|------|------|----|
| `AdminTopbar.actions` slot | **グローバル操作**（全 admin 画面共通、ページ非依存） | ログアウト、（将来）通知ベル、ユーザーメニュー |
| `AdminPageHeader.actions` slot | **ページ固有操作**（そのページのドメイン操作） | 「新規追加」「タグ作成」「保存」 |

両者を重複させない。component 冒頭コメント + spec で明示し回帰防止 assert を入れる。

## 2.3 client boundary 設計

- `(admin)/layout.tsx` は `async` server component で `getSession()` / `redirect()` を呼ぶ → **絶対に client 化しない**（認証ガードが client に漏れて不変条件 #11 fail-closed が壊れる）
- `AdminTopbar` も Server Component のまま → **`"use client"` を付けない / onClick・useState を直接持ち込まない**
- client 操作は `AdminTopbarActions`（`"use client"`）に閉じ込め、`actions` props で渡す

## 2.4 配置ポリシー

- `AdminTopbarActions.tsx` は `apps/web/src/features/admin/components/_layout/` に配置（既存 `AdminPageHeader.tsx` と同じ feature 配置に揃える）
- `app/(admin)/` 配下や `apps/web/src/components/layout/`（primitive 置き場）には置かない

## 2.5 既存資産の再利用

- `SignOutButton`（`apps/web/src/components/auth/SignOutButton.tsx`）: 既存 client island。`signOut()` ベース、`ButtonProps`（`size` / `variant`）を透過する Button primitive ラッパー。再実装せずそのまま再利用。
- `Button` primitive（`apps/web/src/components/ui/Button.tsx`）: 既存。新規追加なし。

## 2.6 `aria-hidden` 解除の仕組み

`AdminTopbar` 現実装:

```tsx
const hasActions = actions !== undefined;
// ...
<div aria-hidden={hasActions ? undefined : "true"} data-component="admin-topbar-actions">
  {actions}
</div>
```

`actions` を渡すと `hasActions === true` になり `aria-hidden={undefined}` → React が DOM 属性を出力しない。結果として placeholder 状態が解除され、内部 button が a11y tree に含まれる。

## 2.7 DOM / data-* 契約（維持）

- `<header data-shell="topbar">` （AdminTopbar 既存）
- `<div data-component="admin-topbar-actions">` （actions slot 既存・aria-hidden は注入時に消える）
- 新規: `<div data-testid="admin-topbar-actions-island">` （AdminTopbarActions の root）

`(admin)/layout.tsx` 側の data-* 契約（`data-theme="cool"` / `data-route-group="admin"` / `data-shell="sidebar"` / `data-shell="topbar"` / `data-route="admin"`）は無修正で維持する。

## 2.8 型設計

```ts
// AdminTopbarActions: props なし、ReactElement 返却の単純 island
export function AdminTopbarActions(): ReactElement;
```

`AdminTopbar` の `actions?: ReactNode` 型は変更なし。
