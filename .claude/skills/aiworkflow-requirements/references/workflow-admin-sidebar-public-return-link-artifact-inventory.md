# Workflow Artifact Inventory: admin-sidebar-public-return-link

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-sidebar-public-return-link/` |
| root artifacts | `docs/30-workflows/completed-tasks/admin-sidebar-public-return-link/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/completed-tasks/admin-sidebar-public-return-link/outputs/artifacts.json` |
| Phase 11 summary | `docs/30-workflows/completed-tasks/admin-sidebar-public-return-link/outputs/phase-11/main.md` |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/admin-sidebar-public-return-link/outputs/phase-11/evidence/{typecheck,lint,vitest-adminsidebar,grep-gate}.log` |
| Phase 11 screenshots | `docs/30-workflows/completed-tasks/admin-sidebar-public-return-link/outputs/phase-11/screenshots/{admin-sidebar-overview,public-return-hover,public-return-focus}.png` |
| Phase 11 visual metadata | `docs/30-workflows/completed-tasks/admin-sidebar-public-return-link/outputs/phase-11/visual-capture-metadata.json` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/admin-sidebar-public-return-link/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| implementation target | `apps/web/src/components/layout/AdminSidebar.tsx` |
| test targets | `apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx`, `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx`, `apps/web/playwright/tests/admin-sidebar-public-return-link.spec.ts` |

Status: `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / local_visual_captured`.

Boundary: `AdminSidebarNavItem` is intentionally unchanged. Staging runtime observation, commit, push, and PR are user-gated.

## Lessons Learned

- [[lessons-learned-admin-sidebar-public-return-link-2026-05]] — L-ADMRET-001..005:
  - L-ADMRET-001: 公開復帰 link は GROUPS でなく footer 直前の `data-role="public-return"` anchor として独立配置（コンテキスト離脱 link と nav item の責務分離）。
  - L-ADMRET-002: shared primitive (`AdminSidebarNavItem`) 拡張は call site 数 ≥ 2 を必達条件。1 件なら inline 実装で完結。
  - L-ADMRET-003: 「immediately before」要件は `nextElementSibling` 1-hop / CSS adjacent combinator `+ footer` で assertion。`toBeVisible()` 単独は不可。
  - L-ADMRET-004: `implementation_files` 明示時は `spec_created` → `implemented_local_evidence_captured` を Phase 12 closeout 前に昇格（gate-metadata dual-state reject 回避）。
  - L-ADMRET-005: local Playwright visual fixture で overview/hover/focus 3 state を取得し staging deploy 前に `implemented_local_evidence_captured` まで自走。

汎化版は task-specification-creator [[patterns-lessons-and-pitfalls]] 末尾「Admin sidebar 公開復帰 link 配置 + shared primitive 拡張回避パターン (2026-05-28)」節に反映。
