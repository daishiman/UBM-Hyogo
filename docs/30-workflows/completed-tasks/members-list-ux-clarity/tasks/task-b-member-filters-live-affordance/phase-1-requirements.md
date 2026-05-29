<!-- workflow: members-list-ux-clarity / task: B / phase: 1 -->

[実装区分: 実装仕様書]

# Phase 1 — 要件定義 (Task B: member-filters-live-affordance)

> 親 Phase 1: `../../phase-1-requirements.md`
> taskType=implementation / visualEvidence=VISUAL / implementation_mode=new

## 1. 背景

`/members` の `MemberFilters` は URL 即時 replace で動作するが、ユーザーが「適用ボタンを探す」「適用中条件が読めない」「クリアできることに気付かない」状態になっている。
親 Phase 1 § 1 (2)(3)(4) の課題に対する affordance 層改修を本 task が単独で担当する。

## 2. ペルソナ

- **P-2 既存会員**: キーワードで人を探す。即発火と適用中条件のサマリを必要とする
- **P-3 a11y 利用者**: 件数変化を SR で受け取り、適用中条件を把握する

## 3. Goal

- 「filter は入力すると即反映される」ことを画面上で明示する
- 「適用中の絞り込み条件」を chip 列で一覧表示し、× ボタンで個別解除できる
- 「クリア」は `hasFilters=true` のときだけ視覚的に強調表示する
- `aria-live="polite"` で件数変化を SR に通知する

## 4. 受入条件 (AC) — Task B 担当分

| ID | 内容 |
| -- | ---- |
| AC-B-1 | `<form data-component="member-filters">` の Search 直下に `<small data-role="live-filter-hint" id="member-filters-hint">入力すると自動で絞り込まれます (Enter 不要)</small>` を表示する。`form` には `aria-describedby="member-filters-hint"` を付与する |
| AC-B-2 | `data-role="filters-body"` 末尾に `<output data-role="result-count" aria-live="polite" aria-atomic="true">` を配置する。`page.tsx` から `totalCount` / `displayedCount` を受け取り、`X 件中 Y 件を表示しています` (0 件時 `該当者なし`) を表示する |
| AC-B-3 | `SelectedTagsBar` を `SelectedFiltersBar.client.tsx` に汎化する。`q` / `zone` / `status` / 各 tag を統一 chip 列で表示し、`sort` は除外する |
| AC-B-4 | 各 chip は `<button aria-label="<ラベル>絞り込みを解除">` で個別解除でき、`onClearOne` callback を呼ぶ。`q` chip は `キーワード: <値>`、`zone` chip は `ゾーン: <日本語>`、`status` chip は `種別: <日本語>`、tag は `#<code>` 形式 |
| AC-B-5 | clear ボタンを `SelectedFiltersBar` 右端に統合し、`hasFilters=true` のときだけ描画する。`hasFilters=false` のときは bar 全体を描画しない |
| AC-B-6 | URL query 互換 (`q`/`zone`/`status`/`sort`/`tag`/`density`) を完全維持し、内部 state には移行しない |
| AC-B-7 | 既存 `MemberFilters.client.spec.tsx` の全 7 ケースが GREEN を維持する (selector / aria-label / data-role 後方互換) |
| AC-B-8 | `MemberFilters.client.spec.tsx` に `result-count` の `role="status"` 検証ケースを追加する (`getByRole("status")` が `0 件中 0 件` 系を含むこと) |
| AC-B-9 | `SelectedFiltersBar.client.spec.tsx` (新規) で chip 列描画 / × 解除 / `hasFilters=false` 未描画 / `sort` 非含有 を検証する |
| AC-B-10 | `verify-design-tokens` CI gate が GREEN を維持し、新 primitive 追加 0 件 |

## 5. Inventory (変更対象ファイル)

