# Implementation Guide

| 項目 | 値 |
|------|-----|
| workflow_id | `public-members-tag-filter-ux-refine` |
| status | `implemented_local_runtime_pending`（ローカル実装・focused tests 完了、staging screenshot は user-gated） |
| visualEvidence | `VISUAL`（local DOM/CSS evidence present、runtime screenshot pending） |

## Part 1: 中学生レベル

なぜ必要か。タグが縦に長く並ぶと、探したいタグを一目で比べられず、メンバー一覧を見る前に画面が読みにくくなるから。

公開メンバー一覧のページ `/members` には、「タグで絞り込み」のためのタグ（付箋のようなボタン）が並んでいる。調査時点ではこのタグが **縦に1個ずつ** 並んでしまって、画面が縦長になり、とても見にくかった。

なぜそうなるのか。タグを入れている「箱（リスト）」に、「中身を横に並べてね」という指示（CSS のルール）が書かれていないから。指示がないと、ブラウザは初期設定どおり「1個ずつ縦に積む」並べ方をしてしまう。

今回作ったものはシンプル。新しい機能を足すのではなく、箱に **「横に並べて、入りきらなかったら次の行へ折り返してね」** という並べ方のルール（`flex` と `flex-wrap`）を書き足した。これでタグが横にきれいに並び、多くても自動で折り返す。

ついでに、3つの見やすさも整える。
1. 検索・区画・参加ステータス・並び替え・タグがバラバラに見えるので、関係するものを **グループにまとめて** 区切る（文房具を引き出しごとに整理するイメージ）。
2. 選んだタグが色で目立つように直す（今は色を出す指示の「あて先」が間違っていて、選んでも光らない状態）。
3. メンバーのカードが少し詰まって見えるので、カードどうしの **すき間を少し広げて** ゆったりさせる。

データの取り方やサーバー（API）は **一切いじらない**。直すのは「見た目の並べ方」だけ。

### 今回作ったもの

何をしたか。タグの箱、フィルタのまとまり、選択中タグの色、メンバーカード同士のすき間を、既存の部品とトークンだけで整えた。

- タグ候補リストを横並びにする CSS。
- 入力フィルタ群をまとめる `filter-group` ラッパ。
- `aria-checked="true"` の選択タグを accent 色で強調する CSS。
- member-grid の comfy 表示を token gap へ揃える CSS。
- 上記を固定する focused tests と local static screenshot evidence。

## Part 2: 技術者レベル

### 変更対象（UI 表現層のみ・API/D1/Form 非接触）

| # | パス | 種別 | 主変更 |
|---|------|------|--------|
| 1 | `apps/web/src/styles/legacy-public.css` | 編集 | `[data-role="tag-picker-options"]` flex 横並び / `[data-role="filter-group"]` グルーピング / member-grid comfy gap トークン化 |
| 2 | `apps/web/src/styles/globals.css` | 編集 | `tag-pill` 選択強調セレクタに `[aria-checked="true"]` 併記 + accent 化 |
| 3 | `apps/web/src/components/public/MemberFilters.client.tsx` | 編集（最小） | `<div data-role="filter-group" data-group="inputs">` ラッパ 1 個追加。URL query ロジック不変 |
| 4 | `apps/web/src/components/public/TagPicker.client.tsx` | 原則無変更 | 既存 `data-role="tag-picker-options"` で横並び成立。INV-7 範囲内のみ |
| 5 | `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | 編集 | `filter-group` 追加に追随する assertion（階層非依存化） |
| 6 | `apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx` | 編集（必要時） | `tag-picker-options` 存在確認維持・既存緑 |

### TypeScript 型定義

型の新設・変更はない。既存 contract は次のまま維持する。

```ts
export interface TagPickerOption {
  code: string;
  label: string;
  count: number;
}

export interface TagPickerProps {
  options: TagPickerOption[];
  selected: string[];
  max: number;
  onToggle: (code: string) => void;
  heading?: ReactNode;
}

export interface MemberFiltersProps {
  initial: MembersSearch;
  topTags?: TagPickerOption[];
  totalCount?: number | undefined;
  displayedCount?: number | undefined;
}
```

### APIシグネチャ

API surface は変更しない。利用する既存 route は `GET /public/members` のみ。

```txt
GET /public/members?q=&zone=&status=&sort=&density=&tag=<code>
```

ローカル検証 CLI:

### CLIシグネチャ

```bash
pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --no-coverage \
  apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberGrid.spec.tsx \
  apps/web/src/components/public/__tests__/MemberCard.spec.tsx \
  "apps/web/app/(public)/members/page.spec.tsx"
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web lint
pnpm verify:tokens
```

### 使用例

```tsx
<TagPicker
  options={topTags}
  selected={initial.tag}
  max={MEMBERS_SEARCH_LIMITS.TAG_LIMIT}
  onToggle={onTagToggle}
  heading="タグで絞り込み"
