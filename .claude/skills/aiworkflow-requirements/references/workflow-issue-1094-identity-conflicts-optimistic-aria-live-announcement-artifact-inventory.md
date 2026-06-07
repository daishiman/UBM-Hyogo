# Workflow Artifact Inventory: issue-1094-identity-conflicts-optimistic-aria-live-announcement

## Summary

| Field | Value |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-1094-identity-conflicts-optimistic-aria-live-announcement/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 13 pending_user_approval` |
| issue | #1094（CLOSED。mutation なし） |
| date | 2026-06-05 |

## Implementation Artifacts

| Path | Role |
| --- | --- |
| `apps/web/src/components/admin/IdentityConflictAnnouncer.tsx` | Page-level single `role="status"` / `aria-live="polite"` region, append-children announcements, TTL cleanup, provider fallback |
| `apps/web/src/components/admin/identityConflictAnnouncements.ts` | `IdentityConflictAction`, `IDENTITY_CONFLICT_ANNOUNCEMENTS`, `announcementFor()` SSOT |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | Removes row-local status node / focus stealing and announces optimistic merge/dismiss through context |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | Wraps the identity-conflicts list with `IdentityConflictAnnouncer` without converting the server page to a client component |
| `apps/web/src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx` | Focused announcer tests |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | Focused row tests updated for announcer provider and non-focus-steal assertion |

## Evidence

| Command | Result |
| --- | --- |
| `pnpm install` | PASS |
| `pnpm exec vitest run apps/web/src/components/admin/__tests__/IdentityConflictAnnouncer.spec.tsx apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | PASS（2 files / 26 tests） |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/web lint` | PASS |
| `pnpm verify:tokens` | PASS |
| focused grep | PASS（`optimisticStatusRef` / `.focus()` / legacy hook / HEX / inline style 追加なし） |

## Invariants

- Existing merge / dismiss API endpoints and request payloads are unchanged.
- D1 schema and apps/api are unchanged.
- `useAdminMutation` remains the mutation boundary.
- Existing rollback errors keep `role="alert"`.
- The task is NON_VISUAL: visual screenshot evidence is not useful because the changed surface is sr-only. Manual SR verification remains user-gated.

## Lessons Learned

| ID | Lesson |
| --- | --- |
| L-I1094-001 | For optimistic row removal, move the announcement target to a page-level single live region while keeping the row as the trigger source. This avoids focus stealing and row-local status lifetime races. |
| L-I1094-002 | Continuous screen-reader announcements should append child nodes into the live region instead of overwriting one text node; TTL cleanup prevents DOM buildup. |
| L-I1094-003 | Keep announcement copy in a typed `Record<Action, string>` and expose `announcementFor(action)` so merge/dismiss copy cannot drift through inline branches. |
| L-I1094-004 | In Next.js App Router, a server page can preserve server data fetching by wrapping children in a small client provider component instead of converting the whole page to client mode. |
| L-I1094-005 | NON_VISUAL a11y behavior needs source-level evidence (DOM/focus/timer tests) plus optional manual SR evidence; screenshots do not prove aria-live behavior. |
