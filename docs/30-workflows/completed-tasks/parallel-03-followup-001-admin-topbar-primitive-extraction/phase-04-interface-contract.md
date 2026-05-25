---
phase: 4
title: Interface contract — props / DOM / data-* シグネチャ
workflow_id: parallel-03-followup-001-admin-topbar-primitive-extraction
status: spec_created
---

# Phase 4 — Interface contract

[実装区分: 実装仕様書]

## 1. AdminTopbar props 契約

```ts
import type { ReactNode } from "react";

export type AdminTopbarProps = {
  /** topbar 左側の breadcrumb slot。省略時はテキスト「管理」 */
  readonly breadcrumb?: ReactNode;
  /** topbar 右側の actions slot。省略時は aria-hidden placeholder */
  readonly actions?: ReactNode;
};

export function AdminTopbar(props: AdminTopbarProps): JSX.Element;
```

- props はすべて optional。省略時の既定描画は parallel-03 inline JSX と DOM 同型。
- AdminSidebar（props なし default-rendering）と対称な「props 省略可能 primitive」設計（NFR-04 整合）。
- 命名 `breadcrumb` / `actions` は将来 slot/children 拡張を見据えた slot pattern 命名。

## 2. DOM 出力契約（省略時 = 既定）

```html
<header class="flex items-center justify-between border-b border-[var(--ubm-color-border-default)] px-4 py-3" data-shell="topbar">
  <div class="text-sm font-semibold text-[var(--ubm-color-text-primary)]" data-component="admin-breadcrumb-slot">管理</div>
  <div aria-hidden="true" data-component="admin-topbar-actions"></div>
</header>
```

| 契約項目 | 値 | 不変条件 |
| --- | --- | --- |
| root 要素 | `<header>` | 1 個。grid child 構造を保つ |
| `data-shell` | `"topbar"` | 既存 layout spec L61 が assert |
| breadcrumb slot | `<div data-component="admin-breadcrumb-slot">` | 既定 textContent = 「管理」 |
| actions slot | `<div aria-hidden="true" data-component="admin-topbar-actions">` | 既定で空・aria-hidden |
| header class | `flex items-center justify-between border-b border-[var(--ubm-color-border-default)] px-4 py-3` | 逐語移植 |
| breadcrumb class | `text-sm font-semibold text-[var(--ubm-color-text-primary)]` | 逐語移植 |

## 3. DOM 出力契約（slot 注入時）

- `breadcrumb` props を渡すと `data-component="admin-breadcrumb-slot"` の中身が props 値に置換される（slot wrapper div は維持）。
- `actions` props を渡すと `data-component="admin-topbar-actions"` の中身が props 値に置換される。actions に内容がある場合は `aria-hidden` を外す（中身を支援技術に見せるため）。空（既定 placeholder）時のみ `aria-hidden="true"`。

> 実装注: `aria-hidden` の出し分けは `actions == null ? aria-hidden : 表示` で判定。これにより既定 placeholder（装飾用空 div）は支援技術から隠れ、実 actions（ボタン等）注入時は読み上げ対象になる。axe critical 0 を保つための a11y 契約。

## 4. `(admin)/layout.tsx` 側の契約（変更後）

```tsx
import { AdminTopbar } from "../../src/components/layout/AdminTopbar";
// ... wrapper <div> 内、<aside>...</aside> の直後:
<AdminTopbar />
```

- wrapper の `data-route-group="admin"` / `data-theme="cool"` / `data-testid="admin-shell"` / `<main data-route="admin">` は変更しない。
- import path は AdminSidebar と同じ相対形式（`../../src/components/layout/...`）。

## 5. 後方互換契約

- 既存 `(admin)/layout.spec.tsx` が assert する DOM（`data-shell="topbar"` 存在、AppShell wrapper 契約、axe critical 0）を 100% 維持。spec ファイル自体を**変更しない**ことが契約。
