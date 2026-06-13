# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| Phase | 1 / 13 |
| 種別 | implementation（VISUAL） |
| implementation_mode | new |
| 前提 | ローカルが origin/dev 最新と整合済み。branch=feat/members-search-clear-and-sort-ux |

## 目的

ユーザー報告 2 件（検索×重複 / 並べ替え選択肢拡張）を実装可能な受入条件・変更対象・命名規則へ固定する。後続 Phase がコード実装可能な粒度の inventory を確定する。

## 実行タスク

### T1-1 タスク分類の確定

- タスク分類: **UI task（VISUAL）**。検索ボックスの×表示とソートドロップダウンのラベルという視覚要素を変更する。
- visualEvidence: `VISUAL`（Phase 11 で local Chromium filter UI screenshot captured 記録、staging は user-gated）。
- docs-only ではない（コード変更必須）。

### T1-2 真因の確定（案件 A: ×重複）

- `apps/web/src/components/ui/Search.tsx:35` の `<input type="search">` がネイティブ× (`::-webkit-search-cancel-button`) を描画。
- `Search.tsx:43-51` の独自×ボタンと二重表示。
- `grep -rn "webkit-search-cancel-button" apps/web/src/styles` は 0 件（抑止 CSS 不在）を Phase 1 で確認済み。

### T1-3 真因の確定（案件 B: ソート拡張可否）

- 現状 sort 値: `recent` / `name`（4 箇所定義: `members-search.ts:9` / `search-query-parser.ts:7` / `viewmodel.ts:158` / `publicMembers.ts:103-106`）。
- `oldest` / `name_desc` を追加するには ORDER BY 拡張が必要。一覧はページネーション（`publicMembers.ts` の `LIMIT ? OFFSET ?`）されるため、クライアント側反転は不可（ページ内のみ反転され全体順序が壊れる）。
- 結論: 既存 `/public/members` の sort enum + ORDER BY を拡張する（新規エンドポイント・schema 変更なし＝AC-9 / 不変条件遵守）。

### T1-4 命名規則の確定

- sort value: 既存が小文字 + アンダースコア（`recent`, `name`）。新値も同規則で `oldest`, `name_desc` とする（命名ドリフト防止 / FB-SDK-07-4）。
- UI ラベル: 日本語。`新しい順` / `古い順` / `名前順` / `名前の逆順`。
- テストファイル接尾辞: `*.spec.{ts,tsx}` のみ（不変条件 #8。`*.test.*` 禁止）。

### T1-5 変更対象 inventory の確定

| # | パス | 種別 | 変更概要 |
|---|------|------|---------|
| 1 | `apps/web/src/components/ui/Search.tsx` | 編集 | input に識別 className 付与（CSS スコープ用）。独自×は維持 |
| 2 | `apps/web/src/styles/globals.css` | 編集 | `::-webkit-search-cancel-button` / `::-webkit-search-decoration` 抑止ルール追加（色値なし） |
| 3 | `apps/web/src/lib/url/members-search.ts` | 編集 | `SORT_VALUES` に `oldest` / `name_desc` 追加 |
| 4 | `apps/web/src/components/public/MemberFilters.client.tsx` | 編集 | `SORT_OPTIONS` を 4 件化・接頭辞除去 |
| 5 | `apps/api/src/_shared/search-query-parser.ts` | 編集 | `SortZ` enum に 2 値追加 |
| 6 | `apps/api/src/repository/publicMembers.ts` | 編集 | `ORDER BY` を 4 分岐へ拡張 |
| 7 | `packages/shared/src/zod/viewmodel.ts` | 編集 | `appliedQuery.sort` enum に 2 値追加 |

| # | テストパス | 種別 |
|---|-----------|------|
| T1 | `apps/web/src/components/ui/__tests__/Search.spec.tsx` | 編集（×1 つ保証ケース追加） |
| T2 | `apps/web/src/lib/url/__tests__/members-search.spec.ts` | 編集（sort parse / toApiQuery） |
| T3 | `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | 編集（4 options） |
| T4 | `apps/api/src/_shared/__tests__/search-query-parser.spec.ts` | 編集（SortZ enum） |
| T5 | `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | 編集（sort 伝播） |
| T6 | `packages/shared/src/zod/viewmodel.spec.ts` | 新規（appliedQuery.sort 4 値受理） |
| T7 | `apps/api/src/repository/publicMembers.repository.spec.ts` | 新規（D1 contract: ORDER BY 実挙動） |

### T1-6 targeted test ファイルリスト（全件実行回避）

Phase 5/6 で実行する focused run を事前列挙する（全件 `pnpm test` の負荷回避）。

- web: T1 / T2 / T3
- api(unit): T4 / T5
- shared: T6
- api(D1, `vitest.d1.config.ts`): T7

## 参照資料

- `apps/web/src/components/ui/Search.tsx`（×重複の現物）
- `apps/web/src/hooks/useImeSafeInput.ts`（IME 安全入力）
- `apps/web/src/lib/url/members-search.ts`（URL 正規化）
- `apps/web/src/components/public/MemberFilters.client.tsx`（フィルタ UI）
- `apps/api/src/_shared/search-query-parser.ts` / `apps/api/src/repository/publicMembers.ts`（API sort）
- `packages/shared/src/zod/viewmodel.ts`（appliedQuery schema）
- `docs/00-getting-started-manual/specs/01-api-schema.md`（form schema 正本）
- 本 workflow `index.md`（ソート値マッピング正本）

## 成果物

- 受入条件 AC-1〜AC-10（index.md に集約）
- 変更対象 7 ファイル + テスト 7 ファイルの inventory（T1-5）
- 命名規則確定（T1-4）
- targeted test リスト（T1-6）

## 統合テスト連携

要件 AC-1〜AC-10 を検証する統合スイートを以下に紐づける。実行は本ウェーブで完了。

| 検証層 | スイート | 紐づく AC |
|--------|---------|----------|
| web ユニット | `Search.spec.tsx` / `members-search.spec.ts` / `MemberFilters.client.spec.tsx` | AC-1, AC-2, AC-3, AC-6, AC-7 |
| api ユニット | `search-query-parser.spec.ts` / `list-public-members.spec.ts` | AC-6, AC-7 |
| shared | `viewmodel.spec.ts` | AC-8 |
| D1 contract | `publicMembers.repository.spec.ts`（`vitest.d1.config.ts`） | AC-4, AC-5 |
| VISUAL | Phase 11 screenshot（pending） | AC-1, AC-3 |
| CI gate | `verify-design-tokens` | AC-10 |

## 完了条件

- [ ] タスク分類が UI task（VISUAL）と確定している
- [ ] 案件 A / B の真因が file:line で特定されている
- [ ] 変更対象 7 ファイル・テスト 7 ファイルが列挙されている
- [ ] sort 値命名規則（`oldest` / `name_desc`）が既存規則と一貫している
- [ ] ふりがな五十音順が今回スコープ外（未タスク Issue 化）と記録されている
