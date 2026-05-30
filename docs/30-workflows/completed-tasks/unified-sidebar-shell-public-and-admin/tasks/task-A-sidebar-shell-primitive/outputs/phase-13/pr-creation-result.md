---
Phase: 13
status: pending_user_approval
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../../../outputs/phase-13/pr-creation-result.md
---

# Phase 13 — PR creation result (task A)

## 状態

`pending_user_approval`。Gate-C 待ち。

## 想定 PR

| 項目 | 値 |
|------|----|
| タイトル | `feat(shell): SidebarShell primitive (task A of unified-sidebar-shell-public-and-admin)` |
| base | `dev` |
| 含めるファイル | `apps/web/src/components/shell/**` + `apps/web/src/styles/tokens.css` + 本サブworkflow 配下 |
| 事前 verify | `mise exec -- pnpm typecheck && pnpm lint && bash scripts/verify-pr-ready.sh` |

## user-gated boundary

commit / push / `gh pr create` はユーザー明示承認後のみ。本サブworkflow からは PR を起票しない。親 workflow の wave で実 PR を統括する場合は base/branch 設計を親側で決定する。
