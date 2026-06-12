# Phase 6: テスト拡充（fail path / 回帰）

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| Phase | 6 / 13 |
| 種別 | implementation（VISUAL） |
| 前提 | Phase 5 完了（GREEN 達成・7 ファイル実装済み） |
| レーン | Lane A |

## 目的

Phase 4 の正常系テストに対し、fail path（不正値フォールバック・空文字クリア）・回帰 guard（既存 recent / name の挙動不変）・境界（fullName 同値時の member_id ASC タイブレーク・空文字 fullName）を追加し、AC-4〜AC-7 のエッジを固める。既存テストを破壊しないことを確認する。

## 実行タスク

### T6-1 fail path: 不正 sort 値フォールバック（3 層）

| 追加先 | ケース名 | 入力 | 期待値 |
|--------|---------|------|--------|
| T2 `members-search.spec.ts` | `空文字 sort は recent にフォールバック` | `parseSearchParams({ sort: "" })` | `.sort === "recent"` |
| T2 `members-search.spec.ts` | `配列 sort は recent にフォールバック` | `parseSearchParams({ sort: ["oldest", "name"] })` | `.sort === "recent"`（`typeof !== "string"` ガード） |
| T4 `search-query-parser.spec.ts` | `大文字 OLDEST は DEFAULT recent` | parser に `{ sort: "OLDEST" }` | `.sort === "recent"`（enum は case-sensitive） |
| T6 `viewmodel.spec.ts` | `空文字 sort を reject` | `appliedQuery.sort: ""` | `.success === false` |
| T6 `viewmodel.spec.ts` | `RECENT（大文字）を reject` | `appliedQuery.sort: "RECENT"` | `.success === false` |

### T6-2 fail path: 空文字検索クリア（案件 A / T1 `Search.spec.tsx`）

| ケース名 | 入力 | 期待値 |
|---------|------|--------|
| `値ありからクリア押下で onChange("") が一度だけ呼ばれる` | `value="検索語"`、クリアボタン 1 回 `fireEvent.click` | `onChange` が `""` で呼ばれ、`onChange.mock.calls.length === 1` |
| `IME composition 中はネイティブ change で commit されない` | `compositionstart` 発火後に input へ `change` イベント | `onChange` が呼ばれない（`useImeSafeInput` の既存挙動の回帰 guard） |
| `クリア後に value="" を渡すと独自×が消える` | rerender で `value=""` | `screen.queryByRole("button", { name: "クリア" })` が `null` |

### T6-3 回帰 guard: 既存 recent / name の挙動不変

| 追加先 | ケース名 | 期待値 |
|--------|---------|--------|
| T7 `publicMembers.repository.spec.ts` | `recent の SQL 順序が変更前と一致` | `recent` の返却 `member_id` 配列が `["M-B", "M-C", "M-A"]`（Phase 5 で recent SQL 文字列を変えていない証跡） |
| T7 `publicMembers.repository.spec.ts` | `name の SQL 順序が変更前と一致` | `name` の返却が `["M-A", "M-B", "M-C"]` |
| T5 `list-public-members.spec.ts` | `sort=recent の伝播（回帰）` | repository `input.sort === "recent"` |
| T3 `MemberFilters.client.spec.tsx` | `recent option の value と既存挙動保持` | 先頭 option の `value === "recent"`・選択変更で URL に `sort` が出ない（recent は省略） |

### T6-4 境界: fullName 同値時の member_id ASC タイブレーク（T7）

seed に fullName が同一の 2 会員を追加して member_id 昇順タイブレークを検証する。

追加 seed:

| member_id | last_submitted_at | fullName |
|-----------|-------------------|----------|
| `M-D` | `2026-04-01T00:00:00Z` | `たちつてと` |
| `M-E` | `2026-04-01T00:00:00Z` | `たちつてと` |

| ケース名 | 入力 sort | 期待値 |
|---------|----------|--------|
| `name で fullName 同値は member_id ASC タイブレーク` | `name` | 返却中で `M-D` が `M-E` より先（member_id ASC） |
| `name_desc で fullName 同値も member_id ASC タイブレーク` | `name_desc` | fullName 降順内で `M-D` が `M-E` より先（タイブレークは ASC 固定・降順にしない） |
| `recent で last_submitted_at 同値は fullName ASC → member_id ASC` | `recent` | `M-D`・`M-E` 区間が fullName ASC、同値で member_id ASC（`M-D` 先） |

### T6-5 境界: 空文字 fullName のソート安定性（T7）

