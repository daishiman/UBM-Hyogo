---
Phase: 11
status: pending
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../../../outputs/phase-11/manual-test-result.md
---

# Phase 11 — Manual test result (task A)

## 状態

`pending`。Gate-B 待ち。

## NON_VISUAL 非該当宣言

本タスクは **VISUAL** 区分。NON_VISUAL 例外には該当しない。screenshot 取得を Gate-B 内で実施する。

## 主証跡

| 種別 | パス | 状態 |
|------|------|------|
| 単体テスト | `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | pending |
| 単体テスト | `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx` | pending |
| 単体テスト | `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | pending |
| Playwright smoke | `apps/web/tests/e2e/sidebar-shell-smoke.spec.ts`（親 wave） | pending |
| screenshot plan | `outputs/phase-11/screenshot-plan.json` | present |

## Gate-B 実行時の確認項目

1. viewer / member / admin で nav 件数が 3 / 4 / 13 一致
2. collapse toggle で `aria-expanded` / `sr-only` 反転
3. localStorage `ubm:shell:collapsed` 永続化
4. SSR hydration mismatch なし
