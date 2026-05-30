---
Phase: 11
status: runtime_pending
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../phase-11-manual-test.md
---

# Phase 11 — 手動テスト (task A)

## 状態

`runtime_pending`。Gate-B 待ち。

## 主証跡

| 種別 | パス | 状態 |
|------|------|------|
| 単体テスト | `apps/web/src/components/shell/__tests__/*.spec.{ts,tsx}` 3 file | pending |
| Playwright smoke | `apps/web/tests/e2e/sidebar-shell-smoke.spec.ts`（親管轄） | pending |
| Playwright visual | `apps/web/tests/e2e/sidebar-shell-visual.spec.ts`（親管轄） | pending |
| manual-test-result.md | `outputs/phase-11/manual-test-result.md` | pending |
| screenshot-plan.json | `outputs/phase-11/screenshot-plan.json` | present |

## 手動確認項目（Gate-B 実行時）

1. viewer / member / admin それぞれで nav 件数（3 / 4 / 13）が一致
2. collapse toggle で `aria-expanded` 反転、label が `sr-only` 化
3. localStorage `ubm:shell:collapsed` に永続化
4. SSR で hydration mismatch warning が出ない

## NON_VISUAL 該当性

該当しない（VISUAL タスク）。screenshot 3 枚（expanded-viewer / collapsed-viewer / expanded-admin）は Gate-B wave で取得。
