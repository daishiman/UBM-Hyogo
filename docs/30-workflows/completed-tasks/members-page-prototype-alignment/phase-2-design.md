# Phase 2: 設計（DOM / CSS / コンポーネント）

## 1. コンポーネント差分設計

### 1.1 `DensityToggle.client.tsx`

**現状**: RadioGroup + FormField + 3 個の `<input type="radio">` をラベルで包む構造。
**変更後**: 既存 `Segmented` primitive を呼ぶシン client component。

```tsx
// apps/web/src/components/public/DensityToggle.client.tsx (after)
"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Segmented } from "@/components/ui/Segmented";

type Density = "comfy" | "dense" | "list";
const OPTIONS: ReadonlyArray<{ value: Density; label: string }> = [
  { value: "comfy", label: "ゆったり" },
  { value: "dense", label: "密" },
  { value: "list", label: "リスト" },
];

export function DensityToggle({ value }: { value: Density }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  return (
    <Segmented
      ariaLabel="表示密度"
      data-component="density-toggle"
      value={value}
      options={OPTIONS}
      onChange={(next) => {
        const params = new URLSearchParams(sp.toString());
        if (next === "comfy") params.delete("density");
        else params.set("density", next);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }}
    />
  );
}
```

`Segmented` の現行 API（`value` / `options` / `onChange`）に `ariaLabel` と `data-component` を渡す。`Segmented.tsx` 側に未対応プロパティがあれば Phase 5 で 1〜2 行追加（`...rest` を root に spread）。

### 1.2 `MemberFilters.client.tsx`

DOM 構造をプロトタイプ準拠に整理:

```tsx
<form role="search" aria-label="メンバー絞り込み" data-component="member-filters">
  <div data-role="filter-grid">
    <FormField label="キーワード検索"><Search ... /></FormField>
    <FormField label="UBM区画"><Select ... /></FormField>
    <FormField label="参加ステータス"><Select ... /></FormField>
    <FormField label="並び替え"><Select ... /></FormField>
    <button type="button" data-role="clear" disabled={!hasFilters}>クリア</button>
  </div>
  {activeTags.length > 0 && (
    <ul data-role="active-tags">{/* ...existing... */}</ul>
  )}
</form>
```

> tag-pill 候補一覧は既存 API / URL state の active tag 表示のみを対象にする。プロトタイプの候補一覧は本 workflow の正本対象外であり、今回の `/members` 乖離解消 DoD には含めない。

### 1.3 `MemberCard.tsx`

`data-density` propagation を保証し、内部 markup は以下:

```tsx
<article data-component="member-card" data-density={density}>
  <div data-role="head">
    <Avatar memberId={m.memberId} size={density === "comfy" ? "lg" : "md"} />
    <div data-role="identity">
      <p data-role="name">{m.fullName}</p>
      {m.nickname && <p data-role="nickname">{m.nickname}</p>}
    </div>
    {m.ubmZone && <span data-role="zone" data-tone={zoneTone(m.ubmZone)}>{m.ubmZone}</span>}
  </div>
  <ul data-role="meta">
    {m.occupation && <li>{m.occupation}</li>}
    {m.location && <li>{m.location}</li>}
  </ul>
  {m.ubmMembershipType && (
    <span data-role="status" data-tone={statusTone(m.ubmMembershipType)}>{m.ubmMembershipType}</span>
  )}
</article>
```

### 1.4 `MemberTable.tsx`

list density 用に 5 列 grid 行（avatar / name+occupation / zone+status / location / chevron）を `[data-component="member-table"]` 配下に出力。`<table>` を使わず `<ul>` + `<li role="row">` のセマンティクスでも可（プロトタイプも div ベース）。本タスクでは既存 `<table>` を保ち CSS のみで grid 化する選択肢を採用（差分最小化）。

### 1.5 `PublicHeader.tsx` / `PublicFooter.tsx`

DOM は現状維持を基本にする。`data-component="public-header"` / `"public-footer"` の attribute を確実に出力し、`PublicHeader` は current pathname を受け取るか server 側で route を渡して `/members` link に `aria-current="page"` を出す。スタイル付与は CSS 側で完結する。

