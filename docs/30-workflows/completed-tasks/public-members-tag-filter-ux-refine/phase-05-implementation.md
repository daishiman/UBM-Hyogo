# Phase 5: 実装

| 項目 | 値 |
|------|-----|
| Phase | Phase 5 — 実装 |
| workflow_id | `public-members-tag-filter-ux-refine` |
| status | `implemented_local` |
| taskType | `implementation`（UI 表現層改善） |
| visualEvidence | `VISUAL` |
| relatedIssue | `null` |
| implementation_mode | `existing-hardening`（既存ページの CSS + 最小 markup 改修） |
| 正参照 | [`_shared-context.md`](./_shared-context.md) / [`phase-02-design.md`](./phase-02-design.md) / [`phase-03-design-review.md`](./phase-03-design-review.md) / [`phase-04-test-design.md`](./phase-04-test-design.md) |

> 本サイクルは `implemented_local_runtime_pending`。本 Phase の手順どおりに `apps/web` の CSS / 最小 markup / focused tests は実装済みであり、commit・push・PR・staging runtime screenshot は user-gated として残す（`_shared-context.md` §7）。


<!-- validator-facing required sections: start -->

## メタ情報

- workflow_id: `public-members-tag-filter-ux-refine`
- status: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL`

## 目的

公開メンバー一覧のタグ絞り込み UI を、実コード・仕様書・証跡が矛盾しない形で改善する。

## 実行タスク

- Phase 5 の責務に沿って、CSS/markup/test/証跡/正本同期の該当項目を確認する。
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

## 0. implementation_mode

`existing-hardening`（既存 `apps/web` ページの UI 表現層改修）。新規ファイル作成・新 endpoint・新 primitive は無い（INV-1 / INV-6）。CSS への追加ルールと markup へのラッパ 1 個追加、既存セレクタ修正のみ。

## 1. CONST_005: 変更対象ファイル一覧

| # | パス | 種別 | 主変更 | 設計参照 |
|---|------|------|--------|---------|
| 1 | `apps/web/src/styles/legacy-public.css` | 編集 | (a) `[data-role="tag-picker-options"]` flex 横並び追加 / (b) `[data-role="filter-group"]` グルーピング追加 / (c) member-grid comfy gap トークン化 | Phase 2 §1 / §2.2 / §4 |
| 2 | `apps/web/src/styles/globals.css` | 編集 | `tag-pill` 選択強調セレクタに `[aria-checked="true"]` 併記 + accent 化 | Phase 2 §3 |
| 3 | `apps/web/src/components/public/MemberFilters.client.tsx` | 編集（最小） | `filters-body` 内に `<div data-role="filter-group" data-group="inputs">` ラッパ 1 個追加（`filter-grid` + `live-filter-hint` + `result-count` を内包）。URL query ロジック不変 | Phase 2 §2.1 |
| 4 | `apps/web/src/components/public/TagPicker.client.tsx` | **無変更** | 既存 `data-role="tag-picker-options"` で横並び成立。`role="switch"` / `aria-checked` / 上限 hint / empty option 不変（INV-7） | Phase 2 §6.1 #4 |
| 5 | `apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx` | 編集 | TC-A-01/02/03 / TC-B-05 追加（既存維持） | Phase 4 §3 #1 |
| 6 | `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | 編集 | TC-A-04/05/06 追加（既存維持・階層非依存） | Phase 4 §3 #2 |

> `MemberCard.tsx` / `MemberGrid.tsx` は **無変更**（過密緩和は member-grid の CSS gap で吸収）。

## 2. ファイル #1: `legacy-public.css`（3 ブロック）

### 2.1 (a) `tag-picker-options` 横並び（追加）

挿入位置: `[data-component="member-filters"] [data-role="tag-picker-heading"]` ルール（L1436-1441）の **直後**。

追加する CSS ブロック全文:

