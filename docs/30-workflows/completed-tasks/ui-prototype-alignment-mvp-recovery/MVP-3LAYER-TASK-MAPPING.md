# MVP 3-Layer Task Mapping Matrix

> Source workflow: `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/`
> Generated: 2026-05-15
> Naming note: `3-layer` is the historical workflow name for the three strategic product layers (public / member / admin). The matrix intentionally adds `COM` as a fourth common-support column for App Router shared surfaces (`error.tsx`, `not-found.tsx`, `loading.tsx`) and cross-layer foundations.

## 1. Legend

| Value | Meaning |
| --- | --- |
| 必須 | Required for the layer to operate as designed |
| 強関与 | Directly implements or strongly shapes the layer's primary route behavior |
| 軽関与 | Partially supports or locally affects the layer |
| 無関係 | No direct effect on the layer |

## 2. Layer Definition

| Layer | Route count | Routes / surfaces |
| --- | ---: | --- |
| PUB | 6 | `/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms` |
| MEM | 2 | `/login`, `/profile` |
| ADM | 8 | `/admin`, `/admin/members`, `/admin/tags`, `/admin/meetings`, `/admin/schema`, `/admin/requests`, `/admin/identity-conflicts`, `/admin/audit` |
| COM | 3 | `error.tsx`, `not-found.tsx`, `loading.tsx` |

## 3. Matrix A: Task To Layer

| Task ID | Subject | PUB | MEM | ADM | COM | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| task-01 | Scope gate / 19 routes | 必須 | 必須 | 必須 | 必須 | Defines the route and invariant baseline for every layer |
| task-02 | Wrangler env injection | 必須 | 必須 | 必須 | 軽関与 | Runtime env contract used by public, member, and admin data paths |
| task-03 | Sentry Workers SDK unify | 軽関与 | 軽関与 | 軽関与 | 必須 | Shared error capture and runtime observability |
| task-04 | Window guard and logger | 軽関与 | 軽関与 | 軽関与 | 必須 | Shared SSR/client safety and structured logging |
| task-05 | Error boundary and staging smoke | 軽関与 | 軽関与 | 軽関与 | 必須 | Common App Router surfaces and route smoke gate |
| task-06 | UI/UX contract rewrite | 必須 | 必須 | 必須 | 必須 | Canonical product/UI contract |
| task-07 | Prototype mapping table | 必須 | 必須 | 必須 | 軽関与 | Prototype-to-production reverse lookup |
| task-08 | Design tokens doc | 必須 | 必須 | 必須 | 必須 | OKLch token SSOT for all surfaces |
| task-09 | Tailwind v4 setup | 必須 | 必須 | 必須 | 必須 | Token bridge and global styling foundation |
| task-10 | UI primitives | 必須 | 必須 | 必須 | 必須 | Shared component primitive set |
| task-11 | Public top and member list | 強関与 | 無関係 | 無関係 | 軽関与 | Public landing and directory routes |
| task-12 | Member detail, register, legal | 強関与 | 無関係 | 無関係 | 軽関与 | Public detail, registration, privacy, terms |
| task-13 | Login rebuild | 軽関与 | 強関与 | 軽関与 | 軽関与 | Member login gate also affects admin redirect entry |
| task-14 | My profile and requests | 無関係 | 強関与 | 軽関与 | 軽関与 | Member profile and self-service requests |
| task-15 | Admin dashboard and members | 無関係 | 無関係 | 必須 | 軽関与 | Admin shell/dashboard/members baseline |
| task-16 | Admin tags, meetings, requests | 無関係 | 無関係 | 強関与 | 軽関与 | Admin operational routes |
| task-17 | Admin schema, conflicts, audit | 無関係 | 無関係 | 強関与 | 軽関与 | Admin governance/read-only routes |
| task-18 | Tokens and Playwright smoke verification | 必須 | 必須 | 必須 | 必須 | Cross-layer regression gate |
| task-19 | Primitives full spec | 必須 | 必須 | 必須 | 必須 | Formal primitive contract consumed by implementations |
| task-20 | Public/member screen blueprints | 必須 | 必須 | 無関係 | 軽関与 | Public and member screen contracts |
| task-21 | Admin screen blueprints | 無関係 | 無関係 | 必須 | 軽関与 | Admin screen contracts |
| task-22 | Shell, icons, fixtures | 必須 | 必須 | 必須 | 必須 | Shell/icon/fixture baseline shared across layers |

## 4. Matrix B: Layer To Task

