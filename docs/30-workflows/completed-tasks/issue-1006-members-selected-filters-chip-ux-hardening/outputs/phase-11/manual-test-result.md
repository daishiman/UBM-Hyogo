# Phase 11: 手動テスト結果

Task ID: TASK-MEMBERS-SELECTED-FILTERS-CHIP-UX-HARDENING-001

## 0. メタ（証跡の主ソースと現段階の扱い）

| 項目 | 内容 |
| --- | --- |
| 証跡の主ソース | focused vitest 2 spec（`SelectedFiltersBar.client.spec.tsx` / `MemberFilters.client.spec.tsx`）の TC 群 |
| 補助証跡 | local Playwright component-harness screenshot 3 枚（§3 の canonical 名で保存済み） |
| 現段階 | **implemented_local_runtime_pending**。コード実装・focused Vitest・component-harness screenshot・typecheck・lint・design-token gate は完了。staging data-backed verification は user-gated pending。 |
| status | semantic / focus / mobile CSS / component-harness visual は pass。staging data-backed visual は pending_runtime。 |

> 主ソースを focused vitest（semantic 証跡）に置き、screenshot を補助証跡とする方針は、chip ラベル解決・focus 遷移・sort 非 chip 化という本タスクの中核挙動が DOM assertion で決定論的に固定できるため。視覚レイアウト（mobile 縦積み・focus リング位置）のみ screenshot を一次証跡とする。

## 1. focused vitest 結果テーブル

| TC-ID | 期待 | 結果 | 証跡パス |
| --- | --- | --- | --- |
| TC-LABEL-01 | tag chip が `topTags` の表示名（`#${label}`）で描画される（AC-1） | pass | `SelectedFiltersBar.client.spec.tsx` |
| TC-LABEL-02 | `topTags` 未登録 code は `#${code}` に fallback し throw しない（AC-2） | pass | `SelectedFiltersBar.client.spec.tsx` |
| TC-LABEL-03 | removeLabel が `${resolveTag(tag)} タグ絞り込みを解除` になる（aria） | pass | `SelectedFiltersBar.client.spec.tsx` |
| TC-FOCUS-01 | chip 個別削除後、focus が次の chip へ遷移する（AC-3） | pass | `SelectedFiltersBar.client.spec.tsx` |
| TC-FOCUS-02 | 末尾 chip 削除時は前の chip へ focus が遷移する（AC-3） | pass | `SelectedFiltersBar.client.spec.tsx` |
| TC-FOCUS-03 | 最後の chip 削除で `onEmpty()` が呼ばれ検索入力へ focus が戻る（AC-3） | pass | `MemberFilters.client.spec.tsx` |
| TC-SORT-01 | `sort` 変更は chip を生成しない（AC-5 回帰） | pass | `SelectedFiltersBar.client.spec.tsx` |
| TC-DERIVE-01 | `MemberFilters` が `topTags` から `tagLabels` を導出し `SelectedFiltersBar` に渡す | pass | `MemberFilters.client.spec.tsx` |

## 2. mobile / 視覚確認テーブル（テンプレ）

| TC-ID | 期待 | 結果 | 証跡パス |
| --- | --- | --- | --- |
| TC-MOBILE-01 | 幅 `<=640px` で chip / クリアが縦積み（`flex-direction: column`）になる（AC-4） | pass_component_harness | `outputs/phase-11/screenshots/selected-filters-bar-mobile-stacked.png` |
| TC-VISUAL-01 | desktop で tag chip が表示名で描画される | pass_component_harness | `outputs/phase-11/screenshots/selected-filters-bar-desktop-labels.png` |
| TC-VISUAL-02 | chip 削除後 focus リングが次 chip / 検索入力へ移る | pass_component_harness | `outputs/phase-11/screenshots/selected-filters-bar-focus-after-remove.png` |

## 3. canonical screenshot 名と保存先

保存先: `outputs/phase-11/screenshots/`

- `selected-filters-bar-desktop-labels.png`
- `selected-filters-bar-mobile-stacked.png`
- `selected-filters-bar-focus-after-remove.png`

> 上記 3 枚は local component harness で取得済み。staging または auth 設定済み local runtime で data-backed verification を行う場合は、同じ canonical 名を再取得して差し替える。
