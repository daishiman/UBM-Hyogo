# Phase 2: 設計

| 項目 | 値 |
|------|-----|
| Phase | Phase 2 — 設計 |
| workflow_id | `public-members-tag-filter-ux-refine` |
| status | `spec_created` |
| 正参照 | [`_shared-context.md`](./_shared-context.md) / [`phase-01-requirements.md`](./phase-01-requirements.md) |

> 本 Phase は Phase 1 で確定した RCA・CSS 正本（`legacy-public.css` に `tag-picker-options`、`globals.css` に選択強調修正）を前提に具体設計を行う。新規 primitive は作らない（INV-6）。


<!-- validator-facing required sections: start -->

## メタ情報

- workflow_id: `public-members-tag-filter-ux-refine`
- status: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL`

## 目的

公開メンバー一覧のタグ絞り込み UI を、実コード・仕様書・証跡が矛盾しない形で改善する。

## 実行タスク

- Phase 2 の責務に沿って、CSS/markup/test/証跡/正本同期の該当項目を確認する。
- `_shared-context.md` の AC / INV / 変更対象と矛盾しないことを確認する。

## 参照資料

- `_shared-context.md`
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物

- 本 Phase ファイル
- 対応する `apps/web` / `outputs/` / skill 正本同期の実変更

## 統合テスト連携

- focused Vitest / typecheck / lint / token gate の結果を Phase 11 evidence と Phase 12 compliance に同期する。
<!-- validator-facing required sections: end -->

## 0. 既存再利用可否

| 既存 | 再利用 | 用途 |
|------|--------|------|
| `[data-component="tag-picker"]` wrapper（`legacy-public.css` L1431） | ✅ | flex 横並びルールの親。border-top / margin / padding はそのまま |
| `[data-role="tag-picker-heading"]`（同 L1436） | ✅ | 見出しスタイルそのまま |
| `[data-component="tag-pill"]`（`globals.css` L1734） | ✅ | chip 単体。選択強調セレクタのみ追加修正 |
| `[data-component="tag-picker"] button[aria-disabled="true"]`（`globals.css` L2334） | ✅ | 上限 disabled そのまま |
| `[data-role="filter-grid"]`（`legacy-public.css` L1357） | ✅ | 既存 grid。グルーピング section の内側で再利用 |
| `[data-component="member-grid"][data-density=...]`（`legacy-public.css` L1449-1466） | ✅ | density 3 種そのまま。gap/列の微調整のみ |
| OKLch accent トークン（`tokens.css`） | ✅ | 選択強調 / グルーピング区切り色 |

新規 primitive・新規 CSS ファイル・新規 React コンポーネントは追加しない。

## 1. AC-1: `tag-picker-options` 横並び化（`legacy-public.css` に追加）

### 1.1 追加する CSS（確定内容）

`legacy-public.css` の `[data-component="member-filters"] [data-role="tag-picker-heading"]`（L1436-1441）の **直後**に以下を追加する。

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
  display: inline-flex;             /* <li> を縮約し tag-pill を inline-flex のまま並べる */
}
```

### 1.2 トークン選定根拠

| プロパティ | 値 | 根拠 |
|-----------|-----|------|
| `gap` | `var(--ubm-space-2)`（8px） | 既存 `[data-role="active-filters"]`（選択済みフィルタ chip 群・`legacy-public.css` L1404）が同じ `var(--ubm-space-2)` の flex-wrap を採用しており、chip 群の余白リズムを統一できる。`flex-wrap` 下では `gap` が列方向（折り返し行間）にも効くため、AC-1 の「折り返し時の行間も適切」を 1 宣言で満たす。 |
| `list-style` / `padding` / `margin` | `none` / `0` / `0` | `<ul>` 既定マーカー・インデントを除去。既存 `[data-role="active-filters"]`（L1405-1407）と同パターン。 |

### 1.3 副作用なし

CSS 追加のみで DOM 構造は変えない（既存 `<ul data-role="tag-picker-options"><li>` の構造に flex を当てるだけ）。`tag-pill` は元々 `inline-flex` のため見た目の chip 形状は不変、配置のみ縦→横に変わる。

