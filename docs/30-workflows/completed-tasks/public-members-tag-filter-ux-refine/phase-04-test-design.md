# Phase 4: テスト作成

| 項目 | 値 |
|------|-----|
| Phase | Phase 4 — テスト設計 |
| workflow_id | `public-members-tag-filter-ux-refine` |
| status | `spec_created` |
| taskType | `implementation`（UI 表現層改善） |
| visualEvidence | `VISUAL`（折返し見た目は Phase 11 screenshot に委譲） |
| relatedIssue | `null` |
| 正参照 | [`_shared-context.md`](./_shared-context.md) / [`phase-01-requirements.md`](./phase-01-requirements.md) / [`phase-02-design.md`](./phase-02-design.md) / [`phase-03-design-review.md`](./phase-03-design-review.md) |

> 本 Phase は Phase 2 設計（`legacy-public.css` への `tag-picker-options` flex 横並び / `filter-group` グルーピング / member-grid comfy gap トークン化、`globals.css` の選択強調セレクタ修正）を検証するテストケースを設計する。CSS は単体テスト対象外のため、**jsdom で検証可能な範囲（DOM 構造・属性・既存ロジック）** と **Phase 11 visual に委譲する範囲（実際の flex 折返しの見た目）** を明確に切り分ける。


<!-- validator-facing required sections: start -->

## メタ情報

- workflow_id: `public-members-tag-filter-ux-refine`
- status: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL`

## 目的

公開メンバー一覧のタグ絞り込み UI を、実コード・仕様書・証跡が矛盾しない形で改善する。

## 実行タスク

- Phase 4 の責務に沿って、CSS/markup/test/証跡/正本同期の該当項目を確認する。
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

## 0. 命名規則整合確認

- 全 spec: `*.spec.tsx` / `*.spec.ts`（INV-5。`*.test.*` 禁止）。
- 編集対象は既存 `.spec.tsx` のみ。新規 spec ファイルは追加しない。
- describe / it: 日本語可（既存 `TagPicker.client.spec.tsx` / `MemberFilters.client.spec.tsx` と整合）。
- import alias: 既存 spec の相対 import（`../TagPicker.client` / `../MemberFilters.client`）を踏襲。

## 1. jsdom で検証できる範囲 / visual に委譲する範囲（切り分け）

| 観点 | 検証手段 | 理由 |
|------|---------|------|
| `[data-role="tag-picker-options"]` 要素・`<li>` 構造の存在 | jsdom DOM spec（Phase 4 本書） | DOM 構造は markup 由来で jsdom で検査可能 |
| `data-role="filter-group"` ラッパの存在・内包関係 | jsdom DOM spec | markup 追加分。階層は jsdom で検査可能 |
| `aria-checked="true"` が選択 chip に反映されているか | jsdom 属性 spec | 属性値は jsdom で検査可能（CSS 強調の **発火条件**＝セレクタが効く属性が出ているかを担保） |
| 既存挙動回帰（`role="switch"` / toggle / 上限 `aria-disabled` / empty option / URL query 反映） | jsdom spec（既存テスト維持） | ロジック・属性・イベントは jsdom で検査可能 |
| **実際の flex 折返しの見た目**（`display:flex` の計算済みレイアウト・wrap 行間・横並びの視認） | **Phase 11 screenshot（mobile/desktop）に委譲** | jsdom は CSS レイアウトを計算しない（`getComputedStyle` の flex/wrap は信頼できない）。AC-1/AC-2/AC-4/AC-9 の「見た目」は visual evidence で確認 |
| 選択強調の **塗り色**（accent が実際に描画されるか） | **Phase 11 screenshot に委譲** | jsdom は CSS 適用結果を描画しない。spec は「`aria-checked="true"` 属性が出る」＝セレクタが効く前提条件のみ担保 |
| member-grid comfy gap の **実値（24px）** | **Phase 11 screenshot に委譲** | gap の計算済み値は jsdom で信頼検証不可。spec は `data-density` 属性維持のみ担保 |

> 結論: **CSS の見た目は一切 jsdom spec で assert しない**。jsdom spec は (a) CSS セレクタが効くための DOM 構造・属性が正しく出ているか、(b) 既存挙動が回帰していないか、の 2 点に限定する。色・wrap・gap の見た目は Phase 11 に委譲する（AC-1/2/3/4/9）。

## 2. テストケース表

### 2.1 グループ (a): DOM 構造 / 属性 spec（CSS セレクタの発火条件を担保）

| TC-ID | 対象 spec | 入力 | 期待 |
|-------|----------|------|------|
| TC-A-01 | `TagPicker.client.spec.tsx` | `options` 2 件 / `selected=[]` | `[data-role="tag-picker-options"]` 要素が 1 個存在する（横並び CSS の付与先＝AC-1 の前提条件） |
| TC-A-02 | `TagPicker.client.spec.tsx` | 同上 | `[data-role="tag-picker-options"]` の直下子要素がすべて `<li>` であり、各 `<li>` 内に `[data-component="tag-pill"]` が 1 個ある（`> li { display:inline-flex }` セレクタの発火先＝AC-1 の前提） |
| TC-A-03 | `TagPicker.client.spec.tsx` | `selected=["ai"]` / options に `ai` 含む | `ai` の `tag-pill` の `aria-checked="true"`、未選択 `design` は `aria-checked="false"`（選択強調 `[aria-checked="true"]` セレクタの発火条件＝AC-3 の前提） |
| TC-A-04 | `MemberFilters.client.spec.tsx` | `topTags` 2 件 | `[data-role="filter-group"][data-group="inputs"]` ラッパが 1 個存在する（AC-2 グルーピング CSS の付与先） |
| TC-A-05 | `MemberFilters.client.spec.tsx` | 同上 | `filter-group` ラッパが内側に `[data-role="filter-grid"]` と `[data-role="result-count"]`（`#member-result-count`）の両方を内包する（グルーピング構造＝AC-2 の前提） |
| TC-A-06 | `MemberFilters.client.spec.tsx` | 同上 | `TagPicker`（`[data-component="tag-picker"]`）は `filter-group` ラッパの **外側**（`filters-body` 直下）にあり、既存 `border-top` 区切りでグルーピングされる（Phase 2 §2.1 設計に整合） |

