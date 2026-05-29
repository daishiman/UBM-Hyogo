<!-- workflow: members-list-ux-clarity / task: B / phase: 2 -->

[実装区分: 実装仕様書]

# Phase 2 — 設計 (Task B: member-filters-live-affordance)

> 前提: [phase-1-requirements.md](./phase-1-requirements.md)
> 親 Phase 2 § 3 (MemberFilters live-filter affordance) を本タスクが詳細化

## 1. 設計方針

| 原則 | 適用 |
| ---- | ---- |
| 既存 primitive 維持 | `FormField` / `Search` / `Select` / `TagPicker` のみ。新 primitive 0 件 |
| URL query SSOT | 全ての state は URL から復元、内部 state は `expanded` のみ |
| 加法的拡張 | `SelectedFiltersBar` 新規 / 旧 `SelectedTagsBar` は wrapper として残存 |
| OKLch tokens のみ | hint / live region / chip 強調色は `--ubm-color-*` |
| 後方互換 | 既存 spec の selector / aria-label / data-role を破壊しない |

## 2. UI 構造 (After)

```jsx
<form
  role="search"
  aria-label="メンバー絞り込み"
  aria-describedby="member-filters-hint"
  data-component="member-filters"
  data-expanded={expanded ? "true" : "false"}
  onSubmit={(e) => e.preventDefault()}
>
  <FiltersSummaryMobile ... />

  <div data-role="filters-body">
    <div data-role="filter-grid">
      <FormField name="member-search" label="キーワード検索">
        <Search value={initial.q} onChange={(v) => update({ q: v })} ... />
        <small
          id="member-filters-hint"
          data-role="live-filter-hint"
        >
          入力すると自動で絞り込まれます (Enter 不要)
        </small>
      </FormField>
      <FormField name="member-zone" label="UBM区画"><Select ... /></FormField>
      <FormField name="member-status" label="参加ステータス"><Select ... /></FormField>
      <FormField name="member-sort" label="並び替え"><Select ... /></FormField>
      {/* ← 旧 [data-role="clear"] button は filter-grid から削除 */}
    </div>

    <TagPicker ... />

    <SelectedFiltersBar
      filters={{ q: initial.q, zone: initial.zone, status: initial.status, tag: initial.tag }}
      hasFilters={hasFilters}
      onClearOne={onClearOne}
      onClearAll={onClear}
      labels={SELECTED_FILTERS_LABELS}
    />

    <output
      data-role="result-count"
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      {resultCountText}
    </output>
  </div>
</form>
```

## 3. `SelectedFiltersBar` 設計

### 3.1 ファイル配置

- 新規: `apps/web/src/components/public/SelectedFiltersBar.client.tsx`
- 旧 `SelectedTagsBar.client.tsx` は wrapper として残存 (後方互換)

### 3.2 Props / 型

```ts
export type SelectedFilterKey = "q" | "zone" | "status" | "tag";

export interface SelectedFiltersBarFilters {
  q: string;        // "" 以外で chip 化
  zone: string;     // "all" 以外で chip 化
  status: string;   // "all" 以外で chip 化
  tag: string[];    // 各 tag を chip 化
  // sort は除外 (親 Phase 3 § 6)
}

export interface SelectedFiltersBarLabels {
  q: (value: string) => string;     // 例: (v) => `キーワード: ${v}`
  zone: Record<string, string>;     // { "0_to_1": "ゾーン: 0→1", ... }
  status: Record<string, string>;   // { "member": "種別: 正会員", ... }
  tag: (code: string) => string;    // 例: (c) => `#${c}`
}

export interface SelectedFiltersBarProps {
  filters: SelectedFiltersBarFilters;
  hasFilters: boolean;
  onClearOne: (key: SelectedFilterKey, value?: string) => void;
  onClearAll: () => void;
  labels?: Partial<SelectedFiltersBarLabels>;
}

