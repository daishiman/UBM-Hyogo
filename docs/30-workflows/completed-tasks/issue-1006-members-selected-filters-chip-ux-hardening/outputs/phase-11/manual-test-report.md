# Phase 11: 手動テストレポート（VISUAL / implemented_local_runtime_pending）

- Task ID: TASK-MEMBERS-SELECTED-FILTERS-CHIP-UX-HARDENING-001
- mode: **VISUAL**
- 証跡の主ソース: focused vitest 2 spec（`SelectedFiltersBar.client.spec.tsx` / `MemberFilters.client.spec.tsx`）の TC 群 + Phase 11 screenshot 3 枚
- 実 screenshot 取得状況: **pass_component_harness**（canonical 3 PNG は保存済み。data-backed staging screenshot は user-gated verification で再取得可能）

> 本レポートは現在のローカル実装検証結果を記録する。`manual-test-result.md` と本ファイルは同一 wave で更新する（[FB-VISUAL-CAP-001] 準拠で canonical screenshot 名を task root で固定）。

## 1. 結果テーブル

| TC | 評価層 | 期待 | 結果 | 証跡 |
| --- | --- | --- | --- | --- |
| TC-VIS-01 | Visual | desktop で tag chip が表示名 `#{label}` で描画 | pass_component_harness | screenshots/selected-filters-bar-desktop-labels.png |
| TC-VIS-02 | Visual | mobile(<=640px) で chip/クリア/result count が縦積み・非重複 | pass_component_harness | screenshots/selected-filters-bar-mobile-stacked.png |
| TC-VIS-03 | Visual / A11y UX | chip 削除後 focus が次 chip へ移動（focus リング視認） | pass_component_harness | vitest focus assertions + screenshots/selected-filters-bar-focus-after-remove.png |
| TC-SEM-01 | Semantic | aria-label（removeLabel）が表示名と一致 | pass | vitest: SelectedFiltersBar.client.spec.tsx / MemberFilters.client.spec.tsx |
| TC-SEM-02 | Semantic | 未登録 code は `#{code}` fallback（壊れない） | pass | vitest: SelectedFiltersBar.client.spec.tsx |

## 2. 環境ブロッカー（あれば記録 / source-level PASS と分離）

- data-backed screenshot は staging / auth 設定済み runtime の追加確認として分離する。source-level / focused test / component-harness visual は pass。

## 3. canonical screenshot 名

`selected-filters-bar-desktop-labels.png` / `selected-filters-bar-mobile-stacked.png` / `selected-filters-bar-focus-after-remove.png`（保存先 `outputs/phase-11/screenshots/`）。`phase11-capture-metadata.json` / `screenshot-plan.json` / `implementation-guide.md` と同一名で固定。
