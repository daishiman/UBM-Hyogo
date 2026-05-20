# System Spec Update Summary

## Step 1-A: Current Canonical Sync

`parallel-02-prototype-css-rules-port` の CSS 契約を実コード `apps/web/src/styles/globals.css` と同期した。暫定的な `ui-prototype-design-system-foundation selector hooks` ブロックを廃止し、G3-1 / G3-2 / G3-3 の marker block を正本化した。

## Step 1-B: Index / Artifact Sync

- sub-workflow Phase 12 strict 7 files: added under `parallel-02-prototype-css-rules-port/outputs/phase-12/`
- root `artifacts.json` / `outputs/artifacts.json`: implementation hook stateへ同期
- aiworkflow-requirements quick-reference / resource-map / task-workflow-active / artifact inventory: state boundaryを同期

## Step 1-C: Stale Contract Withdrawal

`/(public)/members` という route-group 表記を runtime URL として扱う記述を撤回し、`/members` / `/members/[id]` に統一した。

## Step 2: Domain Sync

新規 API endpoint / D1 schema / Google Form 仕様の変更はない。UI CSS selector 契約のみを更新した。
