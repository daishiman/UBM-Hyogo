# Phase 5: 実装（GREEN）

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| Phase | 5 / 13 |
| 種別 | implementation（VISUAL） |
| 前提 | Phase 4 完了（RED テスト確定） |
| レーン | Lane A |

## 目的

Phase 4 の RED テストを GREEN にする最小実装を 7 ファイルへ適用する。案件 A（CSS 抑止 + class 付与）と案件 B（sort 3 層 enum 同期 + ORDER BY 4 分岐 + UI ラベル 4 種）を完成させる。sort enum 3 層は same-wave で編集し、1 層欠落による enum 不整合 fail を防ぐ。

## 実行タスク

### T5-0 変更ファイル一覧

**修正（7 ファイル）**:

1. `apps/web/src/components/ui/Search.tsx`（input に class 付与・独自×維持）
2. `apps/web/src/styles/globals.css`（ネイティブ×抑止 CSS 追加・色値なし）
3. `apps/web/src/lib/url/members-search.ts`（`SORT_VALUES` 4 値化）
4. `apps/web/src/components/public/MemberFilters.client.tsx`（`SORT_OPTIONS` 4 件化・接頭辞除去）
5. `apps/api/src/_shared/search-query-parser.ts`（`SortZ` enum 4 値化）
6. `apps/api/src/repository/publicMembers.ts`（ORDER BY 4 分岐 switch 化）
7. `packages/shared/src/zod/viewmodel.ts`（`appliedQuery.sort` enum 4 値化）

**新規作成**: なし（コードは全て既存ファイルの編集。テストも既存ファイルへ契約ケースを追記）。

### T5-1 案件 A: Search.tsx に class 付与（`apps/web/src/components/ui/Search.tsx:34-42`）

独自×ボタン（`Search.tsx:43-51`）と `type="search"` は変更しない。`<input>` に `className="ui-search__input"` を追加する。

変更前:

```tsx
      <input
        type="search"
        id={id}
        name={name}
        {...imeInput.inputProps}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
```

変更後:

```tsx
      <input
        type="search"
        className="ui-search__input"
        id={id}
        name={name}
        {...imeInput.inputProps}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
```

`imeInput.inputProps` に `className` が含まれない前提（`useImeSafeInput` は className を渡さない）。スプレッドより前に `className` を置き、props 由来の className 上書き事故を避ける。

### T5-2 案件 A: globals.css にネイティブ×抑止 CSS 追加

`apps/web/src/styles/globals.css` の末尾に以下を追加する。色値（HEX / `rgb` / `oklch` リテラル）を含めない（AC-10 / `verify-design-tokens` 非抵触）:

```css
/* 検索入力: Chromium 系ネイティブのクリア/装飾ボタンを抑止し、独自×ボタン（aria-label="クリア"）のみを正本とする */
.ui-search__input::-webkit-search-cancel-button,
.ui-search__input::-webkit-search-decoration {
  -webkit-appearance: none;
  appearance: none;
  display: none;
}
```

### T5-3 案件 B 層 1: members-search.ts の SORT_VALUES（`apps/web/src/lib/url/members-search.ts:9`）

変更前:

```ts
const SORT_VALUES = ["recent", "name"] as const;
```

変更後:

```ts
const SORT_VALUES = ["recent", "oldest", "name", "name_desc"] as const;
```

`membersSearchSchema` の `sort: z.enum(SORT_VALUES).catch("recent")`（`members-search.ts:30`）は変更しない。`toApiQuery` の `if (search.sort !== "recent")`（`members-search.ts:72`）は変更しない（`oldest` / `name_desc` は recent 以外なので自動で URL に出力される）。

### T5-4 案件 B 層 2: search-query-parser.ts の SortZ（`apps/api/src/_shared/search-query-parser.ts:7`）

変更前:

```ts
export const SortZ = z.enum(["recent", "name"]);
```

変更後:

```ts
export const SortZ = z.enum(["recent", "oldest", "name", "name_desc"]);
```

`DEFAULT_PUBLIC_MEMBER_QUERY.sort = "recent"`（`search-query-parser.ts:19`）は変更しない。

### T5-5 案件 B 層 3: viewmodel.ts の appliedQuery.sort（`packages/shared/src/zod/viewmodel.ts:158`）

変更前:

```ts
      sort: z.enum(["recent", "name"]),
```

変更後:

```ts
      sort: z.enum(["recent", "oldest", "name", "name_desc"]),
```

> **3 層同期の厳守（T5-3 / T5-4 / T5-5）**: この 3 ファイルを same-wave で編集する。1 層でも `["recent", "name"]` のまま残すと、API レスポンスの `appliedQuery.sort` が `oldest` / `name_desc` のとき enum 検証で fail し、T6 / list-public-members の contract が落ちる。Phase 9 で 3 ファイルに `oldest` と `name_desc` が揃うことを grep 確認する。

### T5-6 案件 B: publicMembers.ts の ORDER BY 4 分岐（`apps/api/src/repository/publicMembers.ts:102-106`）

`fullNameExpr`（`publicMembers.ts:102`）は変更せず再利用する。三項演算子（`publicMembers.ts:103-106`）を switch 4 分岐へ置換する。

変更前:

```ts
  const fullNameExpr = `COALESCE(json_extract(r.answers_json, '$.${STABLE_KEY.fullName}'), '')`;
  const orderBy =
    input.sort === "name"
      ? `ORDER BY ${fullNameExpr} ASC, mi.member_id ASC`
      : `ORDER BY mi.last_submitted_at DESC, ${fullNameExpr} ASC, mi.member_id ASC`;
```

変更後:

