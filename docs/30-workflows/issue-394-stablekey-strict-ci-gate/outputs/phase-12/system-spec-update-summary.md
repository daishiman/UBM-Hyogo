# System Spec Update Summary

## Step 1-A: タスク記録

本 workflow は `issue-394-stablekey-strict-ci-gate` として作成済み。現行事実は `blocked_by_legacy_cleanup`:

- strict command: `pnpm lint:stablekey:strict`
- result: exit 1 / 148 violations
- decision: `.github/workflows/ci.yml` strict blocking step は未追加

## Step 1-B: 実装状況

03a 正本は `enforced_dry_run / warning mode` を維持する。strict 0 violations と CI gate 追加が揃うまで `fully enforced` へ昇格しない。今回の same-wave sync は「古い `unassigned-task/` path を completed-tasks path に補正する」ことに限定する。

## Step 1-C: 関連タスク

`docs/30-workflows/completed-tasks/task-03a-stablekey-literal-legacy-cleanup-001.md` が blocking prerequisite。aiworkflow-requirements 側の古い `unassigned-task/` 参照は completed-tasks 配下へ補正した。

## Step 2: システム仕様更新

新規 API / 型 / secret は追加しないため N/A。ただし CI gate 状態と stableKey lint workflow inventory の path drift は same-wave で補正する。
