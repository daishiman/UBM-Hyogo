# unassigned-task-detection

> 0 件でも出力必須。current（本 workflow で新たに検出した残課題）と baseline（既存の既知残課題）を分離する。
> 本 workflow は `implemented_local_evidence_captured`（CLOSED Issue recovery）。新規 Issue 起票は **0 件**。

## current（本 workflow で検出した未タスク候補）

| ID | 内容 | 分類 | 起票判断 |
| --- | --- | --- | --- |
| C-1 | recovery 起点 unassigned-task（`task-issue-1069-followup-001-admin-tag-code-edit-ui.md`）を canonical workflow root へ consumed 化 | recovery housekeeping | **新規起票しない**。本 workflow（issue-1116）が当該 unassigned-task を canonical 化し、consumed pointer を追記したことを記録する（recovery §3/§5）。Issue #1116 は CLOSED 維持・新規 Issue 起票なし |

- 本タスクは CLOSED Issue #1116（= `task-issue-1069-followup-001`）の recovery 起点 unassigned-task を消費する側であり、
  新たな未タスク候補は検出していない。新規 Issue 起票は 0 件。

## baseline（既存の既知残課題・本タスク非対象 = 別スコープ）

| ID | 内容 | 別スコープ理由 / 新規起票しない理由 |
| --- | --- | --- |
| B-1 | tag 物理削除 / reactivate UI | API は issue-1070 で実装済み・UI は別スコープ。本タスクは list + code/label/category edit + conflict 表示に限定（Issue #1116 AC-1..AC-5）。重複起票しない |
| B-2 | tag create UI（member drawer inline-create） | `MemberTagInlineCreate` に既存（create 文脈）。tag master 管理ページの create は別タスク `task-issue-1035-followup-001`（completed-tasks 着地済み）が管理。重複起票しない |
| B-3 | member drawer inline-create UI 全般 | `task-issue-1035-followup-001`（completed-tasks 着地済み）で管理済み。本タスクは tag master code 編集導線のみ。重複起票しない |

## コードコメント / skip 走査

- 本 workflow は `implemented_local_evidence_captured`（apps/web 実コード変更あり）のため、新規 TODO/FIXME/HACK/XXX・`describe.skip` の導入はない。
- 本サイクルで code が着地したため、current 列は実装済み前提で再評価済み。

## 判定

- current 起票必須: **0 件**（C-1 は recovery housekeeping・新規 Issue 起票なし）。
- baseline は既存タスク（issue-1070 / followup-001）で管理済み・本タスク非対象。
- 新規 Issue 起票: **0 件**。Issue #1116 は CLOSED 維持（`Refs #1116` のみ）。