```ts
  const fullNameExpr = `COALESCE(json_extract(r.answers_json, '$.${STABLE_KEY.fullName}'), '')`;
  let orderBy: string;
  switch (input.sort) {
    case "name":
      orderBy = `ORDER BY ${fullNameExpr} ASC, mi.member_id ASC`;
      break;
    case "name_desc":
      orderBy = `ORDER BY ${fullNameExpr} DESC, mi.member_id ASC`;
      break;
    case "oldest":
      orderBy = `ORDER BY mi.last_submitted_at ASC, ${fullNameExpr} ASC, mi.member_id ASC`;
      break;
    case "recent":
    default:
      orderBy = `ORDER BY mi.last_submitted_at DESC, ${fullNameExpr} ASC, mi.member_id ASC`;
      break;
  }
```

末尾の `mi.member_id ASC` タイブレークを全 4 分岐に残す（決定的順序の保証・`countPublicMembers` の `COUNT(DISTINCT mi.member_id)` と集合定義を一致させる）。`recent` の SQL 文字列は変更前と完全一致（回帰なし）。`input.sort` の型は use-case 経由で `SortZ` の 4 値に拡張済み（T5-4）。

### T5-7 案件 B: MemberFilters.client.tsx の SORT_OPTIONS（`apps/web/src/components/public/MemberFilters.client.tsx:39-42`）

変更前:

```tsx
const SORT_OPTIONS = [
  { value: "recent", label: "並び替え: 新着順" },
  { value: "name", label: "並び替え: 名前順" },
];
```

変更後:

```tsx
const SORT_OPTIONS = [
  { value: "recent", label: "新しい順" },
  { value: "oldest", label: "古い順" },
  { value: "name", label: "名前順" },
  { value: "name_desc", label: "名前の逆順" },
];
```

接頭辞「並び替え: 」を除去する（`FormField` の `label="並び替え"` が既に文脈を提供）。`value` は `MembersSearch["sort"]` 経由で型整合（既存の `as` キャスト踏襲）。`Select` 共通プリミティブ（`apps/web/src/components/ui/Select.tsx`）の `SelectOption` 形をそのまま使う。

### T5-8 GREEN 確認コマンド（Phase 5 完了時に実行し PASS を確認）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run apps/web/src/components/ui/__tests__/Search.spec.tsx apps/web/src/lib/url/__tests__/members-search.spec.ts apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx
mise exec -- pnpm exec vitest run apps/api/src/_shared/__tests__/search-query-parser.spec.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts packages/shared/src/zod/viewmodel.spec.ts
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/repository/publicMembers.repository.spec.ts
```

> 本ウェーブでコード編集・GREEN 確認まで完了。

## 参照資料

- [phase-1-requirements.md](phase-1-requirements.md)（変更対象 inventory T1-5）
- [phase-2-design.md](phase-2-design.md)（T2-1 CSS / T2-2 3 層同期表 / T2-3 ORDER BY / T2-4 SORT_OPTIONS）
- [phase-4-test-creation.md](phase-4-test-creation.md)（GREEN 対象テスト T1〜T7）
- [index.md](index.md)（ソート値マッピング正本）
- `apps/web/src/components/ui/Search.tsx:34-51`（input / 独自×）
- `apps/web/src/hooks/useImeSafeInput.ts`（inputProps に className なし）
- `apps/web/src/styles/globals.css`（CSS 追加先）
- `apps/web/src/lib/url/members-search.ts:9,30,72`（SORT_VALUES / catch / toApiQuery）
- `apps/web/src/components/public/MemberFilters.client.tsx:39-42`（SORT_OPTIONS）
- `apps/web/src/components/ui/Select.tsx`（SelectOption）
- `apps/api/src/_shared/search-query-parser.ts:7,19`（SortZ / DEFAULT）
- `apps/api/src/repository/publicMembers.ts:102-106`（fullNameExpr / ORDER BY）
- `packages/shared/src/zod/viewmodel.ts:158`（appliedQuery.sort）
- `packages/shared/src/zod/field.ts`（STABLE_KEY.fullName）

## 成果物

- 7 ファイルの変更前 → 変更後コードスニペット（T5-1〜T5-7）
- ネイティブ×抑止 CSS（色値なし・T5-2）
- ORDER BY 4 分岐 switch（タイブレーク member_id ASC 維持・T5-6）
- sort 3 層 same-wave 同期の明記（T5-5）
- GREEN 確認コマンド（T5-8）

## 統合テスト連携

実装後に Phase 4 の全 focused スイートが GREEN へ遷移することを確認する。sort enum 3 層を same-wave で編集した後に `mise exec -- pnpm typecheck` と上記 vitest 群を実行し、`appliedQuery.sort` 検証（shared T6）と ORDER BY 実順序（D1 T7）が結合して通ることを確認する。

## 完了条件

- [ ] `Search.tsx` の input に `className="ui-search__input"` が付与され独自×が維持されている
- [ ] `globals.css` に `::-webkit-search-cancel-button` / `::-webkit-search-decoration` 抑止が色値なしで追加されている
- [ ] sort 3 層（`members-search.ts:9` / `search-query-parser.ts:7` / `viewmodel.ts:158`）すべてに `oldest` と `name_desc` が追加されている
- [ ] `publicMembers.ts` の ORDER BY が recent/oldest/name/name_desc の 4 分岐で末尾 `mi.member_id ASC` タイブレークを持つ
- [ ] `MemberFilters.client.tsx` の `SORT_OPTIONS` が 4 件・ラベル「新しい順/古い順/名前順/名前の逆順」・接頭辞「並び替え: 」が除去されている
