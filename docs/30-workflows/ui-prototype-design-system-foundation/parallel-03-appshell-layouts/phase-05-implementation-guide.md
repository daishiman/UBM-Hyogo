---
phase: 5
title: 実装ガイド — 3 layout の編集スケルトン
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-appshell-layouts
status: spec_created
---

# Phase 5 — 実装ガイド

[実装区分: 実装仕様書]

本 Phase は **編集対象 3 ファイルの最終形スケルトン**を提示する。スケルトンは AI / 人間が **そのまま貼り付けてビルドが通る** 粒度で書く。

## 1. Public AppShell

### 1.1 絶対パス

- 編集対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-101514-wt-4/apps/web/app/(public)/layout.tsx`
- 種別: **編集**（新規ではない）

### 1.2 関数シグネチャ

```ts
export default function PublicLayout({
  children,
}: {
  readonly children: ReactNode;
}): JSX.Element
```

### 1.3 スケルトン

```tsx
// parallel-03 S-01: Public AppShell。data-theme="warm" / data-shell / data-route 契約。
import type { ReactNode } from "react";

import { PublicFooter } from "../../src/components/public/PublicFooter";
import { PublicHeader } from "../../src/components/public/PublicHeader";

export default function PublicLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <div
      className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)]"
      data-theme="warm"
      data-route-group="public"
      data-testid="public-shell"
    >
      <header data-shell="topbar">
        <PublicHeader />
      </header>
      <main data-route="public">{children}</main>
      <footer data-shell="footer">
        <PublicFooter />
      </footer>
    </div>
  );
}
```

### 1.4 既存からの差分

| 旧 | 新 |
|----|----|
| Fragment + `<div data-role="container">` | route group `<div>` wrapper に `data-theme` / `data-route-group` / `data-testid` 追加 |
| `<PublicHeader />` 直置き | `<header data-shell="topbar">` で wrap |
| `<PublicFooter />` 直置き | `<footer data-shell="footer">` で wrap |
| `<div data-role="container">` で children を wrap | `<main data-route="public">` に置換 |

## 2. Admin AppShell

### 2.1 絶対パス

- 編集対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-101514-wt-4/apps/web/app/(admin)/layout.tsx`
- 種別: **編集**

### 2.2 関数シグネチャ

```ts
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode;
}): Promise<JSX.Element>
```

### 2.3 スケルトン

```tsx
// parallel-03 S-02: Admin AppShell。data-theme="cool" / data-shell / data-route 契約。
// 不変条件 #11 維持: session.isAdmin !== true は redirect（middleware と二段防御）。
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminSidebar } from "../../src/components/layout/AdminSidebar";
import { getSession } from "../../src/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (!session.isAdmin) redirect("/login?gate=forbidden");

  return (
    <div
      className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr] bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)] md:grid-cols-[240px_1fr]"
      data-theme="cool"
      data-route-group="admin"
      data-testid="admin-shell"
    >
      <aside
        className="row-span-2 border-r border-[var(--ubm-color-border-default)]"
        data-shell="sidebar"
      >
        <AdminSidebar />
      </aside>
      <header
        className="flex items-center justify-between border-b border-[var(--ubm-color-border-default)] px-4 py-3"
        data-shell="topbar"
      >
        <nav aria-label="パンくず" data-component="admin-breadcrumb-slot" />
        <div data-component="admin-topbar-actions" />
      </header>
      <main className="flex flex-col gap-4 p-4 md:p-6" data-route="admin">
        {children}
      </main>
    </div>
  );
}
```

### 2.4 既存からの差分

| 旧 | 新 |
|----|----|
| `<div className="ubm-admin-shell grid ... md:grid-cols-[240px_1fr]" data-testid="admin-shell">` | wrapper に `data-theme="cool"` / `data-route-group="admin"` を追加。grid-rows を `auto_1fr` に変更し topbar 行を追加 |
| `<aside className="border-r ...">` | `data-shell="sidebar"` + `row-span-2` 追加 |
| topbar 行なし | 新規 `<header data-shell="topbar">` をブレッドクラム slot + actions slot 付きで追加 |
| `<main className="flex flex-col gap-4 p-4 md:p-6">` | `data-route="admin"` 追加 |

`AdminSidebar` 内の `SignOutButton` は **そのまま残す**（NFR-04 を守るため AdminSidebar の API は変更しない）。topbar 側 `data-component="admin-topbar-actions"` slot は serial-05 で実装が入る placeholder。

## 3. Member AppShell

### 3.1 絶対パス

- 編集対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-101514-wt-4/apps/web/app/(member)/layout.tsx`
- 種別: **編集**

### 3.2 関数シグネチャ

```ts
export default function MemberLayout({
  children,
}: {
  readonly children: ReactNode;
}): JSX.Element
```

### 3.3 スケルトン

```tsx
// parallel-03 S-03: Member AppShell。data-theme="warm" / data-shell / data-route 契約。
import type { ReactNode } from "react";

import { MemberHeader } from "../../src/components/layout/MemberHeader";

export default function MemberLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <div
      className="grid min-h-screen grid-rows-[auto_1fr] bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)]"
      data-theme="warm"
      data-route-group="member"
      data-testid="member-shell"
    >
      <header data-shell="topbar">
        <MemberHeader />
      </header>
      <main className="flex flex-col gap-4 p-4 md:p-6" data-route="member">
        {children}
      </main>
    </div>
  );
}
```

### 3.4 既存からの差分

| 旧 | 新 |
|----|----|
| `<div className="member-shell" data-testid="member-shell">` | wrapper に `data-theme="warm"` / `data-route-group="member"` を追加。`member-shell` クラスは削除し data-* 契約に統一 |
| `<MemberHeader />` 直置き | `<header data-shell="topbar">` で wrap |
| `<main className="member-main">` | `data-route="member"` 追加し `member-main` クラスは構造 utility に置換 |

`member-shell` / `member-main` の独自 class が globals.css に存在する場合、本 layout の編集と同時に parallel-01 で削除整理する（責務委譲）。本サブワークフローでは layout 側の class 名を data-* 契約に統一するのみ。

## 4. import パス検証コマンド

```bash
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-101514-wt-4
ls apps/web/src/components/public/PublicHeader.tsx apps/web/src/components/public/PublicFooter.tsx \
   apps/web/src/components/layout/AdminSidebar.tsx apps/web/src/components/layout/MemberHeader.tsx \
   apps/web/src/lib/session.ts
```

全 5 ファイルが存在することを Phase 1 で確認済。

## 5. 実装手順（推奨）

1. S-01 → S-03 → S-02 の順（影響範囲が小さい順）
2. 各 step 完了後に `pnpm --filter @ubm-hyogo/web build` で smoke build
3. 全 step 完了後に typecheck / lint / spec
4. parallel-01 / parallel-02 が未完の段階でも 3 layout は build できる（selector が存在しないと styling は当たらないが DOM 構造は完成する）
