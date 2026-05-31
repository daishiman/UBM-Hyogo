# Phase 5: 実装手順

- Task ID: issue-1006-members-selected-filters-chip-ux-hardening
- 区分: 実装仕様書（後続実装者がそのまま着手できる手順）

---

## 0. ファイル一覧（新規 / 修正）[Feedback RT-03]

本タスクは **新規作成ファイルなし**。すべて既存ファイルの修正。

| パス | 種別 | 変更概要 |
|------|------|----------|
| `apps/web/src/components/public/SelectedFiltersBar.client.tsx` | 修正 | `tagLabels` / `onEmpty` prop 追加、tag 解決、focus 管理（refs + effect） |
| `apps/web/src/components/public/MemberFilters.client.tsx` | 修正 | `tagLabels` 導出、`onEmpty` 配線（検索入力 focus） |
| `apps/web/src/styles/legacy-public.css` | 修正 | `@media (max-width: 640px)` で縦積みレイアウト追加 |
| `apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx` | 修正 | Phase 4 ケース追加・回帰更新 |
| `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | 修正 | Phase 4 ケース追加 |

---

## 1. SelectedFiltersBar.client.tsx — tagLabels 解決

### Before（現状）

純粋関数。`SelectedFiltersBarProps = { search; onPatch; onClearAll }`。tag chip は `label: \`#${tag}\`` / `removeLabel: \`${tag} タグ絞り込みを解除\``。

### After（差分方針）

1. `import { useEffect, useRef } from "react";` を追加（既存 import の直下）。
2. props 型を拡張:

```ts
export interface SelectedFiltersBarProps {
  search: MembersSearch;
  onPatch: (patch: Partial<MembersSearch>) => void;
  onClearAll: () => void;
  /** tag code → 表示名。未登録 code は code 自身に fallback。省略時は全 code 表示 */
  tagLabels?: Readonly<Record<string, string>>;
  /** chip が 0 件になる削除時に呼ぶ（外側へ focus を逃がす用途） */
  onEmpty?: () => void;
}
```

3. 関数本体冒頭で解決ヘルパーを定義:

```ts
const resolveTag = (code: string): string =>
  Object.hasOwn(tagLabels, code) ? tagLabels[code] : code;
```

4. tag chip 生成を `resolveTag` 経由に置換:

```ts
for (const tag of search.tag) {
  const display = resolveTag(tag);
  chips.push({
    key: `tag:${tag}`,
    label: `#${display}`,
    removeLabel: `${display} タグ絞り込みを解除`,
    onRemove: () => removeChipAt(`tag:${tag}`, () =>
      onPatch({ tag: search.tag.filter((item) => item !== tag) }),
    ),
  });
}
```

> `q` / `zone` / `status` の chip も同様に `onRemove` を `removeChipAt(key, () => onPatch(...))` でラップする（§2 で `removeChipAt` を定義）。sort は引き続き chip 化しない（変更なし）。

---

## 2. SelectedFiltersBar.client.tsx — focus 管理

### 方針（Phase 2 確定）

削除クリック時に「次の chip → 無ければ前の chip → 0 件なら `onEmpty()`」を `pendingFocusRef` に記録し、`useEffect`（依存 = chips の key を join した文字列）で復帰させる。chips が 0 になる場合は bar が unmount し effect が走らないため、削除クリック時点で `onEmpty?.()` を呼ぶ。

### 実装手順

1. ref を宣言（`chips` 構築の前、関数本体上部）:

```ts
const chipRefs = useRef(new Map<string, HTMLButtonElement>());
const pendingFocusRef = useRef<string | null>(null);
```

2. chips 構築後（`if (chips.length === 0) return null;` の **前**）に削除ハンドラを定義。chips 配列の現在 index から次/前 key を決める:

```ts
function removeChipAt(key: string, apply: () => void) {
  const idx = chips.findIndex((c) => c.key === key);
  const nextKey = chips[idx + 1]?.key ?? chips[idx - 1]?.key ?? null;
  pendingFocusRef.current = nextKey; // null = もう chip が残らない
  if (nextKey === null) {
    // chips が 0 になる → bar が unmount し effect が走らないのでここで逃がす
    onEmpty?.();
  }
  apply();
}
```

> 注意: `removeChipAt` は `chips` を参照するため、`chips` を `for` で push し終えた後に定義する。ただし `chips.push` 内の `onRemove` から `removeChipAt` を呼ぶため、`onRemove` は **遅延実行のクロージャ**（クリック時に評価）であり定義順の制約はない。可読性のため `removeChipAt` を `chips` 構築ブロックの直前に関数宣言（hoisting される `function` 宣言）で置く。

3. 復帰 effect を `return null` の前に置く:

```ts
useEffect(() => {
  const target = pendingFocusRef.current;
  pendingFocusRef.current = null;
  if (target === null) return;
  const el = chipRefs.current.get(target);
  el?.focus();
}, [chips.map((c) => c.key).join("|")]);
```

> 依存配列は chips の key 列を join した文字列。chip が削除されて配列が変わると effect が再実行され、`pendingFocusRef` に記録した key の button に focus する。`eslint react-hooks/exhaustive-deps` は join 文字列を 1 依存として扱うため warning が出る可能性がある。出る場合は当該行に `// eslint-disable-next-line react-hooks/exhaustive-deps` を付与（chips 自体を依存にすると毎 render で別参照になり無限再実行のリスクがあるため、key 列の join を意図的に使う）。

4. chip button に ref を登録（JSX）:

```tsx
<button
  type="button"
  data-component="filter-chip"
  aria-label={chip.removeLabel}
  ref={(el) => {
    if (el) chipRefs.current.set(chip.key, el);
    else chipRefs.current.delete(chip.key);
  }}
  onClick={chip.onRemove}
>
  {chip.label} ×
</button>
```