| 種別 | パス | 推定差分 | 概要 |
| ---- | ---- | -------- | ---- |
| 修正 | `apps/web/src/components/public/MemberFilters.client.tsx` | +110 / -30 | hint / live region / 件数 prop / SelectedFiltersBar 呼び出し / clear 廃止 |
| 新規 | `apps/web/src/components/public/SelectedFiltersBar.client.tsx` | +130 | q/zone/status/tag の chip 列 + 右端 clear-all |
| 修正 | `apps/web/src/components/public/SelectedTagsBar.client.tsx` | +12 / -0 | 後方互換 wrapper として `SelectedFiltersBar` を `selected/onRemove/onClearAll` のみで呼ぶ薄い再エクスポート (export 名維持) |
| 修正 | `apps/web/app/(public)/members/page.tsx` | +6 / -2 | `<MemberFilters totalCount displayedCount />` を渡す。`<p data-role="pagination-meta">` は機械可読のため維持 |
| 修正 | `apps/web/src/styles/legacy-public.css` | +60 / -8 | live-filter-hint / result-count / selected-filters-bar / clear-all primary 強調 |
| 修正 | `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | +60 / -0 | AC-B-1..2/5/8 の追加ケース。既存 7 ケースは後方互換維持 |
| 新規 | `apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx` | +90 | AC-B-3/4/9 検証 |

## 6. 既存命名規則の確認

- ファイル: `*.client.tsx` (Client Component) / `*.tsx` (Server or shared) / `__tests__/*.spec.tsx`
- React component: PascalCase (`MemberFilters` / `SelectedTagsBar`)
- props interface: `<Component>Props` (例: `MemberFiltersProps`)
- selector: `data-component="kebab-case"` / `data-role="kebab-case"`
- callback prop: `on<Verb>` (`onRemove` / `onClearAll`)
- 命名衝突確認: `SelectedFiltersBar` は新規。`apps/web/` 内に既存同名なし

## 7. Out-of-scope

- `DensityToggle` 改修 (Task A)
- `/members/page.tsx` の visual baseline 撮影 (Task C)
- `FiltersSummaryMobile` の文言・構造変更 (件数文字列の反映は許容するが本 task では実施しない)
- sort を chip 化する案 (親 Phase 3 で却下済)
- debounce / spinner 系演出 (親 Phase 3 で却下済)
- `page.tsx` の `<p data-role="pagination-meta">` 撤去 (機械可読 metadata として維持)

## 8. リスク

| ID | リスク | 対策 |
| -- | ------ | ---- |
| R-B-1 | `SelectedTagsBar` を別 route が import している | Phase 5 冒頭で `git grep -n "SelectedTagsBar"` を実行し参照経路を確定。export 名を `SelectedTagsBar` のまま wrapper として維持 |
| R-B-2 | `aria-live` が二重宣言になり SR が煩わしい | `<output>` 1 箇所だけに `aria-live="polite"` を付け、`pagination-meta` には付けない |
| R-B-3 | `MemberFilters.client.spec.tsx` 既存 7 ケースが selector 変更で破壊 | clear 配置は変わるが旧 `[data-role="clear"]` selector の参照箇所は `disabled` 状態を期待しているため、後方互換のため `[data-role="clear"]` セレクタを `SelectedFiltersBar` 内 button にも付与する |
| R-B-4 | `page.tsx` 統合は Task C 担当だが本 task でも prop 追加が必要 | 本 task の `page.tsx` 改修は「`totalCount`/`displayedCount` を渡す」最小差分のみ。visual baseline 撮影は Task C |
| R-B-5 | chip ラベル日本語化辞書がコンポーネント内分散 | `SelectedFiltersBar` 内部に label 写像表 (const) を 1 箇所だけ持つ |

## 9. carry-over

- 既存 `[data-role="clear"]` selector 後方互換: `SelectedFiltersBar` 内 clear-all button に `data-role="clear"` を併設 (新 `data-role="clear-all"` とのエイリアス) し、既存 spec の `clearBtn.disabled` チェックは「hasFilters=false の時は描画されない」検証に置換するため Phase 4 で既存ケース修正方針を確定する
- `SelectedTagsBar` 後方互換 wrapper: 旧 props (`selected` / `onRemove` / `onClearAll`) を受けて `SelectedFiltersBar` に転送
- `MEMBERS_SEARCH_LIMITS` / `MembersSearch` 型は変更しない

## 10. P50 チェック

- 本 task 単独で +260 / -60 LOC、新 primitive 0、API 変更 0
- 既存 spec は後方互換で全 PASS、追加で 3-4 ケース増
- Task A / C と独立並列着手可
- TDD 順序: 既存 spec を RED 化しない設計 → 新ケース追加で RED → 実装で GREEN

## 11. DoD

- [x] AC-B-1..AC-B-10 が列挙されている
- [x] Inventory が「種別 / パス / 推定差分 / 概要」を持つ
- [x] Out-of-scope / リスク / carry-over がそれぞれ独立節
- [x] 既存命名規則 + 命名衝突確認を明文化
- [x] `taskType=implementation` / `visualEvidence=VISUAL` / `implementation_mode=new` を Phase 1 メタで宣言
- [x] テスト命名規則 (`*.spec.tsx`) を明文化
