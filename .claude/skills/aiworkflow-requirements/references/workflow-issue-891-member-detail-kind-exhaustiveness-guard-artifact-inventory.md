# workflow-issue-891-member-detail-kind-exhaustiveness-guard artifact inventory

## Summary

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-891-member-detail-kind-exhaustiveness-guard/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 13 pending_user_approval` |
| issue | #891 CLOSED; PR wording should use `Refs #891 #827` |
| parent | `docs/30-workflows/completed-tasks/issue-827-member-detail-adapter-and-visibility-defense/` |
| source unassigned | `docs/30-workflows/completed-tasks/unassigned-task/issue-827-followup-001-displayable-kinds-exhaustiveness-guard.md` consumed |

## Implementation Targets

| Path | Role |
| --- | --- |
| `apps/web/src/lib/adapters/member-detail.ts` | `KIND_ROUTE` exhaustive classification and detail filtering |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | enum/map parity and excluded-kind regression tests |
| `apps/web/src/components/public/MemberDetail.tsx` | passes `linkSections` to existing `MemberLinks` so `url` route is consumed |
| `docs/00-getting-started-manual/specs/04-types.md` | system type contract for FieldKind and member detail route classification |
| `docs/00-getting-started-manual/specs/09-ui-ux.md` | public member detail UI contract for linkSections and excluded kinds |

## Phase 11 Evidence

| Path | Status |
| --- | --- |
| `outputs/phase-11/focused-tests.log` | present |
| `outputs/phase-11/typecheck.log` | present |
| `outputs/phase-11/test-internals-grep.log` | present |
| `outputs/phase-11/visual-diff-rationale.md` | present |

## Phase 12 strict 7 Files

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## Boundary

Commit, push, PR, and any visual baseline update remain user-gated.
