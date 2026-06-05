# unassigned-task-detection

> 0 件でも出力必須。current（本 workflow で新たに検出した残課題）と baseline（既存の既知残課題）を分離する。

## current（本 workflow で検出した未タスク候補）

| ID | 内容 | 分類 | 起票判断 |
| --- | --- | --- | --- |
| U-1 | apps/web の admin tag master 専用 CRUD UI ページが未整備で、code 編集の UI 導線が無い。本タスクは API surface のみ提供する | MINOR / UI 統合 | formalized: `docs/30-workflows/unassigned-task/task-issue-1069-followup-001-admin-tag-code-edit-ui.md` |

### 関連タスク差分確認（[FB-CANCEL-004-2]）

- `task-issue-1035-followup-001-admin-tag-inline-create-ui`（member drawer の inline-create UI）と U-1 は近いが、U-1 は「tag master の code を編集する管理ページ導線」で関心が異なる。統合先候補として followup-001 を記録し、重複起票は実装 close-out 時に再判定する。
- fade / aria-live 等の他タスクとは無関係。

## baseline（既存の既知残課題・本タスク非対象）

| ID | 内容 |
| --- | --- |
| B-1 | tag 物理削除 / reactivate（`task-issue-1035-followup-003`、unassigned） |
| B-2 | admin tag inline-create UI（`task-issue-1035-followup-001`、unassigned） |

## コードコメント / skip 走査

- TODO/FIXME/HACK/XXX・`describe.skip` の新規導入なし。
- 既存 contract test の `code:"ignored"` は rename 実装後に副作用を持つため、label/category 更新テストから除去済み。

## 判定

- current 起票必須: **1 件 formalized**（U-1）。
- baseline は既存タスクで管理済み。
</content>
