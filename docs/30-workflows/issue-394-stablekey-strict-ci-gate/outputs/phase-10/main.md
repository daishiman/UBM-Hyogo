# Phase 10: リリース準備 — outputs/main

## 判定

`PASS_WITH_BLOCKER`。本サイクルでは ci.yml を変更しないため strict gate のリリース行為は実施しない。documentation 更新のみ提供。

## merge 順序（cleanup 完了後）

1. legacy stableKey literal cleanup PR（別タスク）
2. 本タスクの ci.yml step 追加 PR（同 PR で 03a 親 implementation-guide / index の AC-7 を `fully enforced` に同期）
3. aiworkflow-requirements 反映（必要なら同 PR 内、または fast-follow）

## rollback 戦略

- ci.yml step 単体 revert（required context 名は変更されないため branch protection 操作は不要）
- 03a 親 doc は別コミットで差し戻す

## 本サイクル成果

- 本タスクの ci.yml は未変更。
- aiworkflow-requirements の `quick-reference.md` / `resource-map.md` / `workflow-03a-stablekey-literal-lint-enforcement-artifact-inventory.md` を更新済（git status diff 参照）。
- 03a `outputs/phase-12/unassigned-task-detection.md` を更新済。

## 完了条件チェック

- [x] AC と矛盾なし。
- [x] cleanup 完了後の release 順序を確定。