`answers_json` に `fullName` キーが無い（または空文字）会員を投入し、`COALESCE(..., '')` が空文字へ落ちて昇順で先頭側に来ることを検証する。

追加 seed:

| member_id | last_submitted_at | fullName（answers_json） |
|-----------|-------------------|--------------------------|
| `M-F` | `2026-05-01T00:00:00Z` | キー無し（`json_extract` が `NULL` → `COALESCE` で `''`） |

| ケース名 | 入力 sort | 期待値 |
|---------|----------|--------|
| `name で空文字 fullName は先頭側` | `name` | `M-F` が `あいうえお`（M-A）より前（`'' < 'あ'`） |
| `name_desc で空文字 fullName は末尾側` | `name_desc` | `M-F` が最後尾（降順で `''` が最小） |

### T6-6 回帰 guard: 既存テスト非破壊の確認

Phase 5 の編集が既存アサーションを壊さないことを確認する。特にラベル文言変更（接頭辞除去）に依存する既存テストを点検する。

- `MemberFilters.client.spec.tsx` の既存アサーションに「並び替え: 新着順」「並び替え: 名前順」リテラルがある場合、Phase 5 で「新しい順」「名前順」へ同期更新する（T3 の T4-5 ケースが正本）。
- `Search.spec.tsx` の既存「クリア」ボタン関連アサーションが `getByRole("button", { name: "クリア" })` を単数取得している場合、複数候補がない前提を `getAllByRole(...).length === 1` で明示化する。
- `members-search.spec.ts` / `search-query-parser.spec.ts` / `list-public-members.spec.ts` の既存 recent / name ケースは値保持のため後方互換。変更不要。

### T6-7 拡充後の全 focused run（Phase 6 完了時に実行）

```bash
mise exec -- pnpm exec vitest run apps/web/src/components/ui/__tests__/Search.spec.tsx apps/web/src/lib/url/__tests__/members-search.spec.ts apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx
mise exec -- pnpm exec vitest run apps/api/src/_shared/__tests__/search-query-parser.spec.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts packages/shared/src/zod/viewmodel.spec.ts
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/repository/publicMembers.repository.spec.ts
```

> 本ウェーブでテスト拡充の実装・実行まで完了。

## 参照資料

- [phase-4-test-creation.md](phase-4-test-creation.md)（拡張元の正常系 T1〜T7）
- [phase-5-implementation.md](phase-5-implementation.md)（回帰対象の実装差分 T5-6 ORDER BY / T5-7 ラベル）
- [phase-3-design-review.md](phase-3-design-review.md)（T3-3 既存テスト破壊リスク）
- [index.md](index.md)（ソート値マッピング・タイブレーク正本）
- `apps/web/src/components/ui/Search.tsx:43-51`（独自×・空値で非描画）
- `apps/web/src/lib/url/members-search.ts:30,50-60`（catch / parseSearchParams の string ガード）
- `apps/api/src/_shared/search-query-parser.ts:7,19`（SortZ / DEFAULT recent）
- `apps/api/src/repository/publicMembers.ts:102-106`（fullNameExpr COALESCE / member_id ASC タイブレーク）
- `vitest.d1.config.ts`（D1 contract config）

## 成果物

- fail path ケース（不正 sort 3 層・空文字クリア・IME 中 commit 回避）T6-1 / T6-2
- 回帰 guard ケース（recent / name SQL 不変・伝播不変）T6-3
- 境界ケース（fullName 同値 member_id ASC タイブレーク・空文字 fullName）T6-4 / T6-5
- 既存テスト非破壊の同期更新方針 T6-6

## 統合テスト連携

拡充した fail path / 回帰 guard / 境界ケースを統合スイートへ追加する。既存 `recent` / `name` の SQL 順序と伝播が不変であること（回帰 guard）を D1 contract（T7）と `list-public-members.spec.ts`（T5）で結合確認する。

## 完了条件

- [ ] 不正 sort 値（空文字 / 配列 / 大文字）の recent フォールバックが 3 層で検証されている
- [ ] 空文字検索クリアと IME composition 中の commit 回避が T1 に追加されている
- [ ] recent / name の SQL 順序不変が T7 回帰ケースで固定されている
- [ ] fullName 同値時の `member_id ASC` タイブレークが name / name_desc / recent で検証されている
- [ ] 空文字 fullName が `COALESCE` で昇順先頭 / 降順末尾になる境界が検証されている
- [ ] ラベル接頭辞除去に伴う既存テストの同期更新方針が記述されている
