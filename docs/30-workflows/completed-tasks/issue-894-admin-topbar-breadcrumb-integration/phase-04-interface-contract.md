# Phase 4: Interface Contract

## 1. Overview

本タスクで触れる primitive / component の interface 契約を明文化する。本タスクは **interface を一切変更しない**（slot signature / props 不変）。

## 2. AdminTopbar props（不変）

```ts
// apps/web/src/components/layout/AdminTopbar.tsx
type AdminTopbarProps = {
  breadcrumb?: ReactNode;  // 既定: "管理" (固定文字列)
  actions?: ReactNode;
};
```

- `breadcrumb` slot に `ReactNode` を渡せる。
- 本タスクは `<Breadcrumb items=[...]/>` を渡す形に呼び出し側を変えるのみ。

## 3. Breadcrumb props（不変）

```ts
// apps/web/src/components/admin/Breadcrumb.tsx
type BreadcrumbItem = {
  label: string;
  href?: string;
};
type BreadcrumbProps = {
  items: ReadonlyArray<BreadcrumbItem>;
};
```

- `items.length === 0` の場合 `null` を返す（既存契約）。
- 最終 item は href 有無に関わらず current `<span aria-current="page">` として描画される。
- `<nav data-component="breadcrumb" aria-label="breadcrumb" class="ui-breadcrumb">` を出力。

## 4. AdminPageHeader props（不変）

```ts
// apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx
type AdminPageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: ReadonlyArray<{ label: string; href?: string }>;
  actions?: ReactNode;
};
```

- `breadcrumbs` は内部で `<Breadcrumb items={breadcrumbs}/>` に委譲される。
- 本タスクは呼び出し側（admin page）の `breadcrumbs` 配列を「現在地のみ」へ縮小する。

## 5. data-* 契約一覧（本タスクで保証）

| selector | 出処 | 本タスクでの扱い |
|----------|------|------------------|
| `[data-route-group="admin"]` | `(admin)/layout.tsx` の AppShell wrapper | 触らない |
| `[data-route="admin"]` | 同上 | 触らない |
| `[data-theme="cool"]` | 同上 | 触らない |
| `[data-testid="admin-shell"]` | 同上 | 触らない |
| `[data-shell="topbar"]` | AdminTopbar 内 `<header>` | 触らない（維持） |
| `[data-component="admin-breadcrumb-slot"]` | AdminTopbar 内 slot wrapper | 触らない（維持） |
| `[data-component="breadcrumb"]` | Breadcrumb primitive `<nav>` | **slot 内に新規出現**（assertion 追記対象） |
| `[data-component="admin-topbar-actions"]` | AdminTopbar 内 actions slot wrapper | 触らない |

## 6. a11y 契約（不変）

- `<nav aria-label="breadcrumb">`: Breadcrumb primitive で常時付与
- `<span aria-current="page">`: 最終 item に常時付与
- axe critical violation: 0 を維持
