---
phase: 2
title: Architecture — primitive 境界と data-* 契約配置
workflow_id: parallel-03-followup-001-admin-topbar-primitive-extraction
status: spec_created
---

# Phase 2 — Architecture

[実装区分: 実装仕様書]

## 1. コンポーネント配置

```
apps/web/
├── app/(admin)/layout.tsx          ← 編集: inline <header> を <AdminTopbar /> に置換
└── src/components/layout/
    ├── AdminSidebar.tsx            ← 既存（参照パターン。変更しない）
    ├── AdminTopbar.tsx             ← 新規: primitive 本体
    └── __tests__/
        ├── AdminSidebar.component.spec.tsx  ← 既存（neighbor 慣習の参照）
        └── AdminTopbar.spec.tsx    ← 新規: primitive 単体 spec
```

## 2. Server / Client 境界

- `(admin)/layout.tsx` は `async` Server Component（`getSession()` を await）。
- `AdminTopbar` も **Server Component**。`"use client"` を付けない。client-only API（`onClick` / `useState` / event handler）を持ち込まない。
- 将来 actions slot に client button を入れる場合は、**呼び出し側**で `"use client"` boundary を作り、その client 要素を `actions` props として渡す。AdminTopbar 自体は server のまま据え置く。
- 根拠: AdminTopbar に client 境界を持たせると、props 経由で渡された server-rendered children まで巻き込み、admin layout 全体の RSC 利益を失う。

## 3. data-* 契約の配置（最重要）

| 属性 | 配置場所 | 理由 |
| --- | --- | --- |
| `data-route-group="admin"` | **wrapper 側**（`(admin)/layout.tsx` の `<div>`）に残す | route group 識別は AppShell wrapper の責務。primitive に移すと layout spec の AppShell 検証が壊れる |
| `data-theme="cool"` | wrapper 側に残す | 同上（テーマは AppShell scope） |
| `data-testid="admin-shell"` | wrapper 側に残す | shell 全体の testid |
| `data-shell="topbar"` | **AdminTopbar 内部の root `<header>`** | shell slot 識別は primitive 責務 |
| `data-component="admin-breadcrumb-slot"` | AdminTopbar 内部 | slot 識別は primitive 内部 DOM |
| `data-component="admin-topbar-actions"` | AdminTopbar 内部 | 同上 |
| `data-shell="sidebar"` | wrapper 側 `<aside>`（既存のまま） | 本タスクの対象外。変更しない |

> 誤って `data-route-group` を primitive 側に移すと `(admin)/layout.spec.tsx` の AppShell 検証（L58-59）が壊れる。付与位置を厳守する。

## 4. 描画ツリー（before / after）

### before（現状 `(admin)/layout.tsx` L35-46）
```
<div data-route-group="admin" data-theme="cool" data-testid="admin-shell">
  <aside data-shell="sidebar"><AdminSidebar /></aside>
  <header data-shell="topbar">                       ← inline JSX
    <div data-component="admin-breadcrumb-slot">管理</div>
    <div aria-hidden data-component="admin-topbar-actions" />
  </header>
  <main data-route="admin">{children}</main>
</div>
```

### after
```
<div data-route-group="admin" data-theme="cool" data-testid="admin-shell">
  <aside data-shell="sidebar"><AdminSidebar /></aside>
  <AdminTopbar />                                     ← primitive 呼び出し
  <main data-route="admin">{children}</main>
</div>
```

`AdminTopbar` の内部が before の `<header>...</header>` と DOM 同型を出力する。grid 配置（`md:grid-cols-[272px_1fr]` の row 2 / col 2 セル）は wrapper 側 grid が制御するため、header が grid 直下 child である構造を変えない（primitive の root が `<header>` 1 個であること）。

## 5. データフロー

- AdminTopbar は state を持たず、props（`breadcrumb` / `actions`）→ DOM の純粋写像。
- props 省略時は内部 default（テキスト「管理」 / `aria-hidden` placeholder）を描画。
- 外部 I/O なし（API / D1 / session 参照なし）。

## 6. スタイリング方針

- 既存 inline JSX の Tailwind class を逐語移植する（新規 visual 仕様なし）。
  - header: `flex items-center justify-between border-b border-[var(--ubm-color-border-default)] px-4 py-3`
  - breadcrumb: `text-sm font-semibold text-[var(--ubm-color-text-primary)]`
- 配色 token はすべて `var(--ubm-color-*)`。HEX / arbitrary hex を導入しない。
