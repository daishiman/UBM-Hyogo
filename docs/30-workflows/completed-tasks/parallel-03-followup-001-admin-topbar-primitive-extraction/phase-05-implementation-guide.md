---
phase: 5
title: Implementation guide — スケルトンと差分
workflow_id: parallel-03-followup-001-admin-topbar-primitive-extraction
status: spec_created
---

# Phase 5 — Implementation guide

[実装区分: 実装仕様書]

## 1. 変更ファイル一覧

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `apps/web/src/components/layout/AdminTopbar.tsx` | 新規 | primitive 本体 |
| `apps/web/app/(admin)/layout.tsx` | 編集 | inline `<header>`（L35-46）削除 + `<AdminTopbar />` + import |
| `apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx` | 新規 | primitive 単体 spec |

## 2. S-01: `AdminTopbar.tsx` スケルトン

```tsx
// apps/web/src/components/layout/AdminTopbar.tsx
// parallel-03-followup-001: (admin)/layout.tsx の inline topbar を primitive 抽出。
// Server Component（"use client" 不可）。data-shell="topbar" / slot 契約を維持。
import type { ReactNode } from "react";

export type AdminTopbarProps = {
  readonly breadcrumb?: ReactNode;
  readonly actions?: ReactNode;
};

export function AdminTopbar({ breadcrumb, actions }: AdminTopbarProps) {
  const hasActions = actions != null;
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
      <div
        aria-hidden={hasActions ? undefined : "true"}
        data-component="admin-topbar-actions"
      >
        {actions}
      </div>
    </header>
  );
}
```

注意点:
- `"use client"` を **付けない**（NFR-01）。
- `aria-hidden` は actions 注入時に `undefined`（属性を出さない）、省略時に `"true"`。`aria-hidden={false}` を直接書くと `aria-hidden="false"` が DOM に出て意図と異なるため `undefined` を使う。
- token class は inline JSX から逐語移植（新規 visual 仕様禁止 / NFR-03）。

## 3. S-02: `(admin)/layout.tsx` 差分

import 追加（既存 import ブロックに 1 行）:
```tsx
import { AdminTopbar } from "../../src/components/layout/AdminTopbar";
```

置換（現状 L35-46 の `<header data-shell="topbar"> ... </header>` ブロック全体を 1 行に）:

before:
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

wrapper `<div>` / `<aside data-shell="sidebar">` / `<main data-route="admin">` は変更しない。

## 4. S-03: `AdminTopbar.spec.tsx` スケルトン

```tsx
// apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { axe } from "../../../test/axe";
import { AdminTopbar } from "../AdminTopbar";

afterEach(() => cleanup());

describe("AdminTopbar", () => {
  it("props 省略時に data-shell='topbar' の header を描画する", () => {
    const { container } = render(<AdminTopbar />);
    const header = container.querySelector('header[data-shell="topbar"]');
    expect(header).not.toBeNull();
  });

  it("既定 breadcrumb slot がテキスト「管理」を含む", () => {
    const { container } = render(<AdminTopbar />);
    const slot = container.querySelector('[data-component="admin-breadcrumb-slot"]');
    expect(slot?.textContent).toContain("管理");
  });

  it("既定 actions slot は aria-hidden='true' で空", () => {
    const { container } = render(<AdminTopbar />);
    const actions = container.querySelector('[data-component="admin-topbar-actions"]');
    expect(actions?.getAttribute("aria-hidden")).toBe("true");
    expect(actions?.textContent).toBe("");
  });

  it("breadcrumb props 注入時に slot 内容が置換される", () => {
    render(<AdminTopbar breadcrumb={<span>会員管理</span>} />);
    expect(screen.getByText("会員管理")).toBeTruthy();
  });

  it("actions props 注入時に slot 内容が反映され aria-hidden が外れる", () => {
    const { container } = render(<AdminTopbar actions={<button>新規</button>} />);
    const actions = container.querySelector('[data-component="admin-topbar-actions"]');
    expect(actions?.getAttribute("aria-hidden")).toBeNull();
    expect(screen.getByRole("button", { name: "新規" })).toBeTruthy();
  });

  it("header に OKLch トークン由来の border class を持つ", () => {
    const { container } = render(<AdminTopbar />);
    const header = container.querySelector('header[data-shell="topbar"]');
    expect(header?.className).toContain("border-[var(--ubm-color-border-default)]");
  });

  it("axe critical violation 0", async () => {
    const { container } = render(<AdminTopbar />);
    const results = await axe(container);
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });
});
```

> `axe` の import path（`../../../test/axe`）は既存 `(admin)/layout.spec.tsx` が使う `../../src/test/axe` を `src/components/layout/__tests__/` からの相対に読み替えたもの。実装時に `apps/web/src/test/axe` の実 export を確認し、相対パスを合わせる。axe helper が無い場合は role 検証で代替（Phase 6 参照）。

## 5. 実装後の即時セルフチェック

```bash
mise exec -- pnpm --dir apps/web exec vitest run src/components/layout/__tests__/AdminTopbar.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run "app/(admin)/layout.spec.tsx"
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 6. 既知の落とし穴

- `aria-hidden={false}` を書かない（`undefined` を使う）。
- import path は `src/components/layout/` を使う（issue 本文の `src/components/admin/` は誤り / Phase 1 §0 参照）。
- `data-route-group` を primitive 側に移さない（layout spec が壊れる）。
- `"use client"` を足さない。
