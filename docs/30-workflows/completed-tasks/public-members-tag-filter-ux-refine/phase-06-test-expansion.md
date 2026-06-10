# Phase 6: テスト拡充

| 項目 | 値 |
|------|-----|
| Phase | Phase 6 — テスト拡充 |
| workflow_id | `public-members-tag-filter-ux-refine` |
| status | `implemented_local` |
| taskType | `implementation`（UI 表現層改善） |
| visualEvidence | `VISUAL` |
| relatedIssue | `null` |
| 正参照 | [`_shared-context.md`](./_shared-context.md) / [`phase-04-test-design.md`](./phase-04-test-design.md) / [`phase-05-implementation.md`](./phase-05-implementation.md) |

> 本 Phase は Phase 4 の TC を「既存 spec 回帰の維持」と「新規 assertion 追加」に展開する。`TagPicker.client.spec.tsx` / `MemberFilters.client.spec.tsx` は実装差分に追随済み。CSS 主体の改修であり、回帰維持が中心・新規 assertion は DOM 構造/属性に限定する（見た目は Phase 11 visual・AC-1/2/3/4/9）。


<!-- validator-facing required sections: start -->

## メタ情報

- workflow_id: `public-members-tag-filter-ux-refine`
- status: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL`

## 目的

公開メンバー一覧のタグ絞り込み UI を、実コード・仕様書・証跡が矛盾しない形で改善する。

## 実行タスク

- Phase 6 の責務に沿って、CSS/markup/test/証跡/正本同期の該当項目を確認する。
- `_shared-context.md` の AC / INV / 変更対象と矛盾しないことを確認する。

## 参照資料

- `_shared-context.md`
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物

- 本 Phase ファイル
- 対応する `apps/web` / `outputs/` / skill 正本同期の実変更

## 完了条件

- [x] 必須見出しを満たす
- [x] 4条件（矛盾なし・漏れなし・整合性あり・依存関係整合）に反しない

## 統合テスト連携

- focused Vitest / typecheck / lint / token gate の結果を Phase 11 evidence と Phase 12 compliance に同期する。
<!-- validator-facing required sections: end -->

## 1. 回帰維持（既存 spec を緑のまま保つ・AC-5 / INV-7）

### 1.1 `TagPicker.client.spec.tsx`

既存 4 テスト（chip render / toggle / 上限 aria-disabled + hint / empty option）は **DOM 構造を変えない**（TagPicker 無変更）ため、そのまま緑を維持する。

| 既存テスト | 回帰条件 | 対応 TC |
|-----------|---------|--------|
| 「options を chip としてレンダーする」 | `tag-pill` 2 個 / `aria-checked="false"` | TC-B-01 |
| 「クリックすると onToggle(code) が呼ばれる」 | `getByRole("switch", { name: /AI/ })` で `onToggle("ai")` | TC-B-02 |
| 「selected.length>=max かつ未選択は aria-disabled で no-op、hint 表示」 | 未選択 `aria-disabled="true"` / no-op / hint | TC-B-03 |
| 「options が空のとき何もレンダーしない」 | `tag-picker` null | TC-B-04 |

### 1.2 `MemberFilters.client.spec.tsx`（filter-group 追加の回帰 guard）

`filter-group` ラッパ追加で `filters-body` 直下の階層が 1 段深くなる（Phase 3 MINOR-2）。**既存テストが階層依存 assertion を持たないことを Read で確認済**:

- 既存テストは `container.querySelector('[data-component="member-filters"]')` / `getByLabelText` / `getByRole` / `querySelector('[data-role="filter-grid"]')` 等の **要素ベース（直接子セレクタ非依存）** で書かれており、`filter-group` を 1 段挟んでも `filter-grid` / Select / result-count は引き続き取得できる。
- 回帰 guard: 下表のとおり既存 8 テストは `filter-group` 追加後も緑を維持する。

| 既存テスト | 階層依存の有無 | 回帰判定 | 対応 TC |
|-----------|--------------|---------|--------|
| 「form[role=search] / 3 つの Select…」 | なし（`getByLabelText` / `querySelector('[data-role="filter-grid"]')`） | 緑維持 | TC-B-06 |
| 「ゾーンを選択すると router.replace が呼ばれる」 | なし（`getByLabelText`） | 緑維持 | TC-B-07 |
| 「topTags を渡すと TagPicker chip が描画される」 | なし（子孫セレクタ `[data-component="tag-picker"] [data-component="tag-pill"]`） | 緑維持 | TC-B-08 |
| 「選択済みが上限に達すると…aria-disabled で no-op」 | なし（子孫セレクタ） | 緑維持 | TC-B-09 |
| 「tag が指定済みの場合 active-tags リスト…」 | なし（`[data-role="active-filters"] li`） | 緑維持 | TC-B-10 |
| 「clear-all ボタンで /members に router.replace」 | なし（`getByRole`） | 緑維持 | TC-B-11 |
| 「live-filter hint と結果件数 status を描画する」 | なし（`[data-role="live-filter-hint"]` / `getByRole("status")`） | 緑維持 | TC-B-12 |
| 「mobile summary 行…expanded を切替できる」 | なし（`[data-component="filters-summary-mobile"]`） | 緑維持 | TC-B-13 |

> いずれの既存 assertion も子孫結合子（descendant）か要素単体クエリのみで、直接子結合子（`>`）や `filters-body` 直下構造への依存がない。よって `filter-group` 挿入で失敗するテストは無い。

## 2. 新規 assertion 追加方針

### 2.1 `TagPicker.client.spec.tsx` に追加

| TC-ID | 追加 assertion 方針 |
|-------|-------------------|
| TC-A-01 | `container.querySelector('[data-role="tag-picker-options"]')` が truthy（横並び CSS の付与先＝AC-1 前提） |
| TC-A-02 | `[data-role="tag-picker-options"]` の直下子がすべて `<li>`（`querySelectorAll(':scope > li')` で件数 = options 件数）、各 `<li>` 内に `[data-component="tag-pill"]` 1 個 |
| TC-A-03 | `selected={["ai"]}` で `[data-tag-code="ai"]` の `aria-checked === "true"`、`[data-tag-code="design"]` の `aria-checked === "false"`（選択強調セレクタの発火条件＝AC-3 前提） |
| TC-B-05 | `selected={["ai"]}` / `max={5}`（未到達）で `ai` chip が `aria-checked="true"` かつ `getAttribute("aria-disabled")` が `null`（選択中 chip は disabled にならない＝§3 cascade 非共存の固定。Phase 3 MINOR-1） |

> いずれも DOM 構造 / 属性の assertion のみ。**`display:flex` の計算済みレイアウト・色は assert しない**（jsdom はレイアウト/描画を計算しない＝Phase 4 §1。見た目は Phase 11 visual）。

### 2.2 `MemberFilters.client.spec.tsx` に追加

| TC-ID | 追加 assertion 方針 |
|-------|-------------------|
| TC-A-04 | `container.querySelector('[data-role="filter-group"][data-group="inputs"]')` が truthy（グルーピング CSS 付与先＝AC-2 前提） |
| TC-A-05 | `filter-group` 要素が内側に `[data-role="filter-grid"]` と `#member-result-count`（`[data-role="result-count"]`）の **両方**を `.querySelector` で内包する（`group.querySelector('[data-role="filter-grid"]')` / `group.querySelector('#member-result-count')` がともに truthy） |
| TC-A-06 | `[data-component="tag-picker"]` が `filter-group` の内側に **無い**こと（`group.querySelector('[data-component="tag-picker"]')` が null）＝TagPicker はラッパ外で border-top 区切り（Phase 2 §2.1） |

