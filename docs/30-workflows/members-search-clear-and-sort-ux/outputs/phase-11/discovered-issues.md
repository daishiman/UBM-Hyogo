# Phase 11 発見事項（discovered-issues）

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| mode | VISUAL |
| workflow_state | implemented_local_runtime_pending |

## 発見事項

Chromium screenshot と DOM option 検証では、AC に影響する発見事項は **0 件** である。staging 実機操作は user-gated のため未実施。

local web-only 起動では API 一覧部が環境由来の取得エラー表示になるが、検索クリア（AC-1/AC-2）とソート option（AC-3）のフィルタ UI は検証済み。staging/API 接続での一覧データ表示は後続の user-gated 実機確認で判定する。

本ウェーブで実機検証（Chromium 実描画・staging）を実施した際に新規発見があれば、本ファイルに追記し AC 影響有無で blocker / MINOR を分類する。

| 分類 | 件数 |
|------|------|
| blocker（AC FAIL） | 0 |
| MINOR（AC 非影響） | 0 |

## 既知の境界（参考・OOS）

以下は本タスクのスコープ外であり discovered-issue ではない。Phase 12 `unassigned-task-detection.md` で管理する。

- OOS-1: ふりがな設問追加による真の五十音順ソート（current 未タスク・Issue 起票候補）。
- OOS-2: 他画面（admin 一覧等）の検索×重複検証（baseline・検証範囲外）。
- OOS-3: ソートのアクセシビリティ強化（ライブリージョン読み上げ）（baseline）。
