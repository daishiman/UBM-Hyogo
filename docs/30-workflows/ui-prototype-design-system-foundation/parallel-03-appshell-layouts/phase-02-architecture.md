---
phase: 2
title: アーキテクチャ設計 — AppShell 3 系統の責務分離と data-* 契約
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-appshell-layouts
status: spec_created
---

# Phase 2 — アーキテクチャ設計

[実装区分: 実装仕様書]

## 1. AppShell 設計の前提

`app/layout.tsx`（root）は parallel-04 で `<html lang="ja" data-theme="warm">` と ToastProvider を配置済の想定。本サブワークフローはその直下の **3 系統 route group layout** のみを対象とする。

```
app/
├── layout.tsx                  # root（parallel-04 担当）: <html data-theme="warm"> + ToastProvider
├── (public)/layout.tsx         # 本サブワークフロー: data-theme="warm" 継承
├── (admin)/layout.tsx          # 本サブワークフロー: data-theme="cool" 上書き
└── (member)/layout.tsx         # 本サブワークフロー: data-theme="warm" 継承
```

## 2. 3 系統 AppShell の構造

### 2.1 Public AppShell

```
<div data-theme="warm" data-route-group="public" className="min-h-screen grid grid-rows-[auto_1fr_auto]">
  <header data-shell="topbar"><PublicHeader /></header>
  <main data-route="public">{children}</main>
  <footer data-shell="footer"><PublicFooter /></footer>
</div>
```

- Server Component 既定
- 認証 gate なし（公開層は全 anonymous OK）
- `data-theme="warm"` は root の既定値を冗長に明示（コンテナ単位 cascade を確実化）
- `PublicHeader` / `PublicFooter` は既存 primitive をそのまま import

### 2.2 Admin AppShell

```
<div data-theme="cool" data-route-group="admin" className="min-h-screen grid grid-cols-[240px_1fr] grid-rows-[auto_1fr]">
  <aside data-shell="sidebar" className="row-span-2"><AdminSidebar /></aside>
  <header data-shell="topbar"><AdminTopbarSlot /></header>
  <main data-route="admin">{children}</main>
</div>
```

- Server Component 既定。`async` で `getSession()` を実行
- `session === null` → `redirect("/login?next=/admin")`
- `session.isAdmin !== true` → `redirect("/login?gate=forbidden")`
- 既存実装の auth gate を維持（middleware と二段防御）
- `AdminTopbarSlot` は新規 primitive を作らず、layout.tsx 内 inline JSX で組み立てる軽量 chrome（ブレッドクラム slot + サインアウト導線）
- `AdminSidebar` 内の `SignOutButton` は props を変更せず残す。本サブワークフローの完了形は **両方残す並存案** とし、視覚的重複は CSS と配置で吸収する。Topbar primitive 抽出は本 workflow の必須成果物にしない。

### 2.3 Member AppShell

```
<div data-theme="warm" data-route-group="member" className="min-h-screen grid grid-rows-[auto_1fr]">
  <header data-shell="topbar"><MemberHeader /></header>
  <main data-route="member">{children}</main>
</div>
```

- Server Component 既定
- 認証 gate は **layout 内では実行しない**。`/profile` 配下は既存 `middleware.ts` matcher で gate 済。`/login` と `/profile` は現行 root path を維持するため、`(member)` layout に依存させない
- `MemberHeader` 既存 primitive をそのまま import

## 3. data-* 契約一覧

| attribute | 値 | 配置 | 役割 |
|-----------|---|------|------|
| `data-theme` | `warm` / `cool` | route group 直下の `<div>` | OKLch トークン palette 切替 |
| `data-route-group` | `public` / `admin` / `member` | route group 直下の `<div>` | E2E selector / 解析用 |
| `data-shell` | `topbar` / `sidebar` / `footer` | `<header>` / `<aside>` / `<footer>` | parallel-01 で追加した shell 規則の hook |
| `data-route` | `public` / `admin` / `member` | `<main>` | parallel-01 の page surface 規則の hook |
| `data-testid` | `public-shell` / `admin-shell` / `member-shell` | route group 直下の `<div>` | spec / Playwright |

## 4. 認証 / role gate の責務分離

| 層 | 責務 | 実装場所 |
|----|------|----------|
| 1. Edge middleware | 未認証 redirect / 403 short-circuit（D1 不要） | `apps/web/middleware.ts`（既存） |
| 2. Admin layout SSR gate | `session.isAdmin !== true` の二段防御 | `app/(admin)/layout.tsx` 内 `getSession()` → `redirect()` |
| 3. Page-level gate | route 固有の追加条件 | 各 page.tsx（layout の責務外） |

本サブワークフローは **層 2 の既存実装を維持**するだけで、新規 auth logic は追加しない。

## 5. Server / Client Component 境界

| layout | RSC | 理由 |
|--------|-----|------|
| `(public)/layout.tsx` | Server | state なし、`PublicHeader` / `PublicFooter` も Server Component |
| `(admin)/layout.tsx` | Server (`async`) | `getSession()` を呼ぶため。`AdminSidebar` は `Link` + `SignOutButton` 内に client island を含む |
| `(member)/layout.tsx` | Server | `MemberHeader` 内 `SignOutButton` のみ client island |

`SignOutButton` が client island である現状の依存関係は変更しない。

## 6. CSS 結合戦略

- layout は `className` で OKLch トークン経由のクラスのみ使用（`bg-[var(--ubm-color-surface-bg)]` 等）
- 色・spacing・shadow は **selector** 経由で globals.css から当てる（parallel-01/02 の責務範囲）
- layout 側の Tailwind class は **構造（grid / flex / min-h-screen）に限定** し、配色 utility は最小化する

## 7. 既存実装との差分（migration 表）

| layout | 現状 | 編集後 | 差分種別 |
|--------|------|--------|---------|
| `(public)/layout.tsx` | `<PublicHeader />` / `<div data-role="container">{children}</div>` / `<PublicFooter />`（属性 hook なし） | `data-theme="warm"` + `<header data-shell="topbar">` + `<main data-route="public">` + `<footer data-shell="footer">` | wrapper 追加 |
| `(admin)/layout.tsx` | `getSession()` gate + grid + `<aside><AdminSidebar /></aside>` + `<main>` | `data-theme="cool"` + `<aside data-shell="sidebar">` + 新規 `<header data-shell="topbar">` slot + `<main data-route="admin">` | wrapper 追加 + topbar 行追加 |
| `(member)/layout.tsx` | `<div className="member-shell">` + `<MemberHeader />` + `<main className="member-main">` | `data-theme="warm"` + `<header data-shell="topbar">` + `<main data-route="member">` | wrapper の class を data-* 契約に統一 |

## 8. 採用しない選択肢

| 選択肢 | 不採用理由 |
|--------|----------|
| 単一 `AppShell` primitive を作って 3 layout で reuse | route group ごとに grid 行列が異なり共通化メリットが薄い。新規 primitive 追加は NFR-04 違反 |
| `AdminTopbar` を新規 primitive として切り出す | 09g blueprint で topbar 構成が確定するまでは layout 内 inline JSX に留め、安定後に primitive 化を検討 |
| Member layout 内で `/login` を区別する分岐 | route group が同じ以上、layout 内分岐は antipattern。`/login` の追加 chrome が必要なら page 側で実装 |
| layout から D1 を直接読み込む | 不変条件違反 |
