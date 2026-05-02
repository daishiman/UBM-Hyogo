# UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001

## Canonical Status

| 項目 | 値 |
| --- | --- |
| workflow_state | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #328 |
| 親タスク | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` |
| 実装 follow-up | `docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-impl-001.md` |

この workflow は production Worker route inventory script の設計 close-out であり、script 実装・production API 実測・deploy・route 変更は行わない。成果は後続実装タスクへ渡す出力契約、read-only allowlist、NON_VISUAL evidence 設計、Phase 12 strict 7 files で閉じる。

## Phase Index

| Phase | ファイル | 状態 | 要点 |
| --- | --- | --- | --- |
| 1 | `phase-01.md` | spec_created | 要件定義 / AC-1〜AC-5 |
| 2 | `phase-02.md` | spec_created | API allowlist / `InventoryReport` SSOT |
| 3 | `phase-03.md` | spec_created | テスト計画 / NO-GO |
| 4 | `phase-04.md` | spec_created | test plan 仕様化 |
| 5 | `phase-05.md` | spec_created | implementation template / handoff |
| 6 | `phase-06.md` | spec_created | review checklist / abnormal cases |
| 7 | `phase-07.md` | spec_created | API mock integration strategy |
| 8 | `phase-08.md` | spec_created | NON_VISUAL smoke plan |
| 9 | `phase-09.md` | spec_created | staging / QA plan |
| 10 | `phase-10.md` | spec_created | security review / Design GO |
| 11 | `phase-11.md` | spec_created | NON_VISUAL acceptance evidence design |
| 12 | `phase-12.md` | completed | documentation close-out / strict 7 files |
| 13 | `phase-13.md` | blocked | user approval / commit / PR gate |

## 依存関係

```text
UT-06-FU-A completed preflight runbook
  -> this docs-only route inventory script spec
  -> UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001
  -> production deploy approval preflight evidence
```

## 正本 Schema

`InventoryReport` / `RouteInventoryEntry` の正本は `phase-02.md` および `outputs/phase-02/api-allowlist.md`。後続 Phase の `workerName` / `routePattern` / `orphan` / `warnings` 表現は実装側の派生候補ではなく、Phase 2 schema に追従する。
