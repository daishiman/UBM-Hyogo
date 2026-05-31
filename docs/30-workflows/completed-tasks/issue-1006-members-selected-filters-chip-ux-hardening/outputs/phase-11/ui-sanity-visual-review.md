# Phase 11: UI Sanity / Visual Review

- Task ID: TASK-MEMBERS-SELECTED-FILTERS-CHIP-UX-HARDENING-001
- タスク種別: **VISUAL**（NON_VISUAL ではない）
- 非該当判定: 該当なし（本タスクは chip 表示名・focus リング・mobile レイアウトという視覚的変化を伴うため VISUAL）

## 1. Apple HIG / プロトタイプ整合チェック

| 観点 | 期待 | 結果 |
| --- | --- | --- |
| タイポグラフィ / リズム | chip は既存 `filter-chip` primitive の font-size/padding を維持 | pass（CSS 既存 primitive 維持） |
| カラートークン | `var(--ubm-color-...)` のみ。HEX 直書きゼロ（AC-7 / `verify-design-tokens`） | pass（verify-design-tokens 9/9） |
| フォーカス可視性 | chip / クリアの focus リングが視認でき、削除後も連続する（AC-3） | pass_semantic（focused Vitest。visual screenshot は runtime pending） |
| タッチターゲット（mobile） | <=640px で縦積み時もタップ領域が十分・重ならない（AC-4） | pass_local_css_sanity |
| 一貫性 | chip 表示名が `TagPicker` の `#{label}` と一致（AC-1） | pass（focused Vitest） |

## 2. 視覚リグレッション観点

- desktop: 既存 chip レイアウト（横並び wrap）を維持しつつ tag だけ表示名へ。
- mobile: 新規 `@media (max-width:640px)` 縦積み。他画面へ波及しないこと（selector が `[data-component="selected-filters-bar"]` 配下に閉じる）を目視確認。

## 3. 判定

local semantic / CSS sanity / component-harness screenshot 3 枚は pass。staging data-backed screenshot は user-gated runtime pending。