## 3. レスポンシブ / 見た目（Phase 11 visual に委譲・spec 化しない）

| AC | 委譲先 | jsdom で行わない理由 |
|----|--------|---------------------|
| AC-1（横並び・wrap 行間） | Phase 11 screenshot | flex レイアウトを jsdom は計算しない |
| AC-2（グルーピング視覚） | Phase 11 screenshot | 余白/区切りの見た目は描画依存 |
| AC-3（accent 塗り） | Phase 11 screenshot | CSS 適用結果を jsdom は描画しない |
| AC-4（grid 過密緩和） | Phase 11 screenshot | gap 計算値は jsdom で信頼検証不可 |
| AC-9（mobile/desktop wrap） | Phase 11 screenshot | viewport 依存レイアウト |

> 本サイクルは `status: local_static_visual_present_staging_pending`。local PNG は取得済みで、staging data-backed capture は user-gated。

## 4. grep gate（Phase 9 機械検証・補助）

```bash
# AC-7: 新規 primitive 追加 0（components/ui 配下に新ファイルなし）
git diff dev --name-only -- apps/web/src/components/ui/ | grep -E '\.(tsx|ts)$' && exit 1 || true

# AC-8: API / shared / D1 / Form 差分 0
git diff dev --name-only -- apps/api/ packages/shared/ apps/api/migrations/ | grep . && exit 1 || true

# AC-6: HEX 直書きなし（変更 CSS）
grep -nE '#[0-9a-fA-F]{3,8}\b' \
  apps/web/src/styles/legacy-public.css \
  apps/web/src/styles/globals.css | grep -vE '^\s*[0-9]+:\s*/\*' && echo "確認: 新規追加行に HEX が無いことを diff で目視" || true

# INV-7: TagPicker の role/aria が不変（無変更が原則）
git diff dev -- apps/web/src/components/public/TagPicker.client.tsx | grep -E '^[+-].*(role=|aria-checked|aria-disabled)' && echo "確認: TagPicker の role/aria に差分が無いこと" || true
```

> `verify-design-tokens`（`pnpm verify:design-tokens`）が AC-6 の正規ゲート。上記 grep は補助。HEX は新規追加行に対して目視＋ゲートで担保（既存ファイルには無関係の既存色は存在し得るため diff 基準で判断）。

## 5. un-skip 不変条件

- `todo` / `skip` / `only` を残さない。追加 TC（TC-A-01〜06 / TC-B-05）はすべて実行対象とする。
- 既存テストの `it.skip` 化・コメントアウトによる回避は禁止。回帰が出た場合は assertion を階層非依存へ修正して緑化する（§1.2 のとおり原則回帰は出ない想定）。

## 6. 実行コマンド

> vitest root は **リポジトリルート**のため `--root=../..` + フルパス指定が必須（省くと「No test files found」）。filter 名 = `@ubm-hyogo/web`（裏取り済）。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --no-coverage \
  apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberGrid.spec.tsx \
  apps/web/src/components/public/__tests__/MemberCard.spec.tsx
```

## 7. 完了条件

- [x] 既存 spec の回帰維持方針（TagPicker 4 / MemberFilters 8 が緑のまま・階層非依存を Read で確認）
- [x] 新規 assertion 追加方針（TC-A-01〜06 / TC-B-05・DOM 構造/属性のみ）
- [x] レスポンシブ / 見た目は Phase 11 visual に委譲する旨を明記
- [x] grep gate（AC-6/7/8 / INV-7 補助）
- [x] un-skip 不変条件（todo/skip/only を残さない）
- [x] 実行コマンド（`--root=../..` 留意）