```css
[data-component="member-filters"] [data-role="tag-picker-options"] {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ubm-space-2);          /* 8px: chip 間 + 折り返し行間を一括指定 */
  list-style: none;
  padding: 0;
  margin: 0;
}
[data-component="member-filters"] [data-role="tag-picker-options"] > li {
  display: inline-flex;             /* <li> を縮約し tag-pill を inline-flex のまま横に並べる */
}
```

- トークン根拠: `gap: var(--ubm-space-2)`（8px）は既存 `[data-role="active-filters"]`（`legacy-public.css` L1404）の flex-wrap と同リズム。`flex-wrap` 下では `gap` が折り返し行間にも効くため AC-1 の「折り返し時の行間も適切」を 1 宣言で満たす。
- HEX 直書きなし（INV-2）。`display` / `flex-wrap` / `list-style` / `padding:0` / `margin:0` は色を含まないため token 不要。

### 2.2 (b) `filter-group` グルーピング（追加）

挿入位置: `[data-component="member-filters"] [data-role="filter-grid"]` ルール（L1357 近傍）の近接。

追加する CSS ブロック全文:

```css
[data-component="member-filters"] [data-role="filter-group"] {
  display: flex;
  flex-direction: column;
  gap: var(--ubm-space-3);          /* 12px: グループ内要素の縦リズム */
}
```

- 既存 `filter-grid` の `display:grid; grid-template-columns: 1.5fr 1fr 1fr 1fr;`（L1358-1360）は **不変**。グループラッパは縦方向の余白付与のみ。
- 区切りは既存 `[data-component="tag-picker"]` の `border-top: 1px solid var(--ubm-color-border-default)`（L1431-1434）が担い、新たな区切り線は増やさない（過剰装飾回避）。

### 2.3 (c) member-grid comfy gap トークン化（編集）

対象: `[data-component="member-grid"][data-density="comfy"]`（L1449-1451 近傍）。

before / after:

```css
/* before */
[data-component="member-grid"][data-density="comfy"] {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

/* after */
[data-component="member-grid"][data-density="comfy"] {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--ubm-space-6);          /* 24px: ベタ値→space トークン化 + 過密緩和 (AC-4) */
}
```

- 列定義（`minmax(320px,1fr)`）は不変。`dense`（`var(--ubm-space-3)`）/ `list`（`1px` 境界表現）の gap は意図的設計のため不変（3 密度維持・AC-4）。
- 18px ベタ値の `var(--ubm-space-6)`（24px）化は AC-6（トークン正本化）の趣旨に整合し、`verify-design-tokens` リスクを下げる。

> **着手時確認**: `--ubm-space-6` が `tokens.css` に定義済みであることを実 grep で確認する。未定義の場合は `--ubm-space-5` 等の最近接定義トークンへ変更し本書を更新する（ベタ 24px 直書きはしない＝INV-2）。

## 3. ファイル #2: `globals.css`（選択強調セレクタ修正）

対象: `[data-component="tag-pill"][aria-selected="true"]`（L1756-1760）。

before / after:

```css
/* before */
[data-component="tag-pill"][aria-selected="true"] {
  background: var(--ubm-color-text-primary);
  border-color: var(--ubm-color-text-primary);
  color: var(--ubm-color-surface-panel);
}

/* after */
[data-component="tag-pill"][aria-selected="true"],
[data-component="tag-pill"][aria-checked="true"] {
  background: var(--ubm-color-accent);        /* OKLch accent: 選択を accent で明示 (AC-3) */
  border-color: var(--ubm-color-accent);
  color: var(--ubm-color-surface-panel);      /* accent 上の可読文字色 (コントラスト AA / AC-10) */
}
```

- 根拠: 現状 markup は `aria-checked`（`TagPicker.client.tsx` L44）のみ付与しており `aria-selected` セレクタが効かず強調が出ていない（Phase 1 §1.2）。`aria-checked="true"` を併記して選択強調を発火させる。`aria-selected` は後方互換で残す（最小差分）。
- accent 化根拠: 横並びでは accent（ブランド色）の方が「選択」アフォーダンスが直感的で、`:focus-visible` outline（`--ubm-color-accent`）とも一貫。`--ubm-color-accent` は OKLch 定義（`oklch(0.52 0.10 55)`・`tokens.css`）。HEX 直書きなし（INV-2）。
- INV-7 適合: `role="switch"` / `aria-checked` の **値**・トグル挙動は不変。CSS が `aria-checked` を視覚反映するだけ。

