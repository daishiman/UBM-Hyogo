# Phase 5 Implementation Notes

> Target deliverable: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/MVP-3LAYER-TASK-MAPPING.md`
> Generated: 2026-05-15

## Classification Contract

`3-layer` remains the historical task name for public / member / admin strategic layers. The generated matrix uses four columns because common App Router surfaces and cross-layer foundations need a separate `COM` support column.

## Task Cell Rationale

| Task | PUB | MEM | ADM | COM | Rationale |
| --- | --- | --- | --- | --- | --- |
| task-01 | 必須 | 必須 | 必須 | 必須 | Scope and 19-route baseline define all layers |
| task-02 | 必須 | 必須 | 必須 | 軽関与 | Env contract supports runtime data paths |
| task-03 | 軽関与 | 軽関与 | 軽関与 | 必須 | Shared Sentry/error reporting foundation |
| task-04 | 軽関与 | 軽関与 | 軽関与 | 必須 | Shared SSR/window safety and logger |
| task-05 | 軽関与 | 軽関与 | 軽関与 | 必須 | Common error/loading/not-found and smoke gate |
| task-06 | 必須 | 必須 | 必須 | 必須 | Canonical UI/UX contract |
| task-07 | 必須 | 必須 | 必須 | 軽関与 | Prototype mapping informs product layers |
| task-08 | 必須 | 必須 | 必須 | 必須 | Token SSOT |
| task-09 | 必須 | 必須 | 必須 | 必須 | Tailwind/token implementation bridge |
| task-10 | 必須 | 必須 | 必須 | 必須 | Shared primitive implementation |
| task-11 | 強関与 | 無関係 | 無関係 | 軽関与 | Public landing and member list |
| task-12 | 強関与 | 無関係 | 無関係 | 軽関与 | Public detail/register/legal |
| task-13 | 軽関与 | 強関与 | 軽関与 | 軽関与 | Login owns member entry and affects admin redirect |
| task-14 | 無関係 | 強関与 | 軽関与 | 軽関与 | Profile owns member self-service |
| task-15 | 無関係 | 無関係 | 必須 | 軽関与 | Admin layout/dashboard/members baseline |
| task-16 | 無関係 | 無関係 | 強関与 | 軽関与 | Admin tags/meetings/requests |
| task-17 | 無関係 | 無関係 | 強関与 | 軽関与 | Admin schema/conflicts/audit |
| task-18 | 必須 | 必須 | 必須 | 必須 | Cross-layer token and smoke verification |
| task-19 | 必須 | 必須 | 必須 | 必須 | Primitive specification consumed by all layers |
| task-20 | 必須 | 必須 | 無関係 | 軽関与 | Public/member screen blueprints |
| task-21 | 無関係 | 無関係 | 必須 | 軽関与 | Admin screen blueprints |
| task-22 | 必須 | 必須 | 必須 | 必須 | Shell, icons, and fixtures shared by layers |

## Verification Result

- Matrix A cells: 22 tasks x 4 layers = 88, blank cells 0.
- Matrix B reverse buckets are derived directly from Matrix A.
- WARN/FAIL source: `VERIFICATION-STATUS.md`; WARN/FAIL aggregation miss count 0.
- Invariant source: `INVARIANT-AUDIT.md`; violations 0.
- Smoke source: `SMOKE-COVERAGE-MATRIX.md`; 17 executable URL entries plus 2 common component-only surfaces.
