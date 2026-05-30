---
spec_classification: implementation_spec
state: spec_created
phase: 13
phase_name: commit-pr-release
created_at: 2026-05-29
workflow: docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/
---

# Phase 13: PR

branch: `feat/task-spec-unified-sidebar-shell-task-e-mobile-drawer`

## 13.1 commit

```bash
git add \
  apps/web/src/lib/a11y/useFocusTrap.ts \
  apps/web/src/lib/a11y/__tests__/useFocusTrap.spec.tsx \
  apps/web/src/components/ui/Drawer.tsx \
  apps/web/src/components/shell/SidebarMobileTrigger.tsx \
  apps/web/src/components/shell/SidebarDrawer.tsx \
  apps/web/src/components/shell/SidebarShell.tsx \
  apps/web/src/components/shell/useSidebarState.ts \
  apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx \
  apps/web/src/styles/tokens.css \
  docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/

git commit
```

> scroll lock CSS が `tokens.css` ではなく shell 専用 stylesheet / component CSS に置かれる場合は、その実ファイルを `git add` 対象に差し替える。

commit message テンプレート:

```
feat(shell): mobile drawer + responsive sidebar behavior (Task E)

- extract useFocusTrap hook (lib/a11y) as the single source of dialog focus trap
- refactor ui/Drawer.tsx to use useFocusTrap (public API unchanged, consumers untouched)
- add SidebarMobileTrigger (hamburger, md:hidden) that calls setDrawerOpen(true)
- add SidebarDrawer (role=dialog aria-modal) delegating focus trap to useFocusTrap; own backdrop / scroll-lock / md:hidden chrome
- SidebarShell hides <aside> on mobile (hidden md:flex) and mounts mobileTriggerSlot
- useSidebarState adds route-change auto-close and viewport-based initial collapsed/expanded (localStorage 優先)
- scroll lock via body[data-shell-drawer-open] attribute + CSS
- adds 3 RTL spec (useFocusTrap / SidebarMobileTrigger / SidebarDrawer)

Refs: docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/
Parent: docs/30-workflows/unified-sidebar-shell-public-and-admin/
Sibling: Task A / B / C / D / F
```

## 13.2 PR

- base: `dev`
- title: `feat(shell): mobile drawer + responsive sidebar behavior (Task E)`
- body 必須項目:
  - **Summary**: スマホで sidebar を hamburger + drawer 化し、タブレット/PC では aside を表示する responsive 挙動を追加。state は `useSidebarState` 1 系のまま、drawer / trigger は読み取り専用。
  - **Scope (Task E core 6 + 共有 a11y 基盤 3)**:
    - 新規: `SidebarMobileTrigger.tsx` / `SidebarDrawer.tsx` / `__tests__/SidebarMobileTrigger.spec.tsx` / `__tests__/SidebarDrawer.spec.tsx`
    - 編集: `SidebarShell.tsx` / `useSidebarState.ts`
    - 共有 a11y: 新規 `lib/a11y/useFocusTrap.ts` + `__tests__/useFocusTrap.spec.tsx`、`components/ui/Drawer.tsx` 内部 refactor（focus trap を hook 委譲・公開 API 不変）
    - (+ scroll lock CSS)
  - **Out of scope**: Task A (SidebarShell primitive) / Task B (UserMenu) / Task C (public・member layout) / Task D (admin layout 移行) / Task F (visual baseline)
  - **AC checklist**: AC-E1..E11 全 check
  - **CI gate**: verify-design-tokens green / typecheck green / lint green / vitest green (`@ubm-hyogo/web`)
  - **Screenshots**: `outputs/phase-11/` 4 枚(375px / 768px / 1280px + drawer open)。visual baseline は Task F
  - **Refs**: 親 workflow `unified-sidebar-shell-public-and-admin` / sibling Task A,B,C,D,F

## 13.3 user-gated 操作

| 操作 | 実行可否 |
|------|---------|
| local commit | user 明示承認後 |
| push | user 明示承認後 |
| `gh pr create --base dev` | user 明示承認後 |
| staging deploy / visual baseline 取得 | Task F・親 workflow 側で実施(本タスク範囲外) |

## 13.4 DoD (Definition of Done)

親 task DoD:

- [ ] 新規 2 spec が green (親 DoD 1)
- [ ] 375px / 768px / 1280px で期待挙動を手動確認(Task F の playwright で自動化)(親 DoD 2)
- [ ] drawer open 時に背景 scroll が止まる(親 DoD 3)
- [ ] drawer 内リンク click → auto-close + 遷移(親 DoD 4)

AC:

- [ ] AC-E1 `<aside>` が `hidden md:flex` / hamburger が `md:hidden`
- [ ] AC-E2 hamburger click → `setDrawerOpen(true)`
- [ ] AC-E3 drawer が `role="dialog" aria-modal="true"`
- [ ] AC-E4 Esc・backdrop → `onClose`
- [ ] AC-E5 `body[data-shell-drawer-open="true"]` → scroll lock
- [ ] AC-E6 初期 focus + focus trap
- [ ] AC-E7 route 変化で auto-close
- [ ] AC-E8 link click → close + 遷移
- [ ] AC-E9 `<1024px` 初期 collapsed / `>=1024px` expanded(localStorage 優先)
- [ ] AC-E10 matchMedia 初期判定 1 回限り
- [ ] AC-E11 drawer / hamburger が `md:hidden`

ゲート / 委譲:

- [ ] verify-design-tokens / typecheck / lint green(HEX 直書き 0 件)
- [ ] Task A の `SidebarShell` / `useSidebarState` / `SidebarShellContext` 契約を破壊していない(I-E1)
- [ ] visual baseline は Task F に委譲(範囲外明示)
- [ ] PR が `dev` を base に作成済

## 13.5 evidence

- `outputs/phase-13/pr-creation-result.md` に以下を記録:
  - PR URL
  - base SHA(`dev` の取り込み先 commit)
  - CI gate 一覧と最終 status(verify-design-tokens / typecheck / lint / vitest)
  - 実施日時 / 実施者