5. clear-all button には focus 復帰用 ref を持たせない。chip 削除後 focus は次 chip / 前 chip / `onEmpty` のみに限定する。

---

## 3. MemberFilters.client.tsx — tagLabels 導出 + onEmpty 配線

### 方針

`topTags`（`TagPickerOption[]`）から `tagLabels` を導出し `SelectedFiltersBar` に渡す。`onEmpty` で検索入力に focus を戻す。

### 検索入力 focus の二択（観測挙動は Phase 4 / Phase 6 test が固定）

| 方式 | 内容 | 採否 |
|------|------|------|
| A. id 参照 | `Search` に `id="member-search-input"` を渡し、`document.getElementById("member-search-input")?.focus()` | 現行実装で採用 |
| B. querySelector fallback | form 内の `input[type="search"]` 相当を `formRef.current?.querySelector(...)?.focus()` | `Search` が ref 転送に未対応の場合の fallback |

> 現行実装は A を採用する。`Search` は `id` / `name` を透過するため、ref 転送を追加せず観測挙動（クリック後に検索 input が `document.activeElement`）を固定できる。

### 実装手順

1. `import { useCallback, useRef, useState } from "react";`（`useRef` 追加）。
2. `tagLabels` を導出（`update` の近く、render より前）:

```ts
const tagLabels = useMemo(
  () => Object.fromEntries(topTags.map((t) => [t.code, t.label])),
  [topTags],
);
```

`useMemo` を import に追加。

3. focus 対象の検索 input id を固定:

```ts
<Search id="member-search-input" name="member-search" ... />
```

4. `onEmpty` ハンドラ:

```ts
const focusSearchInput = useCallback(() => {
  if (!isBrowser()) return;
  document.getElementById("member-search-input")?.focus();
}, []);
```

5. `SelectedFiltersBar` 呼び出しに prop を追加:

```tsx
<SelectedFiltersBar
  search={initial}
  tagLabels={tagLabels}
  onPatch={update}
  onClearAll={onClear}
  onEmpty={focusSearchInput}
/>
```

> `topTags` のみが tag label の正本（不変条件）。`tagLabels` は topTags 由来のみで構築し、その他のソースから補完しない。

---

## 4. legacy-public.css — mobile 縦積みブロック

### 方針

`@media (max-width: 640px)` で `[data-component="selected-filters-bar"]` を縦積みに。selector は data-component 配下に閉じ、`var(--ubm-...)` トークンのみ使用（HEX 直書き禁止）。既存の `[data-component="selected-filters-bar"]`（display:flex / space-between）ブロック（legacy-public.css の 1375 行付近）の **直後** か、ファイル末尾の既存メディアクエリ群に合わせて追加。

### 追加ブロック

```css
@media (max-width: 640px) {
  [data-component="selected-filters-bar"] {
    flex-direction: column;
    align-items: stretch;
    gap: var(--ubm-space-2);
  }
  [data-component="selected-filters-bar"] [data-role="clear-all"] {
    align-self: flex-end;
  }
}
```

> - `[data-role="active-filters"]`（chip リスト）は既存の `flex-wrap: wrap` のままで良い（縦積みの親の中で chip 群は wrap 継続）。
> - HEX / `bg-[#...]` / `text-[#...]` を一切書かない（AC-7 / `verify-design-tokens` gate）。
> - 既存の `[data-component="member-filters"]` スコープと整合させるため、必要に応じ `[data-component="member-filters"] [data-component="selected-filters-bar"]` のように親スコープを付けるが、Phase 2 設計は「data-component 配下に閉じる」ため上記の `[data-component="selected-filters-bar"]` 単独 selector で可。既存ファイルの記法（member-filters プレフィックス）に合わせて統一すること。

---

## 5. 既存 spec 期待値の更新

§Phase 4 §3 に従う:

- `SelectedFiltersBar.client.spec.tsx`: `tagLabels` を渡す新規ケースは表示名、渡さないケースは code のまま。既存「q/zone/status/tag を chip 化」ケースは `tagLabels` 未指定なので変更不要。
- `MemberFilters.client.spec.tsx`: `topTags` 未指定の既存ケース（`foo タグ絞り込みを解除`）は変更不要。`topTags` を渡す MF-T1 のみ表示名。

---

## 6. 実装順序と各ステップ検証

| 順 | ステップ | 完了後の検証 |
|----|---------|--------------|
| ① | SelectedFiltersBar の `tagLabels` 解決（§1） | `vitest run .../SelectedFiltersBar.client.spec.tsx`（SFB-T1/T2/T3 が GREEN） |
| ② | SelectedFiltersBar の focus 管理（§2） | 同上（SFB-T5/T6/T7 が GREEN） |
| ③ | MemberFilters の `tagLabels` 導出 + `onEmpty` 配線（§3） | `vitest run .../MemberFilters.client.spec.tsx`（MF-T1/T2 が GREEN） |
| ④ | legacy-public.css mobile block（§4） | `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens`（HEX 0 件） |
| ⑤ | 既存 spec 期待値更新（§5） | 下記全コマンド GREEN |

### 全体検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
```

### 不変条件チェック（実装中に違反しないこと）

- API / D1 / Google Form schema 変更ゼロ（AC-6）。`apps/api` 配下を触らない。
- tag label は `topTags` 由来のみ（AC-1 / 不変条件）。
- HEX 直書きゼロ（AC-7）。
- 新規 test は `*.spec.tsx` のみ（既存ファイル編集のみで新規ファイルは作らない）。