export function SelectedFiltersBar(props: SelectedFiltersBarProps): JSX.Element | null;
```

### 3.3 描画ルール

- `hasFilters === false` のとき `null` 返却 (bar 全体非描画)
- chip 並び順: `q` → `zone` → `status` → `tag[0..n]` (URL key 出現順 + tag 配列順)
- 各 chip: `<button data-component="tag-pill" data-filter-key="{key}" data-filter-value="{value}" aria-label="<ラベル>絞り込みを解除" onClick={() => onClearOne(key, value)}>{label} ×</button>`
- 右端の clear-all: `<button data-role="clear-all" data-role-alias="clear" onClick={onClearAll}>すべてクリア</button>`
  - 後方互換のため `data-role="clear"` も併設可能だが、既存 spec のテスト修正方針 (Phase 4) と合わせる
- root: `<div data-component="selected-filters-bar" data-empty="false">`

### 3.4 chip ラベル写像表 (default labels)

| key | value | 表示ラベル | aria-label |
| --- | ----- | ---------- | ---------- |
| `q` | `<任意文字列>` | `キーワード: <値>` | `キーワード絞り込みを解除` |
| `zone` | `0_to_1` | `ゾーン: 0→1` | `ゾーン絞り込みを解除` |
| `zone` | `1_to_10` | `ゾーン: 1→10` | `ゾーン絞り込みを解除` |
| `zone` | `10_to_100` | `ゾーン: 10→100` | `ゾーン絞り込みを解除` |
| `status` | `member` | `種別: 正会員` | `種別絞り込みを解除` |
| `status` | `non_member` | `種別: 非会員` | `種別絞り込みを解除` |
| `status` | `academy` | `種別: アカデミー` | `種別絞り込みを解除` |
| `tag` | `<code>` | `#<code>` | `タグ<code>を解除` |

未知の `zone` / `status` 値は chip 化しない (`all` も非描画と同義)。

## 4. `MemberFilters` 変更点

### 4.1 Props 拡張

```ts
export interface MemberFiltersProps {
  initial: MembersSearch;
  topTags?: TagPickerOption[];
  // 新規
  totalCount?: number;       // 既定: 0
  displayedCount?: number;   // 既定: 0
}
```

### 4.2 `hasFilters` 計算式 (変更なし)

```ts
const hasFilters =
  initial.q !== "" ||
  initial.zone !== "all" ||
  initial.status !== "all" ||
  initial.tag.length > 0 ||
  initial.sort !== "recent";
```

> 注: `sort` も `hasFilters` には含むが、`SelectedFiltersBar` の chip 列には含めない (親 Phase 3 § 6 / AC-B-3 の方針)。

### 4.3 `onClearOne` 実装

```ts
const onClearOne = useCallback(
  (key: SelectedFilterKey, value?: string) => {
    if (key === "tag" && value) {
      update({ tag: initial.tag.filter((t) => t !== value) });
    } else if (key === "q") {
      update({ q: "" });
    } else if (key === "zone") {
      update({ zone: "all" });
    } else if (key === "status") {
      update({ status: "all" });
    }
  },
  [update, initial.tag],
);
```

### 4.4 件数文言

```ts
const resultCountText = (() => {
  if (totalCount === 0) return "該当者なし";
  if (totalCount === displayedCount) return `${totalCount} 件を表示しています`;
  return `${totalCount} 件中 ${displayedCount} 件を表示しています`;
})();
```

### 4.5 aria-live 設計

- `<output>` は 1 箇所のみ (`data-role="result-count"`)
- `aria-live="polite"` / `aria-atomic="true"` / `role="status"` を併設
- React の自然な再 render に任せ、debounce や手動 announce トリガは設けない (親 Phase 3 § 4 採用根拠)

### 4.6 旧 clear button の扱い

- `filter-grid` 末尾の `<button data-role="clear" disabled={!hasFilters}>` は **削除**
- `SelectedFiltersBar` 内 clear-all button にロジックを統合
- 既存 spec の「`hasFilters=false` のとき clear が disabled」検証は「`SelectedFiltersBar` が非描画 (null)」検証に Phase 4 で置換する (AC-B-7 / R-B-3)

## 5. `page.tsx` 連携設計

### 5.1 差分

```diff
       <MemberFilters
         initial={search}
         topTags={listResult.ok ? listResult.data.topTags : []}
+        totalCount={listResult.ok ? listResult.data.pagination.total : 0}
+        displayedCount={listResult.ok ? listResult.data.items.length : 0}
       />
```

### 5.2 既存 `<p data-role="pagination-meta">` の扱い

- 機械可読 metadata として **維持**する
- ユーザー向け aria-live announcement は `MemberFilters` 内 `<output>` の 1 箇所だけ
- 二重読み上げを避けるため `pagination-meta` には aria-live を付けない

