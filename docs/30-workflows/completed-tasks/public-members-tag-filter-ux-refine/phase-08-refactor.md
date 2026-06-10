# Phase 8: リファクタリング

| 項目 | 値 |
|------|-----|
| Phase | Phase 8 — リファクタリング |
| workflow_id | `public-members-tag-filter-ux-refine` |
| status | `spec_created` |
| taskType | `implementation`（UI 表現層改善・CSS 主体） |
| visualEvidence | `VISUAL` |
| 正参照 | [`_shared-context.md`](./_shared-context.md) / [`phase-02-design.md`](./phase-02-design.md) / [`phase-03-design-review.md`](./phase-03-design-review.md) |

> 本 Phase の全記述は `_shared-context.md` を正本とし、矛盾してはならない。本タスクは CSS 主体の小規模改修（合計 ~150 LOC + test 調整）であり、リファクタは「**追加に伴う重複排除・トークン化・cascade 整理**」に限定する。新規抽象化は作らない。


<!-- validator-facing required sections: start -->

## メタ情報

- workflow_id: `public-members-tag-filter-ux-refine`
- status: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL`

## 目的

公開メンバー一覧のタグ絞り込み UI を、実コード・仕様書・証跡が矛盾しない形で改善する。

## 実行タスク

- Phase 8 の責務に沿って、CSS/markup/test/証跡/正本同期の該当項目を確認する。
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

## 1. リファクタ候補（GREEN 後に 1 件ずつ評価）

Phase 5 相当（本サイクルでのコード追加）が緑になった直後に、以下を評価し **価値あるもののみ**実施する。CSS 主体ゆえ「重複排除」「ベタ値トークン化」「cascade 競合回避」が中心。

| # | 対象 | Before | After | 理由 | AC/INV |
|---|------|--------|-------|------|--------|
| R-1 | chip 群の flex-wrap + gap パターン | `tag-picker-options`（新規）と `active-filters`（`legacy-public.css` L1404・選択済みフィルタ chip 群）がともに `display:flex; flex-wrap:wrap; gap:var(--ubm-space-2)` | 値（gap トークン・wrap 方針）を**意図的に同一**に揃え、chip 群の余白リズムを統一する。共通 class への過剰抽出はしない（selector が別 data-role のため CSS class 共有化は cascade を複雑にするだけ） | chip 群の視覚リズム統一・重複「値」の整合（過剰 DRY は回避） | AC-1 |
| R-2 | member-grid comfy gap のベタ値 | `gap: 18px;`（`legacy-public.css` L1451 付近・ハードコード px） | `gap: var(--ubm-space-6);`（24px・OKLch/space トークン経由） | ベタ値 px をトークン化（AC-6 の趣旨に整合）+ 過密緩和（AC-4）。列定義・3 密度は不変 | AC-4 / AC-6 |
| R-3 | `list-style` / `padding` / `margin` リセット | `tag-picker-options`（新規）の `<ul>` 既定マーカー・インデント除去 | `active-filters`（L1405-1407）と同パターン（`none` / `0` / `0`）に揃える | 既存パターンへの整合（独自リセット値を増やさない） | AC-1 |
| R-4 | 選択強調セレクタの後方互換併記 | `globals.css` L1756 の `[aria-selected="true"]` 単独 | `[aria-selected="true"], [aria-checked="true"]` 併記（最小差分） | markup は `aria-checked` のみ使用。`aria-selected` は孤立ルールだが**削除せず併記**で最小差分を保つ。削除は別 chip 利用箇所への影響調査が必要でスコープ膨張 | AC-3 / INV-7 |

> R-1 は「class 共通化」ではなく「**値の整合**」に留める。`tag-picker-options` と `active-filters` は別 data-role・別文脈であり、共通 class へ寄せると将来どちらか一方の調整が他方に波及する密結合を生む。重複は「値の単一トークン参照（`--ubm-space-2`）」で吸収するのが最小コスト。

## 2. cascade 競合の回避方針

| 競合源 | 回避方針 | 根拠 |
|--------|---------|------|
| `tag-pill` の `:hover`（L1752）× 選択強調（L1756 併記後） | 詳細度同等。選択強調を後段に置く既存順序を維持。`aria-checked="true"` と hover は共存し得るが、選択強調（accent 塗り）が hover の border-color 変更を視覚的に上書きする想定で問題なし | Phase 3 MINOR-1 |
| `tag-pill` の disabled（L2334・`[aria-disabled="true"]`）× 選択強調（`[aria-checked="true"]`） | **同一要素に共存しない**（`isDisabled = reached && !isSelected`・`TagPicker.client.tsx` L38）。選択中 chip は disabled にならないため競合は構造的に発生しない | Phase 3 MINOR-1 |
| `filter-group`（新規・`display:flex; flex-direction:column`）× 内側 `filter-grid`（`display:grid`） | ラッパは縦方向余白付与のみ。内側 grid の `grid-template-columns` は不変。flex 親 + grid 子は標準的な入れ子で競合なし | Phase 2 §2.2 |
| `tag-picker-options`（flex）× `tag-pill`（`inline-flex`） | 子 `<li>` を `display:inline-flex` に縮約し tag-pill を inline-flex のまま並べる。flex 親 + inline-flex 子で競合なし | Phase 2 §1.1 |

> 新規セレクタはすべて `[data-component="member-filters"]` 配下にスコープし、グローバル汚染を避ける（既存 `legacy-public.css` の命名規約に整合）。詳細度を既存ルールと同等に保ち、`!important` は使用しない。

## 3. しない事（過剰リファクタ禁止）

- **新規 primitive 追加**（INV-6 違反・`apps/web/src/components/ui/` 非接触）
- **CSS class の共通化抽出**（R-1 で述べた密結合化を避ける。data-role selector 単位の独立を保つ）
- **`MemberCard.tsx` / `MemberGrid.tsx` の DOM 変更**（CSS gap 調整で過密吸収・Phase 2 §6.1）
- **URL query 正本ロジックのリファクタ**（`update` / `onTagToggle` / `router.replace` は不変・INV-7 / Phase 2 §2.1）
- **`tag-pill` の `role`/`aria` 構造変更**（INV-7・CSS は値を視覚反映するのみ）
- **comfy 以外の density（dense/list）gap 変更**（dense は密度意図・list は 1px 区切り意図のため不変・Phase 2 §4）

## 4. 判定タイミングと DoD

- 本サイクルの GREEN 直後に R-1〜R-4 を 1 件ずつ評価し、価値あるもののみ実施する。
- 各リファクタ後に `vitest`（Phase 7 コマンド）/ `verify:tokens` / `typecheck` / `lint` を再実行し緑を維持する。

### コード品質 DoD

- [ ] chip 群の gap/wrap が `--ubm-space-2` で統一されている（R-1・値整合）
- [ ] member-grid comfy gap がトークン化されベタ値 px が残っていない（R-2）
- [ ] `<ul>` リセットが既存 `active-filters` パターンに整合（R-3）
- [ ] 選択強調セレクタ併記が最小差分（`aria-selected` 残置・R-4）
- [ ] `!important` 不使用・新規セレクタが `member-filters` 配下スコープ
- [ ] cascade 競合（hover / disabled / grid 入れ子）が構造的に発生しないことを確認
- [ ] 新規 primitive・CSS class 共通化・DOM 変更を行っていない

## 5. 完了条件

- [x] リファクタ候補（R-1..R-4）と Before/After・理由・AC/INV 紐付けを明示
- [x] cascade 競合回避方針（hover / disabled / grid 入れ子 / inline-flex 子）を明示
- [x] しない事（過剰リファクタ禁止）を列挙
- [x] 判定タイミングとコード品質 DoD を明示
