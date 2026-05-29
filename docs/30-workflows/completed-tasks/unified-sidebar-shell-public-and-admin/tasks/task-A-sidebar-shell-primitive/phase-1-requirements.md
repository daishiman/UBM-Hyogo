---
Phase: 1
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../phase-1-requirements.md
正本: ../task-A-sidebar-shell-primitive.md
---

# Phase 1 — 要件定義 (task A)

## 背景

公開 / 会員 / 管理 3 層で個別に sidebar を持っている現状を SidebarShell primitive に統合する親 workflow の第一歩。task A は **primitive core のみ** を担う。

## Acceptance Criteria

| ID | 内容 |
|----|------|
| AC-A1 | `SidebarShell` Client primitive が `role` / `user` / `navGroups` / `activePath` / `mobileTriggerSlot` / `children` を受け取って描画する |
| AC-A2 | `shell-config.ts` の `buildNavForRole(role, ctx?)` が純関数として viewer=public のみ / member=public+members / admin=3 グループ全部を返す（`schemaDiffCount` で admin の `schema` item に badge 付与） |
| AC-A3 | `useSidebarState()` が `expanded` / `collapsed` を localStorage `ubm:shell:collapsed` で永続化し SSR で throw しない |
| AC-A4 | collapsed 時 nav label が `sr-only`、展開時 `aria-label="サイドバー"` / `aria-current="page"` / `aria-expanded` が付与される |
| AC-A5 | `mobileTriggerSlot` prop を素通しで受け入れ、Task E が後で挿入できる hosting point になっている |
| AC-A6 | 本タスクでは旧 `AdminSidebar` を**削除しない**（Task D で削除） |

## 参照資料

- 親 task-A 仕様: `../task-A-sidebar-shell-primitive.md`
- 親 Phase 1: `../../phase-1-requirements.md`
- design tokens: `docs/00-getting-started-manual/specs/design-tokens.md`
