# Workflow Artifact Inventory: member-header-admin-link

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/member-header-admin-link/` |
| root artifacts | `docs/30-workflows/completed-tasks/member-header-admin-link/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/completed-tasks/member-header-admin-link/outputs/artifacts.json` |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/member-header-admin-link/outputs/phase-11/evidence/` |
| Phase 11 screenshots | `docs/30-workflows/completed-tasks/member-header-admin-link/outputs/phase-11/screenshots/member-header-{member,admin}.png` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/member-header-admin-link/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| implementation targets | `apps/web/src/lib/auth-view/*`, `apps/web/src/components/layout/MemberHeader.tsx`, `apps/web/app/(member)/layout.tsx` |
| tests | `apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts`, `apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx` |
| system spec | `docs/00-getting-started-manual/specs/02-auth.md` |

Status: `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION`.

User-gated: staging visual smoke, commit, push, PR.

## Lessons Learned

詳細: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-member-header-admin-link-2026-05.md`

| ID | 要旨 |
| --- | --- |
| L-MHAL-001 | 親 workflow Task の独立 workflow 切り出しは依存基盤の最小閉包だけを同 cycle で実装する |
| L-MHAL-002 | `AuthView` discriminated union literal 固定で admin-only field を型レベル分離する |
| L-MHAL-003 | `data-auth-state` DOM 属性で test selector / session state contract を安定化する |
| L-MHAL-004 | `(member)/layout.tsx` async 化 + `getAuthView()` 1 回呼び出し + prop 配信で session lookup を集約する |
| L-MHAL-005 | `getAuthView()` は throw を guest fallback に閉じる fail-closed 契約とする |
| L-MHAL-006 | UI render / pure resolver / async adapter の 3 層を focused Vitest 3 spec に分離する |

Anti-pattern 5 件は lessons file の §Anti-pattern を参照。
