# Phase 4: テスト作成（RED）

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| Phase | 4 / 13 |
| 種別 | implementation（VISUAL） |
| 前提 | Phase 3 設計レビュー PASS。branch=feat/members-search-clear-and-sort-ux |
| レーン | Lane A |

## 目的

案件 A（検索×重複）と案件 B（sort 4 値拡張）の受入条件 AC-1〜AC-10 を、実装前に失敗する（RED）テストケースとして固定する。テスト 7 ファイル（編集 7）のケース名・入力・期待値を具体値で確定し、AC とテストの対応表を作る。

## 実行タスク

### T4-1 AC ↔ テスト対応表の作成

| AC | 受入条件 | 検証テスト |
|----|---------|-----------|
| AC-1 | クリア×は 1 つだけ（独自×のみ） | T1 |
| AC-2 | 独自×は空値で非表示・値ありで表示・`aria-label="クリア"` | T1 |
| AC-3 | ソート選択肢 4 種・接頭辞「並び替え: 」除去 | T3 |
| AC-4 | `oldest` で `last_submitted_at` 昇順（最古先頭） | T2, T5, T7 |
| AC-5 | `name_desc` で `fullName` 降順 | T2, T5, T7 |
| AC-6 | 不正 sort 値は `recent` フォールバック | T2, T4, T6 |
| AC-7 | デフォルトは `recent`・URL から省略 | T2, T4 |
| AC-8 | `appliedQuery.sort` enum が 4 値受理 | T6 |
| AC-9 | 新規エンドポイント・schema 変更なし（sort 拡張のみ） | T7（既存 `/public/members` への contract） |
| AC-10 | CSS 追加は色値なし | Phase 9 `verify-design-tokens`（テストでなく gate） |

### T4-2 RED 前提の明記

新値 `oldest` / `name_desc` は実装前に以下で reject される。Phase 4 完了時点でテストは FAIL（RED）である:

- `apps/web/src/lib/url/members-search.ts:9` の `SORT_VALUES = ["recent", "name"]` に `oldest` / `name_desc` が無いため、T2 の parse ケースは `catch("recent")` に落ちて FAIL する。
- `apps/api/src/_shared/search-query-parser.ts:7` の `SortZ = z.enum(["recent", "name"])` に無いため、T4 の受理ケースが FAIL する。
- `packages/shared/src/zod/viewmodel.ts:158` の `sort: z.enum(["recent", "name"])` に無いため、T6 の受理ケースが FAIL する。
- `apps/api/src/repository/publicMembers.ts:103-106` の三項演算子は `name` 以外を全て recent 扱いするため、T7 の `oldest` / `name_desc` 順序検証が FAIL する。
- `apps/web/src/components/public/MemberFilters.client.tsx:39-42` は option 2 件・接頭辞「並び替え: 」付きのため、T3 の 4 option・接頭辞無しケースが FAIL する。

### T4-3 T1: Search.spec.tsx（編集 / 案件 A）

ファイル: `apps/web/src/components/ui/__tests__/Search.spec.tsx`

| ケース名 | 入力 | 期待値 |
|---------|------|--------|
| `value="検索語" のときクリアボタンが 1 つだけ存在する` | `<Search value="検索語" onChange={vi.fn()} />` | `screen.getAllByRole("button", { name: "クリア" })` の length が `1` |
| `value="" のときクリアボタンは描画されない` | `<Search value="" onChange={vi.fn()} />` | `screen.queryByRole("button", { name: "クリア" })` が `null` |
| `input に ui-search__input クラスが付与される` | `<Search value="x" onChange={vi.fn()} />` | `screen.getByRole("searchbox")` の `classList` が `ui-search__input` を含む |
| `クリアボタン押下で onChange("") が呼ばれる` | `value="abc"`、クリアボタンを `fireEvent.click` | `onChange` が `""` 引数で呼ばれる（`commitNow("")` 経由・既存挙動の回帰 guard） |

jsdom 制約の明記（テストファイル冒頭コメントに記載）: jsdom は `::-webkit-search-cancel-button` 擬似要素を描画しない。よってネイティブ×の実非表示はユニットで検証不可。本テストは「DOM 上の独自×ボタンが 1 個」「`ui-search__input` クラス付与」で代替し、CSS による実非表示は Phase 11 VISUAL（Chromium）で担保する。

### T4-4 T2: members-search.spec.ts（編集 / 案件 B web URL）

ファイル: `apps/web/src/lib/url/__tests__/members-search.spec.ts`

