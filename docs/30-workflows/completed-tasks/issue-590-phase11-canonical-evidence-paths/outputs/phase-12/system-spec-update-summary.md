# System Spec Update Summary

## Updated

- task-specification-creator に Phase 11 canonical evidence path schema / validator / tests を追加。
- task-specification-creator 配下に skill-local `package.json` (`type: module`) を追加し、ESM validator 実行時の Node warning を解消。
- task-specification-creator skill-local `package.json` を追加し、ESM validator 実行ログの Node module-type warning を排除。
- root `package.json` に `validate:phase11-paths` を追加。
- 親 Issue #549 に `outputs/phase-11/canonical-paths.json` を追加し、`phase-11.md` と `outputs/phase-11/main.md` から参照できるようにする。
- aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / changelog に Issue #590 を登録する。

## Not Updated

- runtime observation の実測値は本タスク範囲外。親 #549 の post-merge 7 day observation gate で取得する。
