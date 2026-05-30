---
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
status: implementation_completed
task_type: implementation
visual_category: VISUAL
implementation_mode: new
workflow_state: implementation_completed
parent: docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/
作成日: 2026-05-28
---

# task-A SidebarShell primitive 単体サブworkflow

## 目的

3 層（公開 / 会員 / 管理）で再利用される collapsible Sidebar の **core primitive** を新設する。
本サブworkflow は親 `unified-sidebar-shell-public-and-admin` の **task A 単体** を Phase 1-13 化したもの。
mobile drawer（Task E）と UserMenu（Task B）の hosting point だけ用意し、中身は他タスクで埋める。

## 親 workflow 参照

- 親 root: `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/`
- task A 実装仕様の正本: `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-A-sidebar-shell-primitive.md`
- 親 Phase 12 strict 7: `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/outputs/phase-12/`

## スコープ

| 含む | 含まない |
|------|----------|
| `apps/web/src/components/shell/` 配下 実装 11 + spec 3 の 14 新規 + tokens.css 5 トークン編集 | UserMenu（Task B） / Mobile drawer（Task E） / Layout 統合（Task C/D） / 旧 `AdminSidebar` 削除（Task D） |
| `shell-config.ts` / `useSidebarState.ts` / `SidebarShell(.server).tsx` 等の primitive | Playwright `sidebar-shell-smoke` / `sidebar-shell-visual` の baseline 確定（親 wave で実施） |

## 正本順位

1. 親 task-A 実装仕様（`tasks/task-A-sidebar-shell-primitive.md`）
2. 親 `phase-2-design.md` / `phase-4-test-plan.md`
3. `docs/00-getting-started-manual/claude-design-prototype/` の primitives + tokens

## Phase 12 strict 7 リスト（本サブworkflow）

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 不変条件

1. **既存 API 不変**: shell primitive は API call を行わない。`session` は親 layout / server wrapper 経由で受け取る
2. **D1 直接アクセス禁止**: `apps/web` 側 client / hook から D1 binding 触らない
3. **OKLch トークン正本化**: 追加 5 トークンは `apps/web/src/styles/tokens.css` のみ。HEX 直書き禁止
4. **CONST_007 単一サイクル**: task A 単体で 1 サイクル完結。task B-F へのスピルオーバ 0 件
