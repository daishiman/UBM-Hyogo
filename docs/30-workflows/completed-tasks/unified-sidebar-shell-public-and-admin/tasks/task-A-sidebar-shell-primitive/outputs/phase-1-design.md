---
Phase: 1 (outputs)
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../../outputs/phase-1-design.md
---

# Phase 1 — Design overview (task A scope)

## スコープ宣言

本サブworkflow は SidebarShell **primitive のみ**を扱う。以下は **対象外**:

| 範囲 | 担当 |
|------|------|
| UserMenu Server Component | Task B |
| Mobile Drawer | Task E |
| (public) / (member) / (admin) layout 統合 | Task C / Task D |
| 旧 `AdminSidebar` 削除 | Task D |
| Playwright `sidebar-shell-smoke` / `sidebar-shell-visual` baseline | Task F |

## design overview

| 観点 | 内容 |
|------|------|
| 目的 | 3 層共通の collapsible Sidebar core |
| 入力 | role / user / navGroups / activePath / mobileTriggerSlot |
| 出力 | aside + nav + children layout |
| 永続化 | localStorage `ubm:shell:collapsed` |
| token | tokens.css に shell 5 件追加 |

詳細は親 `outputs/phase-1-design.md` 参照。
