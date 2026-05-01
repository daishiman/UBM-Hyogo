# Unassigned Task Detection

## 判定

実 evidence 取得前のため、現時点の未タスクは条件付き 1 件。

| 条件 | 起票候補 | 発火条件 |
| --- | --- | --- |
| staging deploy 未完了 | task-ut-06b-profile-visual-evidence-staging-followup-001 | Phase 11 で M-14〜M-16 が取得不能 |

全 evidence 10 ファイルと Phase 11 補助 metadata 4 ファイルが取得済みなら「該当なし」として閉じる。

## materialization rule

Phase 11 close-out 時点で local M-08〜M-10 は captured だが staging M-14〜M-16 が 09a gate 未達で取得不能なら、次の file を作成して active backlog に登録する:

`docs/30-workflows/unassigned-task/task-ut-06b-profile-visual-evidence-staging-followup-001.md`

> 命名規則: pitfalls UBM-006（legacy completed-tasks 命名 `UT-XXX-...md` との衝突回避）に準拠し、`task-<workflow-slug>-<topic>-<3桁連番>.md` 形式を採用する。

この workflow が `spec_created` / `not executed` の間は、まだ未タスクファイルを作成しない。理由は、local evidence すら未実行で partial 状態が確定していないため。
