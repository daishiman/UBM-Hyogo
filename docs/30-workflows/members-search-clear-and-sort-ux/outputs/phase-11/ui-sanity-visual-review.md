# Phase 11 UI サニティ・ビジュアルレビュー（撮影観点）

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| mode | VISUAL |
| workflow_state | implemented_local_runtime_pending |
| capture status | captured_local_filter_ui |

## 撮影観点

### 観点 1: 検索クリア（×）が 1 つだけ

- 検索ボックスに文字を入力した状態で、表示されるクリア（×）が **1 つだけ** であること。
- ネイティブ× (`::-webkit-search-cancel-button`) が `globals.css` の `.ui-search__input::-webkit-search-cancel-button` / `.ui-search__input::-webkit-search-decoration` の `appearance:none; display:none;` で抑止され、独自×（IME 安全・`aria-label="クリア"`）のみが残ること。
- 撮影: `members-search-single-clear.png`

### 観点 2: ソート 4 種

- 並べ替えドロップダウンを展開し、`新しい順 / 古い順 / 名前順 / 名前の逆順` の **4 選択肢** が表示されること。
- デフォルト選択は `新しい順`（recent）であること。
- 撮影: `members-sort-four-options.png`

### 観点 3: 接頭辞除去

- ソートラベルから「並び替え: 」接頭辞が **除去** されていること（FormField 見出しが既に「並び替え」のため重複を解消）。
- 各 option ラベルが `新しい順` / `古い順` / `名前順` / `名前の逆順` の簡潔表記であること。

## 撮影状態

本ウェーブで実装と自動検証に加え、Chromium screenshot 2 枚を `outputs/phase-11/screenshots/` に保存した。local web-only 起動では API 一覧部が環境由来の取得エラー表示になるため、staging/API 接続の実機確認は user-gated として残す。
