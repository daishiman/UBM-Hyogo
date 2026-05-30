---
実装区分: 実装仕様書
状態: spec_created
Phase: 12
作成日: 2026-05-28
task_id: unified-sidebar-shell-public-and-admin
---

# System Spec Update Summary

## Step 1-A: 変更概要

`unified-sidebar-shell-public-and-admin` を `spec_created / implementation / VISUAL` parent workflow として追加した。公開、会員、管理の shell 統合を実装仕様化し、Task B user menu は apps/web 実装・focused Vitest・grep gate・local visual evidence まで完了した。残り A/E/C/D/F は Gate-B の execution wave に残す。

## Step 1-B: 正本同期先

| Target | Status |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | synced |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | synced |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | synced |
| `.claude/skills/aiworkflow-requirements/references/workflow-unified-sidebar-shell-public-and-admin-artifact-inventory.md` | added |
| `.claude/skills/aiworkflow-requirements/changelog/20260528-unified-sidebar-shell-public-and-admin.md` | added |

Task B sub-workflow `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/` is registered as a child of this workflow. Its root/output `artifacts.json`, Phase 11 evidence, and `outputs/phase-12/phase12-task-spec-compliance-check.md` are discoverable from the same aiworkflow ledgers; strict 7 remains parent-owned.

## Step 1-C: 実コード正本との整合

現行 `AdminSidebar.tsx` の実装に合わせて Admin group は 9 item とした。`index.md` の 8/11 混在表記は 9/13 へ補正済み。

## Step 2: skill file update

task-specification-creator と aiworkflow-requirements の既存ルールで吸収できるため、skill file 本体の変更は不要。今回の知見は artifact inventory と changelog に記録した。Sub-workflow 側の独自 `phase-12-documentation.md` は作らず、`phase-12-compliance-check.md` のみを許可する既存 parent/sub strict 7 aggregation rule に従う。