## 2. AC-2: フィルタ領域グルーピング（markup + CSS）

### 2.1 markup 設計（`MemberFilters.client.tsx`）

URL query 正本ロジック（`update` / `onTagToggle` / `router.replace`）は**一切変更しない**。視覚グルーピングのための **data-role 付与のみ**を行う。

現行 `<div data-role="filters-body">` 内は「`filter-grid`（検索/区画/種別/並び替え）」「`result-count`」「`TagPicker`」「`SelectedFiltersBar`」がフラットに並ぶ。これを 2 つの論理グループに `data-role` でラベリングする（タグ追加は最小・既存子要素は移動しない）。

```tsx
<div data-role="filters-body">
  {/* グループ1: 入力フィルタ（検索・Select 群） */}
  <div data-role="filter-group" data-group="inputs">
    <div data-role="filter-grid">
      {/* 既存 FormField 群（検索 / 区画 / 種別 / 並び替え）— 変更なし */}
    </div>
    <output id="member-result-count" data-role="result-count" ...>{resultLabel}</output>
  </div>

  {/* グループ2: タグフィルタ（TagPicker） */}
  <TagPicker ... />   {/* 既存 data-component="tag-picker" が自前で border-top 区切りを持つ */}

  {hasFilters ? <SelectedFiltersBar ... /> : null}
</div>
```

- 追加するのは `<div data-role="filter-group" data-group="inputs">` のラッパ 1 個のみ。`live-filter-hint`（`<span>`）は既存どおり `filter-grid` 内に残す（現行 L152-154 の位置を維持）。
- `TagPicker` 側は既に `[data-component="tag-picker"]` が `border-top` でフィルタ入力群と区切られている（`legacy-public.css` L1431-1434）ため、タグ群のグルーピングは既存ルールで成立する。markup 追加不要。

> URL 正本不変条件: `update()` / `onTagToggle()` / `useSearchParams` / `router.replace` の呼び出しは変更しない。state は `expanded`（mobile 展開）のみで増やさない。

### 2.2 グルーピング CSS（`legacy-public.css`）

`filter-grid` ルール（L1357）近傍に、グループ単位の余白を追加する。

```css
[data-component="member-filters"] [data-role="filter-group"] {
  display: flex;
  flex-direction: column;
  gap: var(--ubm-space-3);          /* 12px: グループ内要素の縦リズム */
}
```

- 既存 `filter-grid` の `display:grid; grid-template-columns: 1.5fr 1fr 1fr 1fr;`（L1358-1360）は不変。グループラッパは縦方向の余白付与のみ。
- 「区切り」は既存 `tag-picker` の `border-top`（accent ではなく `--ubm-color-border-default`）が担う。新たな区切り線は増やさない（過剰装飾回避）。

## 3. AC-3: 選択中タグ強調（`globals.css` の選択強調セレクタ修正）

### 3.1 問題（Phase 1 §1.2 で裏取り）

`globals.css` L1756 は `[data-component="tag-pill"][aria-selected="true"]` だが、markup は `aria-checked`。現状強調が効いていない。

### 3.2 修正設計

`globals.css` L1756-1760 の既存ルールのセレクタに `aria-checked="true"` を **併記**する（既存 `aria-selected` は後方互換で残す／削除いずれも可だが、最小差分で「併記」を採る）。

```css
[data-component="tag-pill"][aria-selected="true"],
[data-component="tag-pill"][aria-checked="true"] {
  background: var(--ubm-color-accent);        /* OKLch accent: 選択を accent で明示 */
  border-color: var(--ubm-color-accent);
  color: var(--ubm-color-surface-panel);      /* accent 上の可読文字色 */
}
```

### 3.3 強調色の選定根拠

- 既存ルールは `--ubm-color-text-primary`（ダーク反転）で強調していたが、**横並びでは accent（ブランド色）の方が「選択」というアフォーダンスが直感的**で、`:focus-visible` outline（`--ubm-color-accent`・`globals.css` L2341）とも一貫する。
- `--ubm-color-accent` は OKLch 定義（`oklch(0.52 0.10 55)`・`tokens.css` L22）。文字色 `--ubm-color-surface-panel`（白系面）でコントラスト AA を確保（AC-10）。
- INV-7 適合: `role="switch"` / `aria-checked` の **値**やトグル挙動は不変。CSS が `aria-checked` を視覚に反映するだけ。

