# Phase 2: 設計

**[実装区分: 実装仕様書]**

## 設計方針

1. **既存 `GROUPS` の「Public」セクションを削除し、最下段の専用 anchor として再配置**。
   - 「ホーム / 会員ディレクトリ / 登録」3 件のうち、`/` だけが「公開サイトに戻る」として最下段に降格、残り「会員ディレクトリ」「登録」「マイページ」は1つのグループ（例: ラベル `"公開導線"`）に集約して上段に残す。
   - sidebar 最下段の `SignOutButton` の **直上** に「公開サイトに戻る」anchor を置く。
2. **`AdminSidebarNavItem` は拡張しない**。公開サイト復帰リンクは 1 箇所限定の footer-adjacent anchor として直接マークアップし、共通 nav primitive への影響を避ける。
3. **DOM 契約**: `data-role="public-return"`, `href="/"`, `aria-label="公開サイトに戻る"` を持つ anchor は **ちょうど 1 つ**。

## コンポーネント構造（差分前後）

### before（抜粋）

```tsx
const GROUPS = [
  { label: "Public", items: [
      { href: "/", label: "ホーム", icon: ICON_HOME },
      { href: "/members", label: "会員ディレクトリ", icon: ICON_USERS },
      { href: "/register", label: "登録", icon: ICON_USER_PLUS },
  ]},
  { label: "Members", items: [{ href: "/profile", label: "マイページ", icon: ICON_USER }] },
  { label: "Admin", items: [/* 9 件 */] },
];
```

### after（抜粋）

```tsx
const GROUPS = [
  { label: "Public", items: [
      { href: "/members", label: "会員ディレクトリ", icon: ICON_USERS },
      { href: "/register", label: "登録", icon: ICON_USER_PLUS },
  ]},
  { label: "Members", items: [{ href: "/profile", label: "マイページ", icon: ICON_USER }] },
  { label: "Admin", items: [/* 9 件、変更なし */] },
];

// JSX 最下段に専用 anchor を追加（SignOutButton の直上）
<a
  href="/"
  data-role="public-return"
  aria-label="公開サイトに戻る"
  data-component="admin-sidebar-public-return"
  className="admin-sidebar-public-return flex items-center gap-2 rounded px-3 py-2 text-sm text-[var(--ubm-color-text-secondary)] hover:bg-[var(--ubm-color-surface-hover)]"
>
  <span aria-hidden>{ICON_HOME}</span>
  <span>公開サイトに戻る</span>
</a>
```

## 配置順序（最終 DOM 上→下）

1. `AdminBrandBlock`
2. `<section data-component="admin-nav-section">` × 3（Public 2 件 / Members 1 件 / Admin 9 件）
3. **`<a data-role="public-return">` 1 件**（新規）
4. `<footer data-component="admin-sidebar-footer">`（既存。`Avatar` + `displayName/email` + `SignOutButton`）

## `AdminSidebarNavItem` 拡張案（不採用案 A）

直接 `<a>` を JSX に書く（案 B）でも要件は満たせるため、**案 B（直接 JSX）** をデフォルト採用する。理由:

- 「公開サイトに戻る」は他の nav item と視覚スタイル・配置が異なる（最下段、グループ外、icon サイズ調整余地）
- `AdminSidebarNavItem` に `active` 判定が組み込まれている場合、`/` への一致は admin 配下 path で `false` 固定でよく、共通プリミティブのメリットが薄い
- 案 A（prop 拡張）は差分が広がり regression リスクが上がる

## トークン使用

- 背景: `var(--ubm-color-surface-hover)` （hover のみ）
- 文字色: `var(--ubm-color-text-secondary)`
- フォーカスリング: 既存 sidebar item と同等の `focus-visible:ring` ユーティリティを継承（既存クラス名を流用）

## 完了条件

- 上記 before/after 差分が Phase 5 でそのまま適用可能な粒度に落ちている
- 案 B（直接 JSX）を採用し、`AdminSidebarNavItem` の変更は **不要**。Phase 8 でもリファクタ不要と判定する。
- DOM 契約 3 属性（`data-role`, `href`, `aria-label`）が Phase 4 spec の assertion target に揃っている
