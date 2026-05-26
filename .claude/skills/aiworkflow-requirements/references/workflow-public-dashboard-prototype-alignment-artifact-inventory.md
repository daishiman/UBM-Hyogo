# workflow-public-dashboard-prototype-alignment artifact inventory

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/public-dashboard-prototype-alignment/` |
| root artifacts | `docs/30-workflows/public-dashboard-prototype-alignment/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/public-dashboard-prototype-alignment/outputs/artifacts.json` |
| Phase 12 compliance | `docs/30-workflows/public-dashboard-prototype-alignment/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 12 strict outputs | `docs/30-workflows/public-dashboard-prototype-alignment/outputs/phase-12/` |
| public blueprint | `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` |
| prototype source | `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` |
| historical parent | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/` |
| related active workflow | `docs/30-workflows/admin-ui-prototype-alignment/` |

## Classification

`implementation_reviewed / implementation / VISUAL / phase11_runtime_pending`

## Planned Implementation Targets

- `apps/web/app/page.tsx`
- `apps/web/src/components/public/Hero.tsx`
- `apps/web/src/components/public/Stats.tsx`
- `apps/web/src/components/public/AboutUbm.tsx`
- `apps/web/src/components/public/ZoneIntro.tsx`
- `apps/web/src/components/public/MemberGrid.tsx`
- `apps/web/src/components/public/Timeline.tsx`
- `apps/web/src/styles/legacy-public.css`

## Boundary

実装と unit test 実装は完了 (implementation_reviewed)。Phase 11 PNG 撮影 / staging deploy / commit / push / PR は引き続き user-gated であり、PASS とは主張しない。

## Lessons

`lessons-learned/public-dashboard-prototype-alignment-2026-05.md` に L-PDPA-001..007 を集約 (variant 後方互換、section header 常時、prototype 固定値 const 化、`/__test__/<scope>` toggle、`/__test__/reset` 同期、`PLAYWRIGHT_EVIDENCE_TASK` 3 点セット、`legacy-public.css` bridge 条件)。
`task-specification-creator/references/patterns-lessons-and-pitfalls.md` 末尾に P-PROTO-ALIGN-001 / P-E2E-EMPTY-TOGGLE-001 として汎化。