## 2. CSS 追加設計（`apps/web/src/styles/legacy-public.css` 末尾に `@layer components` 内追記）

下記 selector を追加。値は全て既存 token のみ参照（HEX 直書きしない）。

```css
@layer components {
  /* === public chrome === */
  [data-component="public-header"] {
    display: flex; align-items: center; justify-content: space-between;
    gap: var(--ubm-space-6);
    padding: var(--ubm-space-4) var(--ubm-space-6);
    background: var(--ubm-color-surface-panel);
    border-bottom: 1px solid var(--ubm-color-border-default);
  }
  [data-component="public-header"] [data-role="brand"] {
    font-weight: 700; color: var(--ubm-color-text-primary); text-decoration: none;
  }
  [data-component="public-header"] nav ul {
    display: flex; gap: var(--ubm-space-4); list-style: none; padding: 0; margin: 0;
  }
  [data-component="public-header"] nav a {
    color: var(--ubm-color-text-secondary); text-decoration: none; font-size: 14px;
  }
  [data-component="public-header"] nav a[aria-current="page"] {
    color: var(--ubm-color-text-primary); font-weight: 600;
  }
  [data-component="public-header"] [data-role="auth-cta"] {
    display: inline-flex; align-items: center; height: 36px; padding: 0 var(--ubm-space-4);
    border-radius: var(--ubm-radius-sm); background: var(--ubm-color-accent);
    color: var(--ubm-color-surface-panel); text-decoration: none; font-weight: 600;
  }

  [data-component="public-footer"] {
    display: flex; align-items: center; justify-content: space-between;
    gap: var(--ubm-space-4);
    padding: var(--ubm-space-6); margin-top: var(--ubm-space-12);
    border-top: 1px solid var(--ubm-color-border-default);
    color: var(--ubm-color-text-muted); font-size: 12px;
  }
  [data-component="public-footer"] ul {
    display: flex; gap: var(--ubm-space-4); list-style: none; padding: 0; margin: 0;
  }

  /* === page head === */
  .page-head {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: var(--ubm-space-4); margin-bottom: var(--ubm-space-8);
  }
  .page-head .eyebrow {
    font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--ubm-color-text-muted); font-weight: 500; margin-bottom: var(--ubm-space-2);
  }
  .page-head h1 {
    font-size: 32px; line-height: 1.15; letter-spacing: -0.025em; font-weight: 600; margin: 0;
  }
  .page-head [data-role="lead"] {
    color: var(--ubm-color-text-muted); font-size: 13.5px; margin-top: var(--ubm-space-2);
  }

  /* === density toggle (Segmented) === */
  [data-component="density-toggle"] {
    display: inline-flex; padding: 3px;
    background: var(--ubm-color-surface-bg);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: 10px;
  }
  [data-component="density-toggle"] [role="radio"] {
    padding: 6px 12px; font-size: 12.5px; font-weight: 500; border-radius: 7px;
    background: transparent; border: none; color: var(--ubm-color-text-secondary); cursor: pointer;
  }
  [data-component="density-toggle"] [role="radio"][aria-checked="true"] {
    background: var(--ubm-color-surface-panel); color: var(--ubm-color-text-primary);
    box-shadow: var(--ubm-shadow-xs);
  }

  /* === member filters === */
  [data-component="member-filters"] {
    background: var(--ubm-color-surface-panel);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-lg, 16px);
    padding: var(--ubm-space-4);
    margin-bottom: var(--ubm-space-4);
  }
  [data-component="member-filters"] [data-role="filter-grid"] {
    display: grid; gap: var(--ubm-space-3);
    grid-template-columns: 1.5fr 1fr 1fr 1fr auto;
    align-items: end;
  }
  [data-component="member-filters"] [data-role="clear"] {
    height: 40px; padding: 0 var(--ubm-space-4);
    background: transparent;
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-sm);
    color: var(--ubm-color-text-secondary);
  }
  [data-component="member-filters"] [data-role="clear"]:disabled {
    opacity: 0.5; cursor: not-allowed;
  }

  /* === member grid densities === */
  [data-component="member-grid"][data-density="comfy"] {
    display: grid; gap: 18px;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
  [data-component="member-grid"][data-density="dense"] {
    display: grid; gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }

  /* === member card variants === */
  [data-component="member-card"] {
    background: var(--ubm-color-surface-panel);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-lg, 16px);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  [data-component="member-card"][data-density="comfy"] { padding: 22px; }
  [data-component="member-card"][data-density="dense"] { padding: 14px; font-size: 13px; }
  [data-component="member-card"]:hover {
    border-color: var(--ubm-color-border-strong);
    box-shadow: var(--ubm-shadow-sm);
  }

  /* === member table (list density) === */
  [data-component="member-table"] {
    width: 100%; border-collapse: separate; border-spacing: 0;
    background: var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-lg, 16px); overflow: hidden;
  }
  [data-component="member-table"] thead th {
    background: var(--ubm-color-surface-bg);
    padding: 10px 18px;
    font-size: 11px; font-weight: 500; color: var(--ubm-color-text-muted);
    letter-spacing: 0.08em; text-transform: uppercase; text-align: left;
  }
  [data-component="member-table"] tbody tr {
    display: grid;
    grid-template-columns: minmax(220px, 1.5fr) minmax(96px, 0.7fr) minmax(120px, 1fr) minmax(120px, 1fr) auto;
    align-items: center;
    background: var(--ubm-color-surface-panel);
  }
  [data-component="member-table"] tbody tr:hover {
    background: var(--ubm-color-surface-panel-2);
  }
  [data-component="member-table"] tbody td {
    padding: 14px 18px; border-top: 1px solid var(--ubm-color-border-default);
    font-size: 13px; color: var(--ubm-color-text-primary);
  }

  /* === empty state === */
  [data-component="empty-state"] {
    background: var(--ubm-color-surface-panel);
    border: 1px solid var(--ubm-color-border-default);
    border-radius: var(--ubm-radius-lg, 16px);
    padding: 48px 24px; text-align: center;
    color: var(--ubm-color-text-muted); font-size: 13.5px;
  }

  /* === responsive === */
  @media (max-width: 900px) {
    [data-component="public-header"] { padding: var(--ubm-space-3) var(--ubm-space-4); }
    [data-component="public-header"] nav ul { gap: var(--ubm-space-3); }
    [data-component="member-filters"] [data-role="filter-grid"] { grid-template-columns: 1fr; }
    .page-head { flex-direction: column; align-items: flex-start; gap: var(--ubm-space-3); }
  }
}
```