### 2.2 グループ (b): 既存挙動回帰 spec（AC-5・INV-7）

| TC-ID | 対象 spec | 入力 | 期待 |
|-------|----------|------|------|
| TC-B-01 | `TagPicker.client.spec.tsx` | `options` 2 件 | `tag-pill` が `role="switch"` で 2 個レンダーされ、`aria-checked="false"`（既存テスト「options を chip としてレンダーする」維持） |
| TC-B-02 | `TagPicker.client.spec.tsx` | クリック | `getByRole("switch", { name: /AI/ })` クリックで `onToggle("ai")` が呼ばれる（既存テスト維持・toggle 不変） |
| TC-B-03 | `TagPicker.client.spec.tsx` | `selected` 5 件 / `max=5` | 未選択 chip が `aria-disabled="true"`、クリックしても `onToggle` 未発火、`[data-role="tag-limit-hint"]` 表示（既存テスト維持・上限挙動不変） |
| TC-B-04 | `TagPicker.client.spec.tsx` | `options=[]` | `[data-component="tag-picker"]` が `null`（empty option = AC-5。既存テスト維持） |
| TC-B-05 | `TagPicker.client.spec.tsx` | `selected=["ai"]` / `max=5`（未到達） | `ai` chip は `aria-checked="true"` かつ `aria-disabled` が付与されない（MINOR-1: 選択中 chip は disabled にならない＝両セレクタ非共存の固定。Phase 3 MINOR-1 対策） |
| TC-B-06 | `MemberFilters.client.spec.tsx` | `baseInitial` | `form[role="search"]` / 3 Select（ゾーン・種別・並び替え）/ `[data-role="filter-grid"]` / `aria-describedby` に `member-search-live-hint` 含む（既存テスト維持・グルーピング追加後も `getByLabelText` 基準で階層非依存） |
| TC-B-07 | `MemberFilters.client.spec.tsx` | ゾーン選択 | `router.replace` が `zone=0_to_1` を含む URL で呼ばれる（既存テスト維持・URL query 正本不変） |
| TC-B-08 | `MemberFilters.client.spec.tsx` | `topTags` 2 件 / chip クリック | `tag-picker` 内 `tag-pill` 2 個、heading「タグで絞り込み」、クリックで `router.replace` が `tag=ai` を含む（既存テスト維持・タグトグル不変） |
| TC-B-09 | `MemberFilters.client.spec.tsx` | `tag` 5 件 / topTags に未選択 1 件 | `tag-picker` 内未選択 chip が `aria-disabled="true"`、クリックで `router.replace` 未発火、hint 表示（既存テスト維持・上限不変） |
| TC-B-10 | `MemberFilters.client.spec.tsx` | `tag=["foo","bar"]` | `[data-role="active-filters"] li` が 2 個、× ボタンで削除し `router.replace` 発火（既存テスト維持・SelectedFiltersBar 不変） |
| TC-B-11 | `MemberFilters.client.spec.tsx` | `tag=["foo"]` / clear-all | 「絞り込みをクリア」ボタンで `/members` に `router.replace`（既存テスト維持） |
| TC-B-12 | `MemberFilters.client.spec.tsx` | `totalCount=23` / `displayedCount=10` | `[data-role="live-filter-hint"]` 文言・`role="status"` の結果件数文言（既存テスト維持・グルーピング後も `result-count` 内容不変） |
| TC-B-13 | `MemberFilters.client.spec.tsx` | `baseInitial` | `filters-summary-mobile` 描画・クリックで `expanded` トグル（`data-expanded` 切替。既存テスト維持・mobile 折りたたみ不変＝AC-9 の前提） |

