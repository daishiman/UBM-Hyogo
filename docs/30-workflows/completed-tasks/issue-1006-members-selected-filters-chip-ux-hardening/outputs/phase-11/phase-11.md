# Phase 11: 手動テスト

Task ID: TASK-MEMBERS-SELECTED-FILTERS-CHIP-UX-HARDENING-001

## 0. ワークフロー状態

本ワークフローは `workflow_state=implemented_local_runtime_pending` であり、本ファイルは **ローカル実装後の手動テスト計画と結果境界**を記述する。semantic/focus は focused vitest で確認済み、mobile 縦積み CSS / label / focus ring は component-harness screenshot で確認済み。staging data-backed screenshot は user-gated で取得する。

## 1. タスク種別の宣言

| 項目 | 値 |
| --- | --- |
| visualEvidence | **VISUAL** |
| 理由 | tag chip のラベル表示（code → 表示名）、chip 削除後の focus リング位置、mobile(<=640px) での chip 縦積みレイアウトが視覚的に変化するため |

### 視覚的に変わる点

1. **chip 表示名**: tag chip が `#${code}`（機械可読 code）から `#${label}`（`topTags` 由来の表示名）に変わる。未登録 code は `#${code}` に fallback。
2. **focus リング**: chip 個別削除後、focus が「次の chip → 前の chip → 0 件なら検索入力（onEmpty）」へ決定論的に遷移し、focus リングの位置が観測可能に変わる。
3. **mobile 縦積み**: 幅 `<=640px` で `[data-component="selected-filters-bar"]` が `flex-direction: column; align-items: stretch` となり、chip / クリアボタンが横並びから縦積みに変わる。

## 2. 3 層評価計画

| 層 | 評価観点 | 手段 |
| --- | --- | --- |
| Semantic（意味） | chip ラベルが人間可読の表示名になっているか / removeLabel（`${label} タグ絞り込みを解除`）が aria に反映されるか / sort が chip 化されないか | focused vitest（`SelectedFiltersBar.client.spec.tsx` の TC 群）＋ DOM assertion |
| Visual（視覚） | desktop でラベル chip が表示される / mobile で縦積みになる / 削除後 focus リングが次 chip に移る | Playwright screenshot 3 枚（後述 canonical 名） |
| AI UX（体験） | キーボードのみで chip を連続削除でき、最後の削除で検索入力に focus が戻る操作連続性 / mobile で操作密度が破綻しないこと | 実機手動操作手順（後述）＋ 目視確認 |

## 3. Screenshot 計画（canonical 名）

保存先: `outputs/phase-11/screenshots/`。命名は `<component>-<state>.png` 形式。

| canonical 名 | 状態 | 確認内容 |
| --- | --- | --- |
| `selected-filters-bar-desktop-labels.png` | desktop / `?tag=...&zone=...` 適用 | tag chip が表示名（`#${label}`）で描画されている |
| `selected-filters-bar-mobile-stacked.png` | mobile(<=640px) / 複数 chip 適用 | chip / クリアボタンが縦積み（`flex-direction: column`）になっている |
| `selected-filters-bar-focus-after-remove.png` | chip 個別削除直後 | focus リングが次の chip（または検索入力）へ移動している |

> 現ローカルでは component-harness で上記 3 枚を `outputs/phase-11/screenshots/` に保存済み。staging または auth 設定済みローカルで data-backed verification を行う場合は、同名で再取得する。

## 4. 実機操作手順（staging / auth 設定済みローカル用）

1. ローカルで `/members?tag=<code>&zone=<zone>` を開く（`topTags` に載る code を最低 1 つ、載らない code を 1 つ含める）。
2. tag chip が表示名で描画されることを確認（未登録 code は `#${code}` fallback で表示されること）→ `selected-filters-bar-desktop-labels.png` を取得。
3. キーボード（Tab）で chip に focus し、Enter / Space で個別削除。focus が次の chip → 前の chip の順で残る chip に移ること、最後の chip 削除で検索入力に focus が戻ること（onEmpty）を確認 → `selected-filters-bar-focus-after-remove.png` を取得。
4. devtools の responsive モードで幅を `640px` 以下に設定。chip / クリアボタンが縦積みになり、クリアが `align-self: flex-end` で右寄せされること、result count と重ならないことを確認 → `selected-filters-bar-mobile-stacked.png` を取得。
5. `sort` を変更しても chip が増えないこと（sort 非 chip 化維持）を確認。

## 5. 関連受入条件

AC-1（表示名 chip）/ AC-2（未登録 code fallback）/ AC-3（削除後 focus 遷移）/ AC-4（mobile 縦積み）/ AC-5（sort 非 chip 化維持）を本 Phase の手動 + focused vitest で確認する。AC-6（API/D1/Form 変更ゼロ）/ AC-7（HEX 直書きゼロ）は Phase 9 / `verify-design-tokens` で固定。
