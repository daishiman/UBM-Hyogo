---
Phase: 10
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../phase-10-final-review.md
正本: ../task-A-sidebar-shell-primitive.md (DoD 節)
---

# Phase 10 — 最終レビュー / DoD (task A)

## DoD チェックリスト

| # | 項目 | 状態 |
|---|------|------|
| 1 | 3 spec（shell-config / useSidebarState / SidebarShell）が GREEN | pass（2026-05-29: `mise exec -- pnpm --filter @ubm-hyogo/web test -- --run src/components/shell`、web suite 1291 pass / 2 skip） |
| 2 | `pnpm typecheck && pnpm lint` GREEN | pass（2026-05-29: `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` / `mise exec -- pnpm --filter @ubm-hyogo/web lint` / `pnpm verify:no-inline-style`） |
| 3 | `buildNavForRole` が 3 ロール × `schemaDiffCount` 0/正数で snapshot 安定 | pass（`shell-config.spec.ts`） |
| 4 | 旧 `AdminSidebar` は **未削除**（Task D で削除予定） | spec で保証 |
| 5 | `mobileTriggerSlot` prop を受け入れ、UserMenu は `SidebarShellServer` が role 判定後に注入する設計 | spec で保証 |
| 6 | tokens.css に shell 5 トークン追加 | pass |
| 7 | a11y: `aria-label='サイドバー'` / `aria-current='page'` / `aria-expanded` 付与 | pass（`SidebarShell.spec.tsx`） |

## 親 workflow への引き渡し条件

- 本サブworkflow の Phase 12 strict 7 が揃っており、artifacts.json が parse 可能であること
- Gate-B / Gate-C 実行は親 workflow の wave に委ねる
