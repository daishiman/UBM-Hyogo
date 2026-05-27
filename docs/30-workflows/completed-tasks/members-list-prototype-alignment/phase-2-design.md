# Phase 2 — 設計 (members-list-prototype-alignment)

> Workflow: `docs/30-workflows/members-list-prototype-alignment/`
> 前提: `phase-1-requirements.md` の AC-1..AC-8

## 1. 全体構成

`/members` の DOM 階層を以下に固定する。プロトタイプ `pages-public.jsx` L208-334 と 1:1 対応。

```
<main class="page-shell">
  <header class="page-head"> ... eyebrow / h1 / lead ... </header>
  <section class="filters-card" data-component="member-filters">
    <div class="filter-grid"> (Search + Select x N + Segmented) </div>
    <hr class="divider" />
    <p class="eyebrow">タグで絞り込み</p>
    <TagPicker />
  </section>
  <DensityToggle />
  <!-- comfy / dense -->
  <MemberGrid density="comfy|dense">
    <MemberCard density="comfy|dense" />…
  </MemberGrid>
  <!-- list -->
  <MemberGrid density="list">
    <MemberCard density="list" />…   (= 5 col row)
  </MemberGrid>
  <!-- empty -->
  <EmptyState variant="compact" />
  <PaginationMeta />
</main>
```

## 2. Primitive 配線

| 役割                     | primitive                                                | 既存 / 変更                        |
| ------------------------ | -------------------------------------------------------- | ---------------------------------- |
| アバター                 | `Avatar` (`size="md" | "sm"`)                            | 既存・変更なし                     |
| zone chip (head 右上)    | `span[data-role="zone"]` (`data-tone={zoneTone(zone)}` `dot`) | 既存 token で実装                  |
| status chip (footer)     | `span[data-role="status"]` (`data-tone={statusTone(status)}`) | 既存 token で実装                  |
| icon prefix              | `Icon` (`name="briefcase"` `name="map-pin"` `name="chevron-right"`) | icon name を追加            |
| 検索                     | `Search`                                                 | 既存                                |
| 並び替え / 絞り込み      | `Select`                                                 | 既存                                |
| 表示密度                 | `Segmented` (`DensityToggle.client.tsx`)                 | 既存・変更なし                     |
| empty state              | `EmptyState`                                             | `variant` prop を新規追加          |
| divider                  | `<hr class="divider" />`                                 | 既存 CSS class                     |
| eyebrow text             | `<p class="eyebrow">`                                    | 既存 CSS class                     |

