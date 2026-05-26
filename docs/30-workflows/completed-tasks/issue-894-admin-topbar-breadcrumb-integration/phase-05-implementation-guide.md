# Phase 5: Implementation Guide — before/after 差分

## 1. Overview

確実に実装できる粒度で各ファイルの before/after を示す。本改善サイクルで T1-T4 は実コードへ反映済み。commit / push / PR のみユーザー承認後に行う。

## 2. T1: `apps/web/app/(admin)/layout.tsx`

### 2.1 import 追加

```ts
import { Breadcrumb } from "../../src/components/admin/Breadcrumb";
```

> `(admin)/layout.tsx` は既存 import と同じ relative path を使い、local style に合わせる。

### 2.2 AdminTopbar 呼び出し変更

before（line 36 付近）:

```tsx
<AdminTopbar />
```

after:

```tsx
<AdminTopbar
  breadcrumb={<Breadcrumb items={[{ label: "管理" }]} />}
/>
```

### 2.3 確認事項

- `(admin)/layout.tsx` の冒頭から `"use client"` 宣言が **無い** ことを確認（server component 維持）。
- `getSession()` 呼び出し / `export const dynamic = "force-dynamic"` 等の既存挙動を一切変えない。
- 他の AppShell wrapper props（`data-route-group="admin"` 等）を触らない。

## 3. T2: `apps/web/app/(admin)/admin/page.tsx`

before（line 28 付近）:

```tsx
<AdminPageHeader
  title="ダッシュボード"
  breadcrumbs={[
    { label: "管理", href: "/admin" },
    { label: "ダッシュボード" },
  ]}
/>
```

after:

```tsx
<AdminPageHeader
  title="ダッシュボード"
  breadcrumbs={[{ label: "ダッシュボード" }]}
/>
```

## 4. T3: `apps/web/app/(admin)/admin/members/page.tsx`

before（line 74 付近）:

```tsx
<AdminPageHeader
  title="会員管理"
  breadcrumbs={[
    { label: "管理", href: "/admin" },
    { label: "会員管理" },
  ]}
  // 他 props は維持
/>
```

after:

```tsx
<AdminPageHeader
  title="会員管理"
  breadcrumbs={[{ label: "会員管理" }]}
  // 他 props は維持
/>
```

## 5. T4: `apps/web/app/(admin)/layout.spec.tsx`

### 5.1 追記 assertion（イメージ）

```ts
it("topbar の breadcrumb slot 内に Breadcrumb primitive が描画される", async () => {
  const { container } = render(await Layout({ children: <div /> }));
  const slot = container.querySelector('[data-component="admin-breadcrumb-slot"]');
  expect(slot).not.toBeNull();
  const breadcrumb = slot!.querySelector('[data-component="breadcrumb"]');
  expect(breadcrumb).not.toBeNull();
  // ルートトップラベル「管理」が current label として描画される
  expect(breadcrumb!.querySelector('[aria-current="page"]')?.textContent).toBe("管理");
  expect(breadcrumb!.querySelector('a[href="/admin"]')).toBeNull();
});
```

### 5.2 既存 assertion の維持

- `data-shell="topbar"` 検出: 維持
- `data-component="admin-breadcrumb-slot"` 検出: 維持
- `[data-route-group="admin"]` / `[data-route="admin"]` / `[data-theme="cool"]` / `[data-testid="admin-shell"]`: 維持
- 既存 axe assertion: 維持（critical 0）

### 5.3 spec 実装メモ

- `Layout` は async server component のため、テストでは `await Layout({ children })` で React 要素を取得してから `render` する（既存 spec の手法を踏襲）。
- `getSession()` のモック方針は既存 spec に従う。新規モックは追加しない。

## 6. T2 拡張: page-local breadcrumb consumer 8 件

以下の page-local breadcrumb から `{ label: "管理", href: "/admin" }` を除去する。

- `apps/web/app/(admin)/admin/page.tsx`
- `apps/web/app/(admin)/admin/members/page.tsx`
- `apps/web/app/(admin)/admin/requests/page.tsx`
- `apps/web/app/(admin)/admin/tags/page.tsx`
- `apps/web/app/(admin)/admin/schema/page.tsx`
- `apps/web/app/(admin)/admin/audit/page.tsx`
- `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`
- `apps/web/app/(admin)/admin/meetings/page.tsx`

検証: `grep -rn 'label: "管理"' "apps/web/app/(admin)/admin/" || echo "0 hit"` が 0 hit。

## 7. import path / alias 一貫性

- `(admin)/layout.tsx` は既存の relative import 方針を維持する。
- 既存 admin page の `@/components/admin/Breadcrumb` import は変更しない。

## 8. 禁止事項（再掲）

- `"use client"` を `(admin)/layout.tsx` に持ち込まない
- `usePathname` / `useRouter` 等の client API を layout / topbar に持ち込まない
- HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を増やさない
- 新規 primitive を作らない
- D1 / API endpoint / Google Form 仕様に触れない
