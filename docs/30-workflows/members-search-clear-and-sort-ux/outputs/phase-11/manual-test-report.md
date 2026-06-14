# Phase 11 手動テストレポート（VISUAL 3 層評価）

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| mode | VISUAL |
| workflow_state | implemented_local_runtime_pending |
| capture status | captured_local_filter_ui |

## Semantic 層

| 観点 | 期待 | 検証手段 |
|------|------|---------|
| クリア×ボタン | `aria-label="クリア"` を持つ独自×が値ありで 1 つだけ存在。値空で非表示 | Search.spec.tsx |
| ソート option | select の option が 4 個（recent/oldest/name/name_desc）。各 value が API enum と文字列一致 | MemberFilters.client.spec.tsx |
| sort 3 層 enum | apps/web SORT_VALUES / apps/api SortZ / packages/shared appliedQuery.sort が 4 値で一致 | viewmodel.spec.ts / search-query-parser.spec.ts |

## Visual 層（screenshot captured_local_filter_ui）

| name | 観点 |
|------|------|
| `members-search-single-clear.png` | 検索ボックスに文字入力した状態で×が 1 つだけ（ネイティブ× が CSS 抑止されている） |
| `members-sort-four-options.png` | ソートドロップダウン展開で「新しい順 / 古い順 / 名前順 / 名前の逆順」の 4 選択肢が「並び替え: 」接頭辞なしで表示 |

撮影は Chromium で本ウェーブ内に実施し、PNG を `outputs/phase-11/screenshots/` に保存した。local web-only 起動では API 一覧部が環境由来の取得エラー表示になるため、staging/API 接続の実機確認は user-gated として残す。

## AI UX 層

| 観点 | 合格基準 |
|------|---------|
| ラベルの直感性 | 「新しい順 / 古い順 / 名前順 / 名前の逆順」が非エンジニアに直感的 |
| 操作の迷いのなさ | クリア×が 1 つで、どれを押せば消えるか迷わない |
| 五十音順の誤約束回避 | 「名前順」が方式中立で、五十音順を約束していない（fullName 文字コード順） |

## 総括

3 層の評価観点が確定済み。Semantic 層は自動テスト 7 ファイルで確証する。Visual 層は screenshot 2 枚を保存済み。AI UX 層はフィルタ UI について目視確認済み、staging 実機の一覧データ表示は user-gated。
