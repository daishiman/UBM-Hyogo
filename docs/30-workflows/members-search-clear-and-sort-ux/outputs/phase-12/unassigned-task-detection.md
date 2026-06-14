# 未タスク検出（unassigned-task-detection）

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| workflow_state | implemented_local_runtime_pending |

## current（本タスクで検出・formalize する未タスク）

| ID | タイトル | 理由 | status |
|----|---------|------|--------|
| OOS-1 | ふりがな（よみがな）設問追加による真の五十音順ソート | 現状 `name` / `name_desc` は `fullName` の Unicode 文字コード順であり、真の五十音順ではない。実現には Google Form schema へよみがな設問を追加し、全会員データの backfill が必要。これは外部 schema 依存であり今回サイクル外（CONST_007 正当分離） | unassigned_pending_issue |

current は **1 件**（OOS-1）。ユーザーが「未タスク（Issue）として記録」と明示確定済みのため、0 件ではなく current 1 件として formalize する。Issue 起票は user 明示承認後の後続ウェーブで行う。

### OOS-1 の Issue 起票候補メタ

| 項目 | 値 |
|------|-----|
| 想定 title | 会員ソートを真の五十音順にする（よみがな設問追加 + backfill） |
| 想定 type | enhancement / followup |
| 想定 scale | large（Form schema 変更 + 全会員 backfill） |
| area | web / api / form |
| 依存 | Google Form schema 変更・全会員 backfill |

## baseline（既知の境界・本タスクでは起票しない）

| ID | タイトル | 区分 | 扱い |
|----|---------|------|------|
| OOS-2 | 他画面（admin 一覧等）の検索×重複の検証 | baseline | 本タスクの共通 `Search` プリミティブ修正は全 search input に波及するが、検証範囲は公開 `/members` に限定。admin 画面の実検証は別タスク |
| OOS-3 | ソートのアクセシビリティ強化（ライブリージョン読み上げ等） | baseline | sort 変更時の支援技術アナウンスは別タスク |

baseline は既存の境界であり、本タスクで新規 Issue を起票しない。

## 関連タスク差分確認（重複起票チェック）

| 確認対象 | 結果 |
|---------|------|
| 既存 open Issue に「五十音順 / よみがな / ふりがな / sort gojuon」重複 | 後続ウェーブで `gh issue list` により最終確認する。本ウェーブでは重複候補を検出していない |
| 既存 workflow に同種の sort 拡張タスク | issue-222（public-search プリミティブ共有化）は query 正規化が対象で sort enum 五十音順は対象外。重複なし |
| OOS-2 / OOS-3 の既存 Issue | 重複候補なし。baseline のため起票しない |

## サマリ

- current: 1 件（OOS-1・unassigned_pending_issue）
- baseline: 2 件（OOS-2 / OOS-3）
- 重複起票: なし