### PUB

| Bucket | Tasks |
| --- | --- |
| 必須 | task-01, task-02, task-06, task-07, task-08, task-09, task-10, task-18, task-19, task-20, task-22 |
| 強関与 | task-11, task-12 |
| 軽関与 | task-03, task-04, task-05, task-13 |
| 無関係 | task-14, task-15, task-16, task-17, task-21 |

### MEM

| Bucket | Tasks |
| --- | --- |
| 必須 | task-01, task-02, task-06, task-07, task-08, task-09, task-10, task-18, task-19, task-20, task-22 |
| 強関与 | task-13, task-14 |
| 軽関与 | task-03, task-04, task-05 |
| 無関係 | task-11, task-12, task-15, task-16, task-17, task-21 |

### ADM

| Bucket | Tasks |
| --- | --- |
| 必須 | task-01, task-02, task-06, task-07, task-08, task-09, task-10, task-15, task-18, task-19, task-21, task-22 |
| 強関与 | task-16, task-17 |
| 軽関与 | task-03, task-04, task-05, task-13, task-14 |
| 無関係 | task-11, task-12, task-20 |

### COM

| Bucket | Tasks |
| --- | --- |
| 必須 | task-01, task-03, task-04, task-05, task-06, task-08, task-09, task-10, task-18, task-19, task-22 |
| 強関与 | なし |
| 軽関与 | task-02, task-07, task-11, task-12, task-13, task-14, task-15, task-16, task-17, task-20, task-21 |
| 無関係 | なし |

## 5. WARN / FAIL Layer Impact

Source: `VERIFICATION-STATUS.md` has 79 PASS, 8 WARN, 0 FAIL, 1 N/A across 88 verification cells.

| Task | Verification status | Affected layers | Impact |
| --- | --- | --- | --- |
| task-05 | WARN on C2 | COM | Common smoke/error-surface expansion is incomplete but no FAIL exists |
| task-12 | WARN on C2 | PUB | Public register is external-link MVP behavior |
| task-16 | WARN on C2/C4 | ADM | Meetings CRUD modal and indirect upstream WARN remain admin-layer risk |
| task-17 | WARN on C2/C4 | ADM | Audit timeline follow-up remains admin-layer risk |
| task-18 | WARN on C4 | PUB, MEM, ADM, COM | Regression gate inherits upstream WARNs |
| task-22 | WARN on C2 | PUB, MEM, ADM, COM | Shell/icon fixture follow-up affects shared baseline |

No FAIL task is present. WARN/FAIL aggregation miss count: 0.

## 6. Invariant Audit Summary

Source: `INVARIANT-AUDIT.md`.

| Invariant axis | Result |
| --- | --- |
| Existing API endpoints only | COMPLIANT for all applicable tasks |
| OKLch token canonicalization | COMPLIANT for all applicable tasks |
| Prototype primitives canonical | COMPLIANT for all applicable tasks |
| No direct D1 access from apps/web | COMPLIANT for all tasks |
| Consent keys canonical | COMPLIANT for applicable tasks |
| GAS prototype never promoted | COMPLIANT for all tasks |

Violations: 0.

## 7. Smoke Coverage Summary

Source: `SMOKE-COVERAGE-MATRIX.md`.

| Axis | Coverage | Layer interpretation |
| --- | ---: | --- |
| URL status | 17/17 | PUB, MEM, and ADM URL routes covered by executable smoke entries |
| DOM | 19/19 | All URL and component-only surfaces have selectors or component-level anchors |
| Token | 19/19 | Delegated to token drift gate |
| A11y runtime | 17/19 | `error.tsx` and `loading.tsx` remain component-only runtime observations |
| Interaction smoke | 17/19 | Component-only common surfaces documented, not executed |
| Visual baseline | 4/19 | High-value baseline set: login, public top, admin dashboard, profile |

## 8. Strategic Readiness

| Layer | Readiness | Reason |
| --- | --- | --- |
| PUB | AT_RISK | No FAIL, but required task-18 and task-22 carry WARN and task-12 has public C2 WARN |
| MEM | AT_RISK | No FAIL, but required task-18 and task-22 carry WARN |
| ADM | AT_RISK | No FAIL, but task-16/task-17 direct admin WARN plus required task-18/task-22 WARN |
| COM | AT_RISK | No FAIL, but common smoke/error and shared shell/regression WARNs remain |

## 9. References

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md`
- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md`
- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md`
- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/outputs/phase-5/implementation-notes.md`
