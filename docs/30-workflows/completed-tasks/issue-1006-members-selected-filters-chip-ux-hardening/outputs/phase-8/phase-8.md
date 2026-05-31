# Phase 8: リファクタリング

- Task ID: TASK-MEMBERS-SELECTED-FILTERS-CHIP-UX-HARDENING-001

## 1. 方針

本 Task は最小差分・挙動不変を原則とする。Phase 5/6 実装後に、可読性・一貫性の観点で軽微な整理のみ行い、過剰リファクタ（大規模な構造変更・新規抽象の導入）は避ける。変更内容は [Feedback RT-03] に従い `対象 / Before / After / 理由` テーブルで記録する。

## 2. リファクタリング記録テーブル（[Feedback RT-03]）

| 対象 | Before | After | 理由 |
|---|---|---|---|
| tag 解決の一貫性 | tag chip 構築箇所で `tagLabels[code]` を直接参照 | `resolveTag = (code) => Object.hasOwn(tagLabels, code) ? tagLabels[code] : code` を component スコープ内に 1 つ定義し、label / removeLabel 双方で呼ぶ | `ZONE_LABELS` / `STATUS_LABELS` 解決と並ぶ「code→表示名解決」の一貫した形に揃える。prototype key 誤解決を防ぐ |
| chip 構築ループ可読性 | 各 chip（q/zone/status/tag）の label・removeLabel を散在生成 | chip 種別ごとの label/removeLabel/onRemove を 1 つの記述子配列に集約（既存構造を維持できる範囲で） | render 部の見通しを良くする。ただし既存の DOM 構造（`<ul><li><button aria-label>`）は変えない |
| ref callback の重複排除 | 各 chip で同型の `ref={(el) => chipRefs.set(key, el)}` を個別記述 | `setChipRef(key)` を返す factory（または共通 callback）に集約 | 同一パターンの ref callback 重複を削減。Map への set/cleanup ロジックを 1 箇所に |
| duplicate selector 確認 | — | `legacy-public.css` 内に `[data-component="selected-filters-bar"]` 関連の重複 selector が無いか確認し、あれば統合 | CSS の重複定義を防ぐ。selector は data-component 配下に閉じたまま |

> いずれも **挙動不変**。テーブル各行は Phase 7 のカバレッジ結果が変わらないことを前提とする。リファクタ後に 2 spec を再実行して green を維持する。

## 3. 抽出を行わない判断

- `resolveTag` の **別ファイルへの helper 抽出**は本 Task では行わない。`ZONE_LABELS` / `STATUS_LABELS` が同一 component 内に閉じているため、tag 解決のみ外出しすると一貫性がむしろ崩れる。component スコープ内関数に留める（YAGNI / 最小差分）。
- focus 管理ロジック（`chipRefs` / `pendingFocusRef` / `useEffect`）の custom hook 化は、利用箇所が `SelectedFiltersBar` 単一のため抽出メリットが薄く、本 Task では行わない。

## 4. navigation drift / dead code 確認

- [x] 削除した chip に紐づく ref が Map に残り続けない（ref callback cleanup で delete）
- [x] 未使用 import / 未使用変数が無い（lint で担保）
- [x] 到達不能な分岐（dead branch）が無い（focused vitest で間接確認）
- [x] `onEmpty` 未配線（dangling prop）が無い：`MemberFilters` 側で渡す

## 5. ゲート

- [x] リファクタ後も 2 spec green（挙動不変）
- [x] `対象/Before/After/理由` テーブルを実値に更新済み
- [x] dead code / navigation drift なし
- [x] CSS selector は `[data-component="selected-filters-bar"]` 配下に閉じたまま重複なし
