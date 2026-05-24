# workflow-issue-827-member-detail-adapter-and-visibility-defense artifact inventory

## Root

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-827-member-detail-adapter-and-visibility-defense/` |
| root ledger | `docs/30-workflows/completed-tasks/issue-827-member-detail-adapter-and-visibility-defense/artifacts.json` |
| output mirror | `docs/30-workflows/completed-tasks/issue-827-member-detail-adapter-and-visibility-defense/outputs/artifacts.json` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-827-member-detail-adapter-and-visibility-defense/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Implementation Targets

| Path | Purpose |
| --- | --- |
| `apps/web/src/lib/adapters/member-detail.ts` | PublicMemberProfile to MemberDetail view-model pure adapter; filters `allSections` to public fields before link/activity rendering |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | Adapter contract tests |
| `apps/web/src/components/public/MemberDetailSections.tsx` | Presentational rendering only |
| `apps/web/src/components/public/__tests__/MemberDetailSections.component.spec.tsx` | Component contract update |
| `apps/web/app/(public)/members/[id]/page.tsx` | Page wiring via adapter |

## Evidence

| Path | Status |
| --- | --- |
| `outputs/phase-11/focused-tests.log` | present |
| `outputs/phase-11/typecheck.log` | present |
| `outputs/phase-11/lint.log` | present |
| `outputs/phase-11/build.log` | present |
| `outputs/phase-11/visual-snapshot-status.md` | present |

## Boundary

No API, D1 schema, shared Zod schema, primitive signature, CSS, or visual snapshot baseline change. Commit, push, PR, issue mutation, and deployment verification are user-gated.