| ケース名 | 入力 | 期待値 |
|---------|------|--------|
| `sort=oldest が parse される` | `parseSearchParams({ sort: "oldest" })` | `.sort === "oldest"` |
| `sort=name_desc が parse される` | `parseSearchParams({ sort: "name_desc" })` | `.sort === "name_desc"` |
| `不正 sort 値は recent にフォールバック` | `parseSearchParams({ sort: "bogus" })` | `.sort === "recent"` |
| `toApiQuery で oldest は sort= が含まれる` | `toApiQuery({ ...base, sort: "oldest" })` | `.get("sort") === "oldest"` |
| `toApiQuery で name_desc は sort= が含まれる` | `toApiQuery({ ...base, sort: "name_desc" })` | `.get("sort") === "name_desc"` |
| `toApiQuery で recent は sort= が省略される` | `toApiQuery({ ...base, sort: "recent" })` | `.has("sort") === false` |
| `既存 name は parse され toApiQuery に含まれる（回帰 guard）` | `sort: "name"` | parse `.sort === "name"`、`toApiQuery().get("sort") === "name"` |

`base` は `membersSearchSchema.parse({})` の全初期値（`q:""`, `zone:"all"`, `status:"all"`, `tag:[]`, `density:"comfy"`）。

### T4-5 T3: MemberFilters.client.spec.tsx（編集 / 案件 B UI ラベル）

ファイル: `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx`

| ケース名 | 期待値 |
|---------|--------|
| `ソート option が 4 つ存在する` | 「並び替え」FormField 配下の `<option>` 要素数が `4` |
| `ソートラベルが 新しい順/古い順/名前順/名前の逆順` | option テキストが順に `["新しい順", "古い順", "名前順", "名前の逆順"]` |
| `ソートラベルに 並び替え: 接頭辞が無い` | 各 option テキストが `並び替え:` を含まない（`expect(text).not.toContain("並び替え:")`） |
| `option の value が recent/oldest/name/name_desc` | option の `value` 属性が順に `["recent", "oldest", "name", "name_desc"]` |

### T4-6 T4: search-query-parser.spec.ts（編集 / 案件 B API パーサ）

ファイル: `apps/api/src/_shared/__tests__/search-query-parser.spec.ts`

| ケース名 | 入力 | 期待値 |
|---------|------|--------|
| `SortZ が oldest を受理` | `SortZ.parse("oldest")` | `"oldest"` を返す（throw しない） |
| `SortZ が name_desc を受理` | `SortZ.parse("name_desc")` | `"name_desc"` を返す |
| `parser で sort=oldest が ParsedQuery に伝播` | parser に `{ sort: "oldest" }` を渡す | 結果 `.sort === "oldest"` |
| `parser で sort=name_desc が伝播` | `{ sort: "name_desc" }` | `.sort === "name_desc"` |
| `不正 sort 値は DEFAULT recent` | parser に `{ sort: "bogus" }` | `.sort === "recent"`（`DEFAULT_PUBLIC_MEMBER_QUERY.sort`） |
| `sort 未指定は DEFAULT recent（回帰 guard）` | parser に `{}` | `.sort === "recent"` |

### T4-7 T5: list-public-members.spec.ts（編集 / 案件 B use-case 伝播）

ファイル: `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts`

| ケース名 | 入力 | 期待値 |
|---------|------|--------|
| `sort=oldest が repository input.sort に伝播` | use-case に `sort: "oldest"` で呼出 | mock した `listPublicMembers` の `input.sort === "oldest"` |
| `sort=name_desc が repository input.sort に伝播` | `sort: "name_desc"` | `input.sort === "name_desc"` |
| `既存 sort=name の伝播（回帰 guard）` | `sort: "name"` | `input.sort === "name"` |

repository（`listPublicMembers` / `countPublicMembers`）は `vi.mock` でスタブし、use-case が受け取った `sort` をそのまま repository へ渡すことを検証する（D1 を起動しない unit）。

### T4-8 T6: viewmodel.spec.ts（既存 / 案件 B 共有 enum）

ファイル: `packages/shared/src/zod/viewmodel.spec.ts`（新規作成）

| ケース名 | 入力 | 期待値 |
|---------|------|--------|
| `appliedQuery.sort が recent を受理` | viewmodel schema に `appliedQuery.sort: "recent"` を含む有効レスポンス | `.success === true` |
| `appliedQuery.sort が oldest を受理` | `sort: "oldest"` | `.success === true` |
| `appliedQuery.sort が name を受理` | `sort: "name"` | `.success === true` |
| `appliedQuery.sort が name_desc を受理` | `sort: "name_desc"` | `.success === true` |
| `appliedQuery.sort が不正値を reject` | `sort: "bogus"` | `.success === false` |

検証対象 schema は `packages/shared/src/zod/viewmodel.ts` の公開メンバー一覧 viewmodel（`appliedQuery` を内包する schema）を import し `.safeParse` で評価する。テストは `appliedQuery.sort` enum 単体を切り出せる場合はその enum を、切り出せない場合は最小有効レスポンス全体を組み立てて評価する。

