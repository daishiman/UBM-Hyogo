---
task_id: unified-sidebar-shell-task-b-user-menu-and-role-handling
parent_workflow: unified-sidebar-shell-public-and-admin
status: implementation_verified
task_type: implementation
visual_category: VISUAL
workflow_state: implementation_verified
created_at: 2026-05-28
canonical_workflow: docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/
---

# unified-sidebar-shell-task-b-user-menu-and-role-handling

[実装区分: 実装仕様書（親 Task B） / Phase 1-13 + apps/web 実装検証済み]

## 目的

親 workflow `unified-sidebar-shell-public-and-admin` の Task B として、サイドバー左下の user menu を
`viewer` / `member` / `admin` の 3 ロールに対応させる。menu action の決定は
`buildUserMenuActions(role)` に集約し、render 層は `<details>/<summary>` と既存 `SignOutButton`
の再利用に閉じる。

## 境界

| 項目 | 方針 |
| --- | --- |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| workflow_state | `implementation_verified`（focused Vitest / grep gate / local visual evidence present） |
| 親 workflow | `docs/30-workflows/unified-sidebar-shell-public-and-admin/` |
| strict 7 | 親 workflow root の `outputs/phase-12/` に集約。本 sub-workflow には `outputs/phase-12/phase12-task-spec-compliance-check.md` のみ配置 |

## action contract

| role | actions |
| --- | --- |
| `viewer` | `login` |
| `member` | `profile` -> `edit-request` -> `signout` |
| `admin` | `profile` -> `edit-request` -> `admin-dashboard` -> `signout` |

## 依存関係

| Dependency | Boundary |
| --- | --- |
| Task A | `ShellRole` 型と `SidebarShellServer` の props 供給元。Task A 未配置時のみ local union を一時利用 |
| Task C/D | 本 task の `SidebarUserMenu` 完了後に public/member/admin layout へ統合 |
| Task F | user menu open/closed screenshot と smoke を親 visual gate として取得 |

## 正本順位

1. `index.md`
2. `artifacts.json` / `outputs/artifacts.json`
3. `phase-1-requirements.md` -> `phase-13-pr.md`
4. `outputs/phase-12/phase12-task-spec-compliance-check.md`
5. 親 source task `docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-B-user-menu-and-role-handling.md`

## Phase 12 sub-workflow rule

task-specification-creator の parent/sub strict 7 aggregation rule により、本 sub-workflow には
`phase-12-documentation.md` を置かない。概念説明、system sync、changelog、skill feedback は親 root の
strict 7 に集約し、本 sub-workflow は `outputs/phase-12/phase12-task-spec-compliance-check.md` だけを持つ。

## 完了境界

本 workflow は `implementation_verified / implementation / VISUAL` として、apps/web 実装、focused Vitest、
grep gate、local Chromium screenshot を完了済み evidence として扱う。staging visual、commit、push、PR は
user gate に残す。