新規 primitive 追加なし (UI alignment 不変条件 #6 準拠)。

## 3. Props 拡張表

### 3.1 `MemberCard.tsx`

```ts
type MemberCardProps = {
  member: PublicMemberListItem;
  density?: "comfy" | "dense" | "list";
};
```

レンダリング分岐:

- `density="comfy" | "dense"`: 既存 card レイアウト (`<article class="member-card" data-density={density}>`) を改修
  - head: `Avatar` + `<div data-role="identity">` (name + nickname small) + zone chip
  - body: `<ul data-role="meta">` (`Icon briefcase` + occupation / `Icon map-pin` + location)
  - footer: `<div data-role="chip-row">` (`status` chip)
- `density="list"`: `<a data-role="card-link">` で 5 col grid
  - col 1: `Avatar size="sm"`
  - col 2: `<div class="identity">` (name + small occupation)
  - col 3: `<div data-role="chip-row">` (zone chip + status chip)
  - col 4: `<span data-role="location">` location
  - col 5: `Icon name="chevron-right"`

### 3.2 `MemberGrid.tsx`

```ts
type MemberGridProps = {
  items: PublicMemberListItem[];
  density: "comfy" | "dense" | "list";
};
```

実装方針:

- 既存の `<ul data-component="member-grid" data-density={density}>` を維持し、CSS で grid (`comfy`/`dense`) と row list (`list`) を切り分ける
- list 時もこの component が `MemberCard density="list"` を map する (page.tsx での分岐撤去)

### 3.3 `EmptyState.tsx`

```ts
type EmptyStateProps = {
  icon?: IconName;
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  variant?: "default" | "compact";       // ← 新規
};
```

実装方針:

- `data-component="empty-state"` `data-variant={variant ?? "default"}` を出力
- `compact`: 48px padding / 28px icon / `<p class="small">title</p>` / ghost button 1 個
- `default`: 既存 (h2 + description + ghost button)
- 既存呼び出し (`/profile` 等) は `variant` 未指定で `"default"` 維持。後方互換あり。

### 3.4 `MemberFilters.client.tsx`

DOM 変更:

```tsx
<section class="filters-card" data-component="member-filters">
  <div class="filter-grid"> {/* Search / Select / Segmented */} </div>
  <hr class="divider" />
  <p class="eyebrow">タグで絞り込み</p>
  <TagPicker {...} />
</section>
```

## 4. CSS 変更ブロック (`apps/web/src/styles/legacy-public.css`)

### 4.1 改修対象範囲 (推定行)

| 範囲                | 既存行                | 変更内容                                                                                |
| ------------------- | --------------------- | --------------------------------------------------------------------------------------- |
| `.member-card`      | L682-696 周辺          | head 構造 / chip-row footer / list density 5 col の追加。padding/avatar/font dense 値追記 |
| `.member-grid`      | L922-1050 周辺         | `[data-density="dense"]` の grid width / `[data-density="list"]` の `flex-direction: column` |
| `[data-density="list"] a[data-role="card-link"]` | 新規 (近接ブロックへ追加) | 5 col grid (`40px minmax(...) ... 24px`) / hover background |
| `.chip-row`         | 新規                   | `display: flex; gap: var(--ubm-space-1); flex-wrap: wrap; align-items: center`       |
| `.meta-stack`       | 新規                   | `display: flex; flex-direction: column; gap: var(--ubm-space-1)`                     |
| `.empty-state.compact` (= `[data-variant="compact"]`) | 新規 | padding 48px / icon 28px / font size small                  |
| `.filters-card .divider` | 既存利用              | 確認のみ (既存 token で OK)                                                              |

### 4.2 削除対象

- 旧 `.member-card .nickname` の `@` prefix 付与系セレクタ (該当があれば)
- `MemberTable` を `/members` で分岐していたとき特有のスタイルがあれば確認 (`.member-table` 自体は残置)

## 5. Token 一覧 (使用する既存 token のみ)

| token                            | 用途                                          |
| -------------------------------- | --------------------------------------------- |
| `--ubm-color-bg-surface`         | card 背景                                     |
| `--ubm-color-bg-subtle`          | list row hover 背景                           |
| `--ubm-color-border-subtle`      | divider / card border                         |
| `--ubm-color-text-default`       | 主文字                                        |
| `--ubm-color-text-muted`         | small text / business-overview / location     |
| `--ubm-color-text-strong`        | name                                          |
| `--ubm-radius-md`                | card / list row                               |
| `--ubm-space-1` 〜 `--ubm-space-5` | gap / padding                                |
| `--ubm-font-sm` / `--ubm-font-md`| dense=13px 系 / comfy=14px 系                |

新規 token 追加なし。既存値の上書き禁止。

## 6. 状態所有権

- `density` / `query` / `filters` / `tags` / `page` の URL state は `app/(public)/members/page.tsx` (server) 所有。`MemberFilters.client.tsx` は client interaction を `next/navigation` の `useRouter().push` で URL へ反映する既存実装を維持。
- `MemberCard` / `MemberGrid` は purely presentational。state 持たない。
- `EmptyState` は presentational。`variant` は props のみ。

## 7. zoneTone / statusTone 計算

既存 helper があれば流用。無ければ `MemberCard.tsx` 内に純粋関数として定義 (テスト容易性):

```ts
function zoneTone(zone: string | undefined): ChipTone {
  switch (zone) {
    case "EAST": return "info";
    case "WEST": return "warning";
    case "CENTRAL": return "success";
    default: return "neutral";
  }
}

function statusTone(status: string | undefined): ChipTone {
  switch (status) {
    case "active": return "success";
    case "pending": return "warning";
    case "withdrawn": return "neutral";
    default: return "neutral";
  }
}
```

これら関数は `MemberCard.spec.tsx` で direct test 可能とするため `export` する。

## 8. 既存テストへの影響

| 既存 spec                                                          | 影響                                              | 対応                              |
| ------------------------------------------------------------------ | ------------------------------------------------- | --------------------------------- |
| `apps/web/src/components/public/MemberGrid.spec.tsx` (もし存在)     | density="list" の振る舞いが追加                  | 既存 case 維持 + list case 追加  |
| `apps/web/src/components/feedback/EmptyState.spec.tsx` (もし存在)   | `variant` の default fallback 検証が必要         | default case の追加で対応        |
| `apps/web/app/(public)/members/page.spec.tsx`                       | `MemberTable` import が消えるため snapshot 影響可 | snapshot 再生成 (Phase 6 で対応) |

既存 `MemberCard*.spec.tsx` / `MemberFilters.client.spec.tsx` / `EmptyState.component.spec.tsx` / `MemberGrid.spec.tsx` に list density / heading / compact marker の regression case を追加する。

## 9. data-* 属性 (gate / 検証用)

- `<article class="member-card" data-density={density} data-zone={member.zone}>`
- `<div class="member-grid" data-density={density}>`
- `<a data-role="card-link">`
- `<section class="filters-card" data-component="member-filters">`
- `<div data-component="empty-state" data-variant={variant ?? "default"}>`

verify-design-tokens gate と Playwright selector の両方で使用する。

## 10. 後方互換性

- `EmptyState` の既存呼び出しは `variant` 未指定 → `"default"` で挙動維持
- `MemberGrid` の既存呼び出しは `density="comfy"` か `density="dense"` のみ → 影響なし
- `MemberCard` props 拡張は optional のみ → 影響なし
- `MemberTable.tsx` はファイル残置 (削除しない)

## DoD

- [x] 全 AC に対する設計の対応関係が表現されている (AC-1..AC-8)
- [x] props 拡張が型単位で記述されている (4 component)
- [x] CSS 変更ブロックの行範囲と新規 class 名が列挙されている
- [x] 使用する token がすべて既存である (新規 token 0)
- [x] 状態所有権の境界が明示されている
- [x] 既存テストへの影響が列挙されている
