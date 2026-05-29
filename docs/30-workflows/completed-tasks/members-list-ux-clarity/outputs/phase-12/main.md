# Phase 12 — members-list-ux-clarity close-out

`/members` UX clarity workflow は実コードへ加法反映済み。既存API、D1 schema、URL query正本、design token方針は維持した。

実装範囲:
- `DensityToggle` に sublabel、visually-hidden description、`<details data-component="help-hint">` を追加。
- `Segmented` optionを後方互換のoptional propで拡張。
- `MemberFilters` に live-filter hint、result count live region、`SelectedFiltersBar`連携を追加。
- `SelectedTagsBar` は後方互換wrapperとして維持。
- `/members/page.tsx` から `totalCount` / `displayedCount` を渡し、既存 `pagination-meta` は `aria-hidden` に縮退。

commit / push / PR / staging visual baseline PNG更新は未実行。local component testsを今回サイクルの実行証跡とする。