> 代替案検討: `--ubm-color-accent-soft`（淡 accent）＋ `--ubm-color-accent-ink`（濃 accent 文字）の組も AA を満たし「選択済みだが淡い」表現になる。本設計は「選択中タグの判別が横並びで明確」（AC-3）を優先し、彩度の高い `--ubm-color-accent` 塗りを採用。Phase 3 でリスク評価。

## 4. AC-4: member-grid 余白調整（`legacy-public.css`）

過密感の解消は **既存 density ルールの gap 値をトークン化・微増**するに留める（列定義は不変で 3 密度維持）。

### 4.1 現行 → 調整方針

| density | 現行（L1449-1466） | 調整 |
|---------|-------------------|------|
| comfy | `gap: 18px;` `minmax(320px,1fr)` | `gap: var(--ubm-space-6);`（24px へ。OKLch/space トークン化 + 余白増で過密緩和）。列定義不変 |
| dense | `gap: var(--ubm-space-3);` `minmax(260px,1fr)` | 不変（既にトークン・密度高さは density の意図） |
| list | `gap: 1px;`（境界線表現） | 不変（list は意図的に 1px 区切り） |

- comfy の `18px` ベタ値を `var(--ubm-space-6)`（24px）へ置換。これは余白増による過密緩和（AC-4）と、ベタ値のトークン化（AC-6 の趣旨）を同時に満たす。
- カード内余白（`member-card[data-density="comfy"] { padding: 22px; }` L1492）は現状で過密ではないため不変。**必要時のみ**調整とし、本設計では grid gap のみで吸収する（`_shared-context.md` §5 #7 = CSS 主体で吸収できる場合は無変更）。

## 5. AC-9 / NFR-3: レスポンシブ（モバイル折りたたみ時の wrap）

- モバイル（`max-width: 640px`）では既存 `[data-expanded="false"] [data-role="filters-body"] { display:none; }`（`globals.css` L2330）で折りたたみ済。展開時は `filters-body` が `display:block` に戻る。
- `tag-picker-options` の `flex-wrap: wrap`（§1.1）は viewport 幅に応じて自動で折り返すため、**モバイル展開時もデスクトップも同一ルールで wrap が成立**する。breakpoint 固有の追加 CSS は不要。
- 既存の mobile media query（`legacy-public.css` L1667 で `filter-grid` を 1 列化、`selected-filters-bar` L1418-1429）は不変。

## 6. CONST_005: 設計サマリ

### 6.1 変更対象ファイル一覧