## 6. URL query 互換 (INV-2)

| key | 取扱 |
| --- | ---- |
| `q` | 不変。chip × で `""` に reset |
| `zone` | 不変。chip × で `"all"` に reset |
| `status` | 不変。chip × で `"all"` に reset |
| `sort` | 不変。chip 化しない |
| `tag` | 不変。chip × で当該 tag を配列から除外 (既存 `onTagToggle` を再利用) |
| `density` | 不変 (Task A) |

`update()` 関数は変更しない。`URLSearchParams` 経由の `router.replace` 既存挙動を維持。

## 7. data-* / CSS selector 一覧

| selector | 用途 |
| -------- | ---- |
| `[data-component="member-filters"]` | root form |
| `[data-component="member-filters"][aria-describedby="member-filters-hint"]` | hint 紐付け確認用 |
| `[data-role="live-filter-hint"]` | 即発火 microcopy |
| `[data-role="result-count"]` / `[role="status"]` | live region |
| `[data-component="selected-filters-bar"]` | chip 列 root |
| `[data-component="selected-filters-bar"] [data-component="tag-pill"]` | 各 chip (旧 `SelectedTagsBar` 互換) |
| `[data-component="selected-filters-bar"] [data-filter-key="q"]` | キーワード chip |
| `[data-component="selected-filters-bar"] [data-filter-key="zone"]` | ゾーン chip |
| `[data-component="selected-filters-bar"] [data-filter-key="status"]` | 種別 chip |
| `[data-component="selected-filters-bar"] [data-filter-key="tag"][data-filter-value="..."]` | tag chip |
| `[data-component="selected-filters-bar"] [data-role="clear-all"]` | 統合 clear button |

## 8. `SelectedTagsBar` 後方互換 wrapper

```ts
// SelectedTagsBar.client.tsx (新)
"use client";

import { SelectedFiltersBar } from "./SelectedFiltersBar.client";

export interface SelectedTagsBarProps {
  selected: string[];
  onRemove: (code: string) => void;
  onClearAll: () => void;
}

/** @deprecated SelectedFiltersBar を直接利用してください */
export function SelectedTagsBar(props: SelectedTagsBarProps) {
  return (
    <SelectedFiltersBar
      filters={{ q: "", zone: "all", status: "all", tag: props.selected }}
      hasFilters={props.selected.length > 0}
      onClearOne={(key, value) => {
        if (key === "tag" && value) props.onRemove(value);
      }}
      onClearAll={props.onClearAll}
    />
  );
}
```

`/members` 経路は新規 `SelectedFiltersBar` を直接呼ぶため wrapper を経由しないが、他 route から `SelectedTagsBar` が import されている場合に備える (R-B-1)。

## 9. テスト戦略 (詳細は Phase 4)

| 観点 | 場所 |
| ---- | ---- |
| 既存 7 ケース後方互換 | `MemberFilters.client.spec.tsx` (修正) |
| AC-B-1 hint + aria-describedby | `MemberFilters.client.spec.tsx` (追加) |
| AC-B-2 result-count `role="status"` | `MemberFilters.client.spec.tsx` (追加) |
| AC-B-3..4 chip 描画 / 個別解除 | `SelectedFiltersBar.client.spec.tsx` (新規) |
| AC-B-5 hasFilters=false 未描画 | `SelectedFiltersBar.client.spec.tsx` (新規) |
| AC-B-3 sort 非含有 | `SelectedFiltersBar.client.spec.tsx` (新規) |

## 10. open questions

- chip 列が長くなったとき折返しか横スクロールか → 親 Phase 3 § 6 で折返し採用済
- result-count 文言 → 親 Phase 3 § 6 で `"X 件中 Y 件を表示しています"` / 0 件時 `"該当者なし"` 採用済
- 並び替えを chip 化するか → 親 Phase 3 § 6 で除外採用済

## 11. DoD

- [x] UI 構造 (After) を擬似コードで明示
- [x] `SelectedFiltersBar` props / 型 / 描画ルールを記述
- [x] chip ラベル写像表を提示
- [x] `hasFilters` 計算式と `onClearOne` 実装案を提示
- [x] aria-live 設計を 1 箇所 (`<output>`) に集約
- [x] data-* / CSS selector 一覧を提示
- [x] URL query 互換性を表で示す
- [x] 後方互換 wrapper の設計を示す
