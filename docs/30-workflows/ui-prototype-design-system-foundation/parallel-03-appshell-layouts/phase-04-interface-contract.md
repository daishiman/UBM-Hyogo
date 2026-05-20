---
phase: 4
title: インターフェース契約 — layout props と primitive シグネチャ
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-appshell-layouts
status: spec_created
---

# Phase 4 — インターフェース契約

[実装区分: 実装仕様書]

## 1. layout が受け取る props

Next.js App Router の layout 規約に従い、各 layout は `{ children }` のみを受ける。`params` / `searchParams` は **layout には渡らない**（page と異なる）。

### 1.1 Public layout

```ts
export default function PublicLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element;
```

- Server Component
- `async` 不要
- 副作用なし（auth gate なし）

### 1.2 Admin layout

```ts
export default async function AdminLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): Promise<JSX.Element>;
```

- Server Component（`async`）
- `getSession()` を呼ぶため `async`
- 既存 `export const dynamic = "force-dynamic"` を維持

### 1.3 Member layout

```ts
export default function MemberLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element;
```

- Server Component
- `async` 不要

## 2. 依存 primitive のシグネチャ参照（既存・変更しない）

### 2.1 PublicHeader

`apps/web/src/components/public/PublicHeader.tsx`

```ts
export function PublicHeader(): JSX.Element;
```

- props なし
- 内部で `<header data-component="public-header">` を出力
- 本 layout からは `<header data-shell="topbar">` でラップする（`data-component` と `data-shell` は名前空間が異なるので衝突しない）

### 2.2 PublicFooter

`apps/web/src/components/public/PublicFooter.tsx`

```ts
export function PublicFooter(): JSX.Element;
```

- props なし
- 内部で `<footer data-component="public-footer">` を出力
- 本 layout からは `<footer data-shell="footer">` でラップする

### 2.3 AdminSidebar

`apps/web/src/components/layout/AdminSidebar.tsx`

```ts
export function AdminSidebar(): JSX.Element;
```

- props なし
- 内部で `<nav className="admin-sidebar">` を出力
- 本 layout からは `<aside data-shell="sidebar">` でラップする

### 2.4 MemberHeader

`apps/web/src/components/layout/MemberHeader.tsx`

```ts
export function MemberHeader(): JSX.Element;
```

- props なし
- 内部で `<header className="member-header" data-testid="member-header">` を出力
- 本 layout からは `<header data-shell="topbar">` でラップする

### 2.5 SignOutButton

`apps/web/src/components/auth/SignOutButton.tsx`

```ts
"use client";
export function SignOutButton(): JSX.Element;
```

- client island
- 直接 layout からは import しない（`AdminSidebar` / `MemberHeader` 内部で使用済）

## 3. 認証 helper のシグネチャ（既存・変更しない）

### 3.1 `getSession`

`apps/web/src/lib/session.ts`

```ts
export type SessionShape = {
  readonly userId: string;
  readonly email: string;
  readonly isAdmin: boolean;
};

export async function getSession(): Promise<SessionShape | null>;
```

- D1 は触らない（cookie + JWT decode のみ）
- Admin layout のみ呼び出す

### 3.2 middleware（read-only 参照）

`apps/web/middleware.ts`

- matcher: `/admin/:path*`, `/profile/:path*`
- 未認証 / non-admin の redirect / 403 を edge で実行
- layout 内 `getSession()` gate と二段防御

## 4. data-* 契約（DOM 出力契約）

| layout | 必須属性（ルート div） | 必須子要素 | 子要素属性 |
|--------|----------------------|----------|-----------|
| Public | `data-theme="warm"` / `data-route-group="public"` / `data-testid="public-shell"` | `<header>` / `<main>` / `<footer>` | `data-shell="topbar"` / `data-route="public"` / `data-shell="footer"` |
| Admin | `data-theme="cool"` / `data-route-group="admin"` / `data-testid="admin-shell"` | `<aside>` / `<header>` / `<main>` | `data-shell="sidebar"` / `data-shell="topbar"` / `data-route="admin"` |
| Member | `data-theme="warm"` / `data-route-group="member"` / `data-testid="member-shell"` | `<header>` / `<main>` | `data-shell="topbar"` / `data-route="member"` |

## 5. children 制約

- 各 layout の `{children}` は **page.tsx / nested layout の任意 React node**
- layout 側で children を加工しない（型変換 / props 注入禁止）
- ToastProvider / SessionProvider 等の context は root layout（parallel-04）で供給される

## 6. CSS class 契約

- layout 側で使う Tailwind class は **構造クラスのみ**（`min-h-screen` / `grid` / `grid-cols-*` / `grid-rows-*` / `row-span-*` / `flex` / `gap-*` / `p-*`）
- 配色 / shadow / border 色は `bg-[var(--ubm-color-surface-bg)]` のように OKLch トークン経由のみ
- `bg-[#xxx]` / `text-[#xxx]` / `border-[#xxx]` は禁止（verify-design-tokens で reject）

## 7. テスト契約

各 layout spec は次の Public API で検証する:

```ts
import { render } from "@testing-library/react";
import { axe } from "jest-axe";

// Public
const { container } = render(<PublicLayout><div>child</div></PublicLayout>);
expect(container.querySelector('[data-testid="public-shell"]')).not.toBeNull();
expect(container.querySelector('[data-route="public"]')).not.toBeNull();
expect(await axe(container)).toHaveNoViolations();

// Admin（async layout）
vi.mock("../../src/lib/session", () => ({ getSession: vi.fn().mockResolvedValue({ userId: "u1", email: "a@b", isAdmin: true }) }));
const tree = await AdminLayout({ children: <div>child</div> });
const { container } = render(tree);
```

Vitest + React Testing Library + jest-axe を採用（既存 `__tests__` の慣習に合わせる）。