/>
```

CSS は既存 `data-role="tag-picker-options"` を使用するため、`TagPicker.client.tsx` の JSX contract は維持される。

### CSS 追加（確定内容）

`legacy-public.css`（`tag-picker-heading` ルール L1441 直後）:

```css
[data-component="member-filters"] [data-role="tag-picker-options"] {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ubm-space-2);
  list-style: none;
  padding: 0;
  margin: 0;
}
[data-component="member-filters"] [data-role="tag-picker-options"] > li {
  display: inline-flex;
}
[data-component="member-filters"] [data-role="filter-group"] {
  display: flex;
  flex-direction: column;
  gap: var(--ubm-space-3);
}
```

member-grid comfy gap（L1451 近傍）: `gap: 18px;` → `gap: var(--ubm-space-6);`（24px・トークン化 + 過密緩和。列定義・3 密度不変）。

`globals.css`（L1756 既存ルールにセレクタ併記）:

```css
[data-component="tag-pill"][aria-selected="true"],
[data-component="tag-pill"][aria-checked="true"] {
  background: var(--ubm-color-accent);
  border-color: var(--ubm-color-accent);
  color: var(--ubm-color-surface-panel);
}
```

### Constraints

- No new API endpoint (INV-1). Use only existing `GET /public/members` surface; `topTags` shape unchanged.
- No D1 schema change / no Google Form change / no `apps/api` / `packages/shared` change (INV-4 / AC-8).
- No new primitive in `apps/web/src/components/ui/` (INV-6 / AC-7).
- `tag-pill` の `role="switch"` / `aria-checked` の **値**・トグル挙動・上限 hint・empty option は不変 (INV-7 / AC-5)。CSS は `aria-checked` を視覚反映するだけ。
- Colors must use existing OKLch token variables (`--ubm-color-accent` / `--ubm-space-*` / `--ubm-color-border-default`). No HEX / `bg-[#xxx]` (INV-2 / AC-6).
- `TagPickerProps` / `MemberFiltersProps` 型変更ゼロ。

### エラーハンドリング

- `topTags=[]` の場合は既存どおり `TagPicker` が `null` を返し、追加 CSS は対象要素不在で無害。
- 選択上限到達時は既存どおり未選択 chip だけ `aria-disabled="true"` になり、クリックは no-op。
- URL query の更新ロジックは変更しないため、router error surface や API fetch surface は増えない。

### エッジケース

| ケース | 扱い |
| --- | --- |
| 長いタグ名 | `flex-wrap` + `gap` により折り返し。最終 visual は screenshot で確認 |
| mobile filter collapsed | 既存 `[data-expanded="false"]` CSS が継続。展開時のみ tag list が wrap |
| selected + disabled | `isDisabled = reached && !isSelected` のため同一 chip で共存しない |
| category grouping 要望 | `topTags` が flat shape のためスコープ外。API/schema 拡張は行わない |

### 設定項目と定数一覧

| Name | Source | Purpose |
| --- | --- | --- |
| `MEMBERS_SEARCH_LIMITS.TAG_LIMIT` | `members-search.ts` | 最大タグ選択数 |
| `--ubm-space-2` | `tokens.css` | tag chip gap |
| `--ubm-space-3` | `tokens.css` | filter group rhythm |
| `--ubm-space-6` | `tokens.css` | comfy member-grid gap |
| `--ubm-color-accent` | `tokens.css` | selected tag background / border |
| `--ubm-color-surface-panel` | `tokens.css` | selected tag text color |

### テスト構成

| Test | Coverage |
| --- | --- |
| `TagPicker.client.spec.tsx` | chip render, `aria-checked`, toggle, upper-limit no-op, empty options |
| `MemberFilters.client.spec.tsx` | search role, filter-group wrapper, query update, active filter removal, mobile summary |
| `MemberGrid.spec.tsx` | density contract |
| `MemberCard.spec.tsx` | card rendering contract |
| `members/page.spec.tsx` | `/members` page integration and result count propagation |

### Local verification（実装後）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --no-coverage \
  apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberGrid.spec.tsx \
  apps/web/src/components/public/__tests__/MemberCard.spec.tsx
pnpm verify:tokens
bash scripts/verify-pr-ready.sh
```

### Phase 11 screenshot references（5 件・本サイクルは pending）

- `outputs/phase-11/screenshots/public-members-tag-filter-horizontal.png`（AC-1）
- `outputs/phase-11/screenshots/public-members-filter-region-grouped.png`（AC-2）
- `outputs/phase-11/screenshots/public-members-grid-spacing.png`（AC-4）
- `outputs/phase-11/screenshots/public-members-mobile-filter-tags.png`（AC-9）
- `outputs/phase-11/screenshots/public-members-tags-selected.png`（AC-3）

Current wave status: `implemented_local_runtime_pending`. Local code, focused tests, typecheck, lint, and token verification are complete. Staging verification, screenshots, commit, push, and PR remain user-gated.
