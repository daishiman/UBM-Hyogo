# workflow-issue-883-adapter-dev-warn-unknown-kind artifact inventory

## Root

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-883-adapter-dev-warn-unknown-kind/` |
| root ledger | `docs/30-workflows/completed-tasks/issue-883-adapter-dev-warn-unknown-kind/artifacts.json` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-883-adapter-dev-warn-unknown-kind/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| parent workflow | `docs/30-workflows/completed-tasks/issue-827-member-detail-adapter-and-visibility-defense/` |

## Implementation Targets

| Path | Purpose |
| --- | --- |
| `apps/web/src/lib/adapters/member-detail.ts` | Add `ToMemberDetailPropsOptions` / `RawField` export and call `onUnknownKind` only in unknown kind skip branch |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | Keep silent skip regression and add callback invocation case (9 tests total) |
| `apps/web/app/(public)/members/[id]/page.tsx` | Inject dev-only `console.warn` callback while passing `undefined` in production |

## Evidence

| Path | Status |
| --- | --- |
| `outputs/phase-11/typecheck.log` | present |
| `outputs/phase-11/lint.log` | present |
| `outputs/phase-11/adapter-test.log` | present |
| `outputs/phase-11/focused-tests.log` | present |
| `outputs/phase-11/build.log` | present |
| `outputs/phase-11/dce-grep.txt` | present |
| `outputs/phase-11/visual-snapshot-status.md` | present |

## Boundary

No API, D1 schema, shared Zod schema, primitive signature, CSS, or visual snapshot baseline change. Production DCE grep targets `.next/server` / `.open-next`; `.next/cache` is webpack cache and not a bundle artifact. Commit, push, and PR are user-gated.
