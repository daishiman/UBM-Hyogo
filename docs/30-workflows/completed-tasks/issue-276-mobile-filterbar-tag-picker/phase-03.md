# Phase 3: アーキテクチャ設計 / コンポーネント分解

[実装区分: 実装仕様書]

## メタ情報

| Phase | 3 |
| 前提 | Phase 1, 2 完了 |
| 後続 | Phase 4 |

## 目的

UI コンポーネント階層、API 集計戦略、データフローを確定し、Phase 4 以降の実装ファイル数と関数シグネチャを固める。

## コンポーネント分解

```
app/(public)/members/page.tsx (Server)
  └─ MemberFilters (Client)
       ├─ <Search />
       ├─ <Select zone />
       ├─ <Select status />
       ├─ <Segmented sort />
       ├─ <DensityToggle />
       ├─ TagPicker (Client・新規)         ← 候補 chip リスト
       │    └─ SelectedTagsBar (Client・新規)  ← 選択済 + clear-all
       └─ FiltersSummaryMobile (Client・新規)  ← mobile collapsed 時の概要表示
```

## 関数シグネチャ

### `TagPicker.client.tsx`（新規）

```ts
export interface TagPickerProps {
  candidates: ReadonlyArray<{ code: string; label: string; count: number }>;
  selected: ReadonlyArray<string>;
  max: number; // = MEMBERS_SEARCH_LIMITS.TAG_LIMIT
  onToggle: (code: string) => void;
}
export function TagPicker(props: TagPickerProps): JSX.Element;
```

副作用: なし（pure render + onToggle 呼び出し）
a11y: chip は `<button role="switch" aria-checked>`、disabled 時 `aria-disabled="true"`。上限到達時 `aria-live="polite"` で hint。

### `SelectedTagsBar.client.tsx`（新規）

```ts
export interface SelectedTagsBarProps {
  selected: ReadonlyArray<string>;
  onRemove: (code: string) => void;
  onClearAll: () => void;
}
```

### `FiltersSummaryMobile.client.tsx`（新規）

```ts
export interface FiltersSummaryMobileProps {
  q: string;
  zone: string;
  status: string;
  tagCount: number;
  expanded: boolean;
  onToggle: () => void;
}
```

### `MemberFilters.client.tsx`（編集）

- 既存 `MemberFiltersProps` に `topTags: PublicMemberListView["topTags"]` を追加
- 内部で `useState<boolean>(false)` で mobile collapse 状態を保持（URL には載せない）
- viewport 検出は CSS `@media (max-width: 640px)` を主、JS では行わない（SSR ずれ防止）

### API 側 use case 追加

`apps/api/src/use-cases/public/list-public-members.ts`（要パス確定）に以下を追加:

```ts
async function aggregateTopTags(ctx: Ctx): Promise<TopTag[]> {
  // D1: SELECT t.code, t.label, COUNT(*) as count
  //      FROM member_tags mt JOIN tag_definitions td ON td.tag_id = mt.tag_id ...
  //      WHERE member is public-consented
  //      GROUP BY t.code ORDER BY count DESC, code ASC LIMIT 20;
}
```

Phase 2 の `d1-aggregation-query-draft.sql` を正本クエリに昇格。

## データフロー

1. SSR `page.tsx` → `listMembers(search)` → `PublicMemberListView { items, pagination, appliedQuery, topTags, generatedAt }`
2. `<MemberFilters initial={search} topTags={list.topTags} />` に直接 prop で渡す
3. クライアントは URL を正本に保持（state 二重管理しない）

## 多角的チェック観点（AI が判断）

- a11y: chip の role/aria 適切性、screen reader での hint 読み上げ
- SSR/CSR: collapse 初期状態の hydration mismatch 回避（mobile 判定は CSS-only）
- パフォーマンス: D1 集計クエリのインデックス利用確認
- 不変条件: URL repeated query 維持、`density` 等 query は正本のまま
- 既存 dense / list 切替への副作用がないこと

## 成果物

- `outputs/phase-03/main.md`
- `outputs/phase-03/component-tree.md`
- `outputs/phase-03/sequence-diagram.md`

## 完了条件

- [ ] 全コンポーネントの props 型が確定
- [ ] D1 集計クエリ草案を確定クエリに昇格
- [ ] SSR hydration 戦略が記述された

## タスク100%実行確認【必須】

- [ ] 新規 3 コンポーネント + 編集 1 コンポーネントの分解が明文化
- [ ] api use case 追加関数シグネチャが明文化

## 次Phase

Phase 4 へ。**ここまでが設計フェーズ完了**。
