# Phase 2: 設計

## 1. 設計方針

- **`<header>` 所有パターン**: `PublicHeader` / `MemberHeader` は自身が `<header>` 要素全体を所有する Server Component。AdminTopbar も同じく root `<header data-shell="topbar">` を所有する。`AdminSidebar` は `<aside>` wrapper を layout 側に残すが、これは grid セル（`md:row-span-2`）の都合であり、`<header>` 系 primitive は要素自体を所有する current パターンに揃える。
- **既存コンポーネント再利用（FB-SDK-07-1）**: 新規 visual を作らず、inline JSX の class / token / data-* をそのまま移植する「抽出」作業。新 primitive を生やさない。
- **Server Component（no client boundary）**: `(admin)/layout.tsx` は `async` Server Component。AdminTopbar に `onClick` / `useState` 等を入れない。将来 actions に client button を入れる場合は呼び出し側で `"use client"` boundary を作る（本タスク範囲外）。

## 2. data-* 契約の所有権（不変条件1・2）

| 属性 | 付与位置 | 理由 |
|---|---|---|
| `data-theme="cool"` | layout.tsx wrapper `<div>` | AppShell scope（route group のテーマ） |
| `data-route-group="admin"` | layout.tsx wrapper `<div>` | route group 識別は AppShell 責務 |
| `data-testid="admin-shell"` | layout.tsx wrapper `<div>` | AppShell 識別 |
| `data-shell="sidebar"` | layout.tsx `<aside>` | sidebar slot（変更なし） |
| `data-shell="topbar"` | **AdminTopbar 内部 root `<header>`** | shell slot 識別は primitive 責務 |
| `data-component="admin-breadcrumb-slot"` | **AdminTopbar 内部 `<div>`** | slot 識別は primitive 内部 DOM |
| `data-component="admin-topbar-actions"` | **AdminTopbar 内部 `<div>`** | slot 識別は primitive 内部 DOM |
| `data-route="admin"` | layout.tsx `<main>` | route 識別（変更なし） |

> ⚠️ `data-route-group` / `data-theme` を誤って primitive 側へ移すと `(admin)/layout.spec.tsx` の AppShell 検証が壊れる。primitive は `data-shell="topbar"` と内部 slot のみを所有する。

## 3. props 設計（最小 API）

```ts
import type { ReactNode } from "react";

type AdminTopbarProps = {
  /** breadcrumb slot の中身。省略時はテキスト「管理」を表示する。 */
  readonly breadcrumb?: ReactNode;
  /** topbar 右側 actions slot の中身。省略時は aria-hidden の空 placeholder。 */
  readonly actions?: ReactNode;
};
```

- props 省略時は parallel-03 既定描画を保つ（既存 `(admin)/layout.spec.tsx` 互換）。
- `breadcrumb` 注入時も slot wrapper（`data-component="admin-breadcrumb-slot"` + class）は維持し、中身だけ差し替える。
- `actions` 注入時は wrapper の `aria-hidden` を外す（中身があるため visible）。省略時は `aria-hidden="true"` を保つ。

## 4. AdminTopbar.tsx 実装スニペット（正本）

`apps/web/src/components/layout/AdminTopbar.tsx`:

```tsx
// parallel-03-followup-001 / issue-832: admin AppShell topbar primitive。
// inline JSX（(admin)/layout.tsx）からの抽出。data-shell="topbar" 契約を内部 root に保持。
// Server Component（client boundary なし）。breadcrumb / actions は省略可能 slot。
import type { ReactNode } from "react";

type AdminTopbarProps = {
  readonly breadcrumb?: ReactNode;
  readonly actions?: ReactNode;
};

export function AdminTopbar({ breadcrumb, actions }: AdminTopbarProps = {}) {
  return (
    <header
      className="flex items-center justify-between border-b border-[var(--ubm-color-border-default)] px-4 py-3"
      data-shell="topbar"
    >
      <div
        className="text-sm font-semibold text-[var(--ubm-color-text-primary)]"
        data-component="admin-breadcrumb-slot"
      >
        {breadcrumb ?? "管理"}
      </div>
      {actions === undefined ? (
        <div aria-hidden="true" data-component="admin-topbar-actions" />
      ) : (
        <div data-component="admin-topbar-actions">{actions}</div>
      )}
    </header>
  );
}
```

### 設計上の決定事項

- **default param `= {}`**: `<AdminTopbar />`（props なし）呼び出しを許容するため、destructuring に default を付ける。これで `breadcrumb` / `actions` 共に `undefined`。
- **`actions === undefined` 判定**: `null` を渡すケース（明示的に空にする）と省略を区別する。省略時のみ `aria-hidden="true"`。`null` 注入時は visible な空 div になる（呼び出し側の意図を尊重）。
- **breadcrumb の `?? "管理"`**: `undefined` / `null` 両方で既定テキスト「管理」へフォールバック。

## 5. (admin)/layout.tsx 置換 diff

before（35-46 行）:

```tsx
      <header
        className="flex items-center justify-between border-b border-[var(--ubm-color-border-default)] px-4 py-3"
        data-shell="topbar"
      >
        <div
          className="text-sm font-semibold text-[var(--ubm-color-text-primary)]"
          data-component="admin-breadcrumb-slot"
        >
          管理
        </div>
        <div aria-hidden="true" data-component="admin-topbar-actions" />
      </header>
```

after:

```tsx
      <AdminTopbar />
```

import 追加（先頭 import 群に、AdminSidebar import の隣）:

```tsx
import { AdminSidebar } from "../../src/components/layout/AdminSidebar";
import { AdminTopbar } from "../../src/components/layout/AdminTopbar";
```

> relative import 階層: `apps/web/app/(admin)/layout.tsx` から `apps/web/src/components/layout/AdminTopbar.tsx` へは `../../src/components/layout/AdminTopbar`（既存 `AdminSidebar` import と同一階層）。

## 6. 抽出後の layout.tsx 構造（grid 配置の保全）

```tsx
<div ... data-theme="cool" data-route-group="admin" data-testid="admin-shell"
     className="ubm-admin-shell grid ... md:grid-cols-[272px_1fr] grid-rows-[auto_1fr]">
  <aside ... data-shell="sidebar" className="... md:row-span-2"><AdminSidebar /></aside>
  <AdminTopbar />            {/* ← 直接 grid 子。<header> が row1/col2 に入る */}
  <main ... data-route="admin">{children}</main>
</div>
```

- `AdminTopbar` は `<header>` を直接返す Server Component のため、`<div>` 等の余分な wrapper を増やさず grid 子として配置できる。grid 配置（`grid-rows-[auto_1fr]` の row1）は変わらない。

## 7. 型・依存

- 追加 import: `import type { ReactNode } from "react";`（AdminTopbar.tsx 内）。
- 外部依存追加なし。next/link 等も不要（actions / breadcrumb は slot のため）。

## 8. 影響範囲

| ファイル | 影響 |
|---|---|
| `(admin)/layout.tsx` | JSX 11 行 → import 1 行 + 呼び出し 1 行。挙動は同一 DOM 出力 |
| `(admin)/layout.spec.tsx` | 無修正。selector（`data-shell="topbar"` 等）は同一 DOM に出現 |
| client bundle | Server Component のため増加なし |
| その他 route | 影響なし（admin layout 以外は AdminTopbar を import しない） |