### T4-9 T7: publicMembers.repository.spec.ts（既存 / D1 contract）

ファイル: `apps/api/src/repository/publicMembers.repository.spec.ts`（新規作成）
実行 config: `vitest.d1.config.ts`（実 D1 binding を使う contract test）

seed: 3 会員を投入する。`last_submitted_at` と `fullName`（`answers_json.fullName`）を以下で固定する。

| member_id | last_submitted_at | fullName |
|-----------|-------------------|----------|
| `M-A` | `2026-01-01T00:00:00Z` | `あいうえお` |
| `M-B` | `2026-03-01T00:00:00Z` | `かきくけこ` |
| `M-C` | `2026-02-01T00:00:00Z` | `さしすせそ` |

| ケース名 | 入力 sort | 期待順序（member_id 配列） |
|---------|----------|---------------------------|
| `recent は最新が先頭` | `recent` | `["M-B", "M-C", "M-A"]`（last_submitted_at DESC） |
| `oldest は最古が先頭` | `oldest` | `["M-A", "M-C", "M-B"]`（last_submitted_at ASC） |
| `name は fullName 昇順` | `name` | `["M-A", "M-B", "M-C"]`（あ→か→さ） |
| `name_desc は fullName 降順` | `name_desc` | `["M-C", "M-B", "M-A"]`（さ→か→あ） |

`listPublicMembers(c, { ...defaultInput, sort })` の返却 `PublicMemberRow[]` の `member_id` 配列を期待順序と `toEqual` で比較する。

### T4-10 RED 確認コマンド（Phase 4 完了時に実行し FAIL を確認）

```bash
mise exec -- pnpm exec vitest run apps/web/src/components/ui/__tests__/Search.spec.tsx apps/web/src/lib/url/__tests__/members-search.spec.ts apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx
mise exec -- pnpm exec vitest run apps/api/src/_shared/__tests__/search-query-parser.spec.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts packages/shared/src/zod/viewmodel.spec.ts
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/repository/publicMembers.repository.spec.ts
```

> 本ウェーブでfocused testの実行まで完了。

## 参照資料

- [phase-1-requirements.md](phase-1-requirements.md)（inventory T1-5 / targeted test T1-6）
- [phase-2-design.md](phase-2-design.md)（T2-2 sort 3 層 / T2-3 ORDER BY 4 分岐 / jsdom 制約 T2-1）
- [phase-3-design-review.md](phase-3-design-review.md)（T3-3 既存テスト破壊リスク）
- [index.md](index.md)（ソート値マッピング正本・AC-1〜AC-10）
- `apps/web/src/components/ui/Search.tsx:35,43-51`（独自×・`type="search"`）
- `apps/web/src/lib/url/members-search.ts:9,30,66-76`（SORT_VALUES / catch / toApiQuery）
- `apps/web/src/components/public/MemberFilters.client.tsx:39-42`（SORT_OPTIONS 現状 2 件・接頭辞付き）
- `apps/api/src/_shared/search-query-parser.ts:7,14-24`（SortZ / DEFAULT）
- `apps/api/src/repository/publicMembers.ts:102-106`（fullNameExpr / 三項 ORDER BY）
- `packages/shared/src/zod/viewmodel.ts:158`（appliedQuery.sort enum）
- `vitest.d1.config.ts`（D1 contract test config）

## 成果物

- AC ↔ テスト対応表（T4-1）
- テスト 7 ファイルのケース名・入力・期待値（T4-3〜T4-9）
- RED 前提の根拠列挙（T4-2）
- jsdom CSS 非評価制約の明記（T4-3）
- RED 確認コマンド（T4-10）

## 統合テスト連携

作成する T1〜T7 を統合スイートへ組み込む。RED 確認コマンド:

```bash
mise exec -- pnpm exec vitest run apps/web/src/components/ui/__tests__/Search.spec.tsx apps/web/src/lib/url/__tests__/members-search.spec.ts apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx
mise exec -- pnpm exec vitest run apps/api/src/_shared/__tests__/search-query-parser.spec.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts packages/shared/src/zod/viewmodel.spec.ts
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/repository/publicMembers.repository.spec.ts
```

実装前は `oldest` / `name_desc` が enum reject されるため T2/T4/T6/T7 が RED になることを確認する。

## 完了条件

- [ ] AC-1〜AC-10 のすべてが少なくとも 1 テストに対応している（T4-1 表）
- [ ] T1〜T7 の各ケース名・入力・期待値が具体値で確定している
- [ ] T1 に jsdom の CSS 非評価制約と独自×1 個 / class 付与の代替検証が明記されている
- [ ] T7 が `vitest.d1.config.ts` 使用と 3 会員 seed・4 sort の期待順序を持つ
- [ ] 新値 `oldest` / `name_desc` が実装前に reject される RED 根拠が file:line で記述されている
