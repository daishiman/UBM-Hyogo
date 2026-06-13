# Phase 11: 手動テスト（VISUAL 3 層評価）

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| Phase | 11 / 13 |
| visualEvidence | VISUAL |
| workflow_state | implemented_local_runtime_pending |
| 前提 | Phase 10 最終レビュー PASS（AC-1..AC-10 全件 PASS 判定） |
| capture status | captured_local_filter_ui（staging は user-gated） |

## 目的

公開 `/members` の検索クリア（×）重複解消と並べ替え 4 選択肢拡張を、VISUAL 3 層評価（Semantic / Visual / AI UX）で検証する。実装と自動テストに加え、local Chromium filter UI screenshot は本ウェーブで完了し、staging 検証のみ user-gated として `phase11-capture-metadata.json` の `status: "captured_local_filter_ui"` に分離する。

## 実行タスク

### T11-1 VISUAL 3 層評価観点の確定

| 層 | 評価対象 | 合格判定 |
|----|---------|---------|
| Semantic | 検索 input の `aria-label="クリア"` を持つ独自×ボタンが値ありで 1 つだけ存在する。ソート select の option が 4 個（recent/oldest/name/name_desc）で各 value が API enum と文字列一致する | DOM/ARIA 構造アサーション（Search.spec.tsx / MemberFilters.client.spec.tsx） |
| Visual | 検索ボックスに文字入力した状態で表示される×が 1 つだけ（ネイティブ× が CSS 抑止）。ソート 4 選択肢が「並び替え: 」接頭辞なしで存在 | Chromium 実描画 screenshot 2 枚 + DOM option 検証 |
| AI UX | 「新しい順 / 古い順 / 名前順 / 名前の逆順」のラベルが非エンジニアに直感的。クリア×が 1 つで操作迷いがない。「名前順」が方式中立で五十音順を誤約束しない | スクリーンショットの目視レビュー（user-gated） |

### T11-2 撮影証跡計画

| name | 撮影状態 | 検証 AC |
|------|---------|--------|
| `members-search-single-clear.png` | 検索 input に値を入力した状態。クリア（×）が 1 つだけ表示 | AC-1 / AC-2 |
| `members-sort-four-options.png` | 並べ替えドロップダウン展開。`新しい順 / 古い順 / 名前順 / 名前の逆順` の 4 選択肢が接頭辞なしで表示 | AC-3 |

撮影は Chromium（1280x900 viewport）で実施し、撮影ファイルは `outputs/phase-11/screenshots/` に配置済み。local web-only 起動では API 一覧部が環境由来の取得エラー表示になるため、staging/API 接続の実機確認は user-gated とする。

### T11-3 自動テストによる先行確証

VISUAL 撮影前に以下 7 テスト（Phase 4-7）が GREEN であることを証跡主ソースとする。

| ID | テスト | 確証 AC |
|----|-------|--------|
| T1 | Search.spec.tsx | AC-1 / AC-2 |
| T2 | members-search.spec.ts | AC-6 / AC-7 |
| T3 | MemberFilters.client.spec.tsx | AC-3 |
| T4 | search-query-parser.spec.ts | AC-6 |
| T5 | list-public-members.spec.ts | AC-4 / AC-5 / AC-6 |
| T6 | viewmodel.spec.ts（既存） | AC-8 |
| T7 | publicMembers.repository.spec.ts（既存 D1） | AC-4 / AC-5 |

### T11-4 discovered-issues の扱い

本ウェーブではChromium実機撮影を行わないため discovered-issues は 0 件とする。user-gated の実機検証で新規発見があれば `outputs/phase-11/discovered-issues.md` に追記し、AC 影響有無で blocker / MINOR を分類する。

## 参照資料

- [index.md](index.md)（AC-1..AC-10 / ソート値マッピング / OOS-1）
- [phase-10-final-review.md](phase-10-final-review.md)（AC 全件判定 PASS）
- [outputs/phase-11/screenshot-plan.json](outputs/phase-11/screenshot-plan.json)（撮影計画）
- [outputs/phase-11/phase11-capture-metadata.json](outputs/phase-11/phase11-capture-metadata.json)（capture status）
- `apps/web/src/components/ui/Search.tsx`（独自×ボタン）
- `apps/web/src/components/public/MemberFilters.client.tsx`（ソート option 4 種）

## 成果物

- `outputs/phase-11/manual-test-result.md`（証跡サマリ）
- `outputs/phase-11/manual-test-report.md`（3 層評価レポート）
- `outputs/phase-11/discovered-issues.md`（AC 影響 0 件・captured_local_filter_ui）
- `outputs/phase-11/ui-sanity-visual-review.md`（撮影観点レビュー計画）
- `outputs/phase-11/screenshot-plan.json`（mode=VISUAL・撮影 2 枚）
- `outputs/phase-11/phase11-capture-metadata.json`（status=captured_local_filter_ui）

## 統合テスト連携

VISUAL 3 層評価と自動テストを結合する。自動テスト T1〜T7 は本ウェーブでPASS。screenshot（×1 つ / ソート 4 種）は `captured_local_filter_ui`。CSS 実非表示（AC-1）は Chromium VISUAL で結合検証済み。

## 完了条件

- [ ] VISUAL 3 層評価観点（Semantic / Visual / AI UX）が T11-1 で確定している
- [ ] 撮影証跡 2 枚（single-clear / four-options）が screenshot-plan.json に列挙されている
- [ ] phase11-capture-metadata.json の status が captured_local_filter_ui である
- [ ] 自動テスト 7 件（T1-T7）が証跡主ソースとして明記されている
- [ ] discovered-issues が AC 影響 0 件と記録されている