### 2.3 グループ (c): レスポンシブ（Phase 11 visual に委譲）

| AC | 委譲先 | 検証内容（jsdom では行わない） |
|----|--------|--------------------------------|
| AC-1（横並び・wrap 行間） | Phase 11 screenshot（desktop/mobile） | `tag-picker-options` の flex 横並び・折返し時の行間が適切に見えること |
| AC-2（グルーピング視覚） | Phase 11 screenshot | フィルタ領域の余白・区切り・階層が視覚的に明確であること |
| AC-3（選択強調の塗り） | Phase 11 screenshot | 選択中タグが accent 塗りで横並びでも判別可能であること |
| AC-4（grid 過密緩和） | Phase 11 screenshot | member-grid comfy gap 24px 化で過密感が解消されること |
| AC-9（レスポンシブ wrap） | Phase 11 screenshot（mobile/desktop） | モバイル展開時 / デスクトップともに wrap が破綻しないこと |

> 上記は jsdom がレイアウトを計算しないため spec 化しない。Phase 11 で mobile/desktop local static screenshot を取得済み。staging data-backed screenshot は user-gated とする。

## 3. 追加 / 更新する spec ファイル一覧

| # | パス | 種別 | 追加 / 更新内容 |
|---|------|------|----------------|
| 1 | `apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx` | 更新 | TC-A-01 / TC-A-02 / TC-A-03 / TC-B-05 を追加（既存 TC-B-01〜04 相当の 4 テストは維持） |
| 2 | `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | 更新 | TC-A-04 / TC-A-05 / TC-A-06 を追加（既存 TC-B-06〜13 相当を維持。`filter-group` 追加で失敗し得る階層依存 assertion は `getByRole`/`getByLabelText` 基準を維持して非影響を確認） |

> `MemberGrid.spec.tsx` / `MemberCard.spec.tsx` / `page.spec.tsx` は **無変更**（DOM 不変。member-grid は `data-density` 属性のみで gap 変更は CSS）。新規 spec ファイルは作らない（INV-5 / INV-6 整合）。

## 4. mock 戦略（既存踏襲・新規 mock なし）

- `TagPicker.client.spec.tsx`: `onToggle` を `vi.fn()` で観測（既存どおり）。`next/navigation` mock 不要（TagPicker は presentational）。
- `MemberFilters.client.spec.tsx`: 既存の `next/navigation` mock（`useRouter().replace` = `replaceMock` / `useSearchParams` / `usePathname`）を維持。新規 mock 追加なし。

## 5. Targeted run コマンド

> vitest の root は **リポジトリルート**のため `--root=../..` + `apps/web/...` フルパス指定が必要（MEMORY 既知の罠。これを省くと「No test files found」で exit 1）。filter 名は実 `apps/web/package.json#name = @ubm-hyogo/web`（裏取り済）。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --no-coverage \
  apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberGrid.spec.tsx \
  apps/web/src/components/public/__tests__/MemberCard.spec.tsx
```

## 6. TC 件数サマリ

| グループ | 件数 |
|---------|------|
| (a) DOM 構造 / 属性（CSS セレクタ発火条件） | 6（TC-A-01〜06） |
| (b) 既存挙動回帰（AC-5 / INV-7） | 13（TC-B-01〜13） |
| (c) レスポンシブ（Phase 11 visual 委譲・spec 化しない） | 0（5 AC を visual へ明示委譲） |
| **合計（spec 化する TC）** | **19** |

## 7. 完了条件

- [x] jsdom 検証範囲（DOM 構造・属性・既存ロジック）と visual 委譲範囲（flex 折返し・色・gap の見た目）を切り分け
- [x] AC-1〜11 を検証する TC 表（TC-ID / 対象 / 入力 / 期待）
- [x] (a) DOM 構造/属性 spec（tag-picker-options の li 構造・filter-group ラッパ・aria-checked 反映）
- [x] (b) 既存挙動回帰（switch / toggle / 上限 disabled / empty option = AC-5）
- [x] (c) レスポンシブは Phase 11 visual に委譲する旨を明記
- [x] 追加 / 更新する spec ファイル名を列挙（新規追加なし・既存 2 ファイル更新）
- [x] targeted run コマンド（`--root=../..` 留意）