| # | パス | 種別 | 主変更 |
|---|------|------|--------|
| 1 | `apps/web/src/styles/legacy-public.css` | 編集 | `[data-role="tag-picker-options"]` flex 横並び（§1）／ `[data-role="filter-group"]` グルーピング（§2.2）／ member-grid comfy gap トークン化（§4） |
| 2 | `apps/web/src/styles/globals.css` | 編集 | `tag-pill` 選択強調セレクタに `[aria-checked="true"]` 併記 + accent 化（§3） |
| 3 | `apps/web/src/components/public/MemberFilters.client.tsx` | 編集（最小） | `<div data-role="filter-group" data-group="inputs">` ラッパ追加のみ。URL query ロジック不変 |
| 4 | `apps/web/src/components/public/TagPicker.client.tsx` | 編集（最小 or 無変更） | 既存 `data-role="tag-picker-options"` で横並び成立。`role="switch"` / `aria-checked` / 上限 hint / empty option は不変（INV-7） |
| 5 | `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | 編集 | `filter-group` ラッパ追加分の assertion 更新 |
| 6 | `apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx` | 編集（必要時） | 横並び化に伴う selector 確認の追加（DOM 構造自体は不変のため最小） |

> `MemberCard.tsx` / `MemberGrid.tsx` は **無変更**（CSS gap 調整で過密を吸収）。

### 6.2 主要構造（CSS selector / DOM / props）

- **CSS selector**: `[data-component="member-filters"] [data-role="tag-picker-options"]`（新規）／ `[data-role="filter-group"]`（新規）／ `[data-component="tag-pill"][aria-checked="true"]`（既存に併記）／ `[data-component="member-grid"][data-density="comfy"]`（gap 変更）。
- **DOM 変化**: `MemberFilters` に `filter-group` ラッパ 1 個追加。`TagPicker` の DOM は不変。
- **props 契約**: `TagPickerProps` / `MemberFiltersProps` ともに**変更なし**（型変更ゼロ）。

### 6.3 入出力・副作用

- CSS 変更（#1, #2）: 副作用なし（描画のみ）。
- markup 変更（#3）: DOM に `filter-group` 要素が 1 個増える → 既存 spec（`MemberFilters.client.spec.tsx`）が `filters-body` 直下の子構造を assert している場合に影響。Phase 4/6 で assertion を更新（#5）。
- URL query / API fetch / state: **副作用なし**（`update()` 等のロジック不変）。

### 6.4 テスト方針の方向性

- `TagPicker.client.spec.tsx`: 既存（chip render / toggle / aria-disabled 上限 / empty option）が緑であること（AC-5 回帰）。横並びは CSS のため DOM assert 不要だが、`data-role="tag-picker-options"` の存在確認を維持。
- `MemberFilters.client.spec.tsx`: `filter-group` ラッパ追加に追随。URL query 反映 case（検索/Select/タグトグル）は不変で緑。
- `MemberGrid.spec.tsx` / `MemberCard.spec.tsx`: 無変更（DOM 不変）。
- CSS は単体テスト対象外。AC-1/2/4/9 の視覚確認は Phase 11 screenshot（mobile/desktop）。

### 6.5 ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --no-coverage \
  apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberGrid.spec.tsx \
  apps/web/src/components/public/__tests__/MemberCard.spec.tsx \
  apps/web/app/\(public\)/members/page.spec.tsx
mise exec -- pnpm verify:design-tokens   # AC-6: HEX/任意色 0 件
bash scripts/verify-pr-ready.sh
```

> vitest の root は repo ルートのため `--root=../..` + `apps/web/...` フルパス指定が必要（MEMORY 既知の罠）。filter 名は実 `package.json#name` を Phase 4 で最終確認（`@ubm-hyogo/web` 想定）。

### 6.6 DoD

- [ ] `tag-picker-options` が flex-wrap で横並び（縦積み解消・AC-1）
- [ ] フィルタ領域が `filter-group` + 既存 `tag-picker` border-top でグルーピング（AC-2）
- [ ] 選択中タグが `aria-checked="true"` で accent 強調（AC-3）
- [ ] member-grid comfy gap がトークン化・過密緩和、3 密度維持（AC-4）
- [ ] 既存 tag-pill 挙動（switch/checked/上限/empty）不変・既存 spec 緑（AC-5）
- [ ] `verify-design-tokens` pass（AC-6）／新規 primitive 0（AC-7）／apps/api 等差分 0（AC-8）
- [ ] mobile/desktop で wrap 破綻なし（AC-9）／a11y 維持（AC-10）
- [ ] typecheck / lint / vitest / verify-pr-ready pass（AC-11）

## 7. INV-6 適合の明記

本設計は **新規 primitive を一切作らない**。`apps/web/src/components/ui/` にファイル追加なし。横並び・グルーピング・選択強調・余白調整はすべて
(a) 既存 CSS への追加ルール、(b) 既存 data-* selector、(c) markup への最小ラッパ 1 個、のみで構成する。

## 完了条件

- [x] tag-picker-options への追加 CSS（flex/flex-wrap/gap・実在 space トークン）確定
- [x] フィルタ領域グルーピングの markup 設計（data-role 追加・URL query 不変）
- [x] 選択中タグ強調（aria-checked + accent トークン）の設計
- [x] member-grid 余白調整（comfy gap トークン化）
- [x] レスポンシブ（wrap）方針
- [x] CONST_005（変更ファイル一覧 / 構造 / 入出力副作用 / テスト方針 / 実行コマンド / DoD）
- [x] 新規 primitive を作らない（INV-6）旨を明記