> **cascade 確認（Phase 3 MINOR-1）**: `aria-checked="true"`（選択済み）と `aria-disabled`（上限到達時は未選択 chip のみ）は `TagPicker.client.tsx` L45（`isDisabled = reached && !isSelected`）により同一要素に共存しない。競合なし。`:hover`（L1752）との詳細度競合も `[aria-checked="true"]`（属性セレクタ 2 個）が `:hover`（属性 1 個 + 擬似クラス）より勝るため強調が優先される。

## 4. ファイル #3: `MemberFilters.client.tsx`（filter-group ラッパ追加）

挿入箇所: `<div data-role="filters-body">`（L141）内。現行は `filter-grid`（L142-185）→ `result-count`（L186-194）→ `TagPicker`（L195-201）→ `SelectedFiltersBar`（L202-214）がフラットに並ぶ。これを **`filter-grid` + `result-count` を `filter-group` ラッパで囲む**（TagPicker と SelectedFiltersBar はラッパ外＝既存 border-top 区切りでグルーピング）。

挿入後の JSX 構造（差分の要点のみ）:

```tsx
<div data-role="filters-body">
  {/* ▼ 追加: グループ1（入力フィルタ）ラッパ開始 */}
  <div data-role="filter-group" data-group="inputs">
    <div data-role="filter-grid">
      {/* 既存 FormField 群（キーワード検索 / UBM区画 / 参加ステータス / 並び替え）＋ live-filter-hint — 変更なし */}
    </div>
    <output
      id="member-result-count"
      data-role="result-count"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {resultLabel}
    </output>
  </div>
  {/* ▲ 追加: グループ1 ラッパ終了 */}

  <TagPicker
    options={topTags}
    selected={initial.tag}
    max={MEMBERS_SEARCH_LIMITS.TAG_LIMIT}
    onToggle={onTagToggle}
    heading="タグで絞り込み"
  />
  {hasFilters ? (
    <SelectedFiltersBar ... />   {/* 既存どおり・変更なし */}
  ) : null}
</div>
```

- 追加するのは `<div data-role="filter-group" data-group="inputs">` の **開きタグ 1 個 + 閉じタグ 1 個**のみ。内側の `filter-grid` / `live-filter-hint` / `result-count` の中身は **一切変更しない**（L142-194 をそのままラッパで囲うだけ）。
- `live-filter-hint`（L152-154）は既存どおり `filter-grid` 内に残す（位置維持）。
- **URL query 正本不変**: `update()` / `onTagToggle()` / `useSearchParams` / `router.replace` / `hasFilters` / `resultLabel` は変更しない。React state は既存 `expanded`（mobile 展開）のみで増やさない（不変条件 #8）。
- props 契約不変: `MemberFiltersProps` 型は変更なし。

## 5. ファイル #4: `TagPicker.client.tsx`（無変更）

既存 `<ul data-role="tag-picker-options">`（L35）に §2.1 の CSS を当てるだけで横並びが成立するため **無変更**。`role="switch"` / `aria-checked` / `aria-disabled` / `tag-limit-hint` / `options.length === 0` の早期 return（empty option）は不変（INV-7）。

## 6. 入出力・副作用 / エラー・エッジ

### 6.1 入出力・副作用

| 変更 | 入出力 | 副作用 |
|------|--------|--------|
| #1 CSS（legacy-public.css） | なし（描画スタイルのみ） | **副作用なし**。DOM 構造を変えず flex/gap を適用 |
| #2 CSS（globals.css） | なし | **副作用なし**。`aria-checked="true"` chip の塗りが変わるのみ |
| #3 markup（MemberFilters） | props 不変 | DOM に `filter-group` 要素が 1 個増える → `filters-body` 直下の階層が 1 段深くなる。既存 spec が階層依存 assertion を持つ場合に影響（Phase 6 で `getByRole`/`getByLabelText` 基準を確認し非影響を保証）。URL query / API fetch / state は不変 |