## 3. 入出力・副作用

| 関数 / コンポーネント | 入力 | 出力 | 副作用 |
|---|---|---|---|
| `DensityToggle({ value })` | `value: Density` (`"comfy"|"dense"|"list"`) | `Segmented` JSX | URL query `density` を `router.replace` で書換（scroll: false） |
| `MemberFilters({ search, totalCount })` | URL state | `<form>` JSX | 各 control 変更時に `router.replace` で URL 書換 |
| `MemberCard({ member, density })` | `PublicMemberListItem` + density | `<article>` JSX | なし |
| `MemberTable({ items })` | items 配列 | `<table>` JSX | なし |
| `EmptyState({ onClear })` | clear callback | `<div role="status">` | なし |

## 4. 既存 API との接続点

| 項目 | 内容 |
|---|---|
| endpoint | `GET /public/members` |
| query | `q`, `zone`, `status`, `tag[]`, `sort`, `density` |
| response | `PublicMemberListView` (`items`, `pagination`, `appliedQuery`, `generatedAt`) |
| 変更 | **なし**（CONST: `apps/api` 側無変更） |

## 5. 完了条件

- すべての DOM / CSS 差分が本ファイルに記述されている
- 既存 token / primitive のみ参照していることが明示されている
- 次フェーズで設計レビュー可能な粒度に達している