### 6.2 エラー・エッジ

| ケース | 挙動 | 担保 |
|--------|------|------|
| タグ 0 件（`topTags=[]`） | `TagPicker` が `null` を return し `tag-picker` 自体描画されない（既存）。`tag-picker-options` ルールは対象要素不在で無害 | TC-B-04 |
| 上限到達（`selected.length >= max`） | 未選択 chip が `aria-disabled`、選択 chip は `aria-checked="true"` のまま強調維持。両者非共存（§3 cascade 確認） | TC-B-03 / TC-B-05 |
| 長いタグ名（折返し） | `flex-wrap: wrap` が次行へ折返し、`gap: var(--ubm-space-2)` が行間も担保。横スクロール / オーバーフローは発生しない | Phase 11 visual（AC-1/AC-9） |
| モバイル折りたたみ | 既存 `[data-expanded="false"] [data-role="filters-body"] { display:none }`（globals.css L2330）で折りたたみ。展開時は `tag-picker-options` の wrap が viewport 幅に追従（breakpoint 固有 CSS 不要） | TC-B-13 + Phase 11 visual（AC-9） |

## 7. 実装順序

1. ファイル #2（globals.css 選択強調修正）— 独立・最小。
2. ファイル #1（legacy-public.css 3 ブロック）— CSS 主体。`--ubm-space-6` 存在を実 grep 確認してから (c) を適用。
3. ファイル #3（MemberFilters filter-group ラッパ）— markup 最小。
4. ファイル #5 / #6（spec 更新）— Phase 4 の TC を反映。
5. 検証コマンド（§8）を実行。

> 1 サイクル完結・先送りタスクなし（CONST_007）。スコープ外（category グルーピング / タグ検索ボックス）は Phase 12 unassigned baseline として非起票記録。

## 8. ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --no-coverage \
  apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberGrid.spec.tsx \
  apps/web/src/components/public/__tests__/MemberCard.spec.tsx
mise exec -- pnpm verify:design-tokens   # AC-6: HEX/任意色 0 件
bash scripts/verify-pr-ready.sh
```

## 9. DoD

- [ ] `tag-picker-options` が flex-wrap で横並び（縦積み解消・AC-1）
- [ ] `filter-group` ラッパ + 既存 `tag-picker` border-top でフィルタ領域グルーピング（AC-2）
- [ ] 選択中タグが `[aria-checked="true"]` で accent 強調（AC-3）
- [ ] member-grid comfy gap が `var(--ubm-space-6)` でトークン化・過密緩和、3 密度維持（AC-4）
- [ ] 既存 tag-pill 挙動（switch / checked / 上限 / empty）不変・既存 spec 緑（AC-5 / INV-7）
- [ ] `verify-design-tokens` pass（AC-6・HEX 0 件）／新規 primitive 0（AC-7）／`apps/api`・`packages/shared`・D1・Form 差分 0（AC-8）
- [ ] mobile/desktop で wrap 破綻なし（AC-9）／a11y 維持（AC-10）
- [ ] typecheck / lint / vitest / verify-pr-ready pass（AC-11）

## 10. 完了条件

- [x] 変更対象ファイル一覧（パス + 新規/編集）
- [x] 各ファイルの具体差分方針（legacy-public.css 追加 CSS 全文 / globals.css before・after / MemberFilters 挿入箇所と JSX）
- [x] 入出力・副作用（CSS=副作用なし / markup=DOM 構造変化と既存 spec 影響）
- [x] エラー・エッジ（タグ 0 件 / 上限到達 / 長いタグ名折返し / モバイル折りたたみ）
- [x] 実装順序・実行コマンド・DoD（後続実装者がそのまま着手できる粒度）
