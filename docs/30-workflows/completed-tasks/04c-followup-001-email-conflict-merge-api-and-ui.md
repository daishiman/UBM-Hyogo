# 04c-followup-001-email-conflict-merge-api-and-ui - consumed stub

## Status

| 項目 | 内容 |
| --- | --- |
| task id | `04c-followup-001-email-conflict-merge-api-and-ui` |
| status | `consumed_by_issue_194_alias` |
| consumed at | 2026-05-04 |
| canonical workflow | `docs/30-workflows/completed-tasks/issue-194-03b-followup-001-email-conflict-identity-merge/` |
| alias trace | `docs/30-workflows/04c-followup-001-email-conflict-merge-api-and-ui/` |

## Canonical Resolution

This unassigned task is no longer an implementation backlog item. Issue #432 / the 04c follow-up name referred to the same identity conflict merge feature that is now canonical under Issue #194.

The canonical workflow owns the runtime implementation, system spec sync, and evidence boundary:

| Area | Canonical owner |
| --- | --- |
| API | `GET /admin/identity-conflicts`, `POST /admin/identity-conflicts/:id/merge`, `POST /admin/identity-conflicts/:id/dismiss` |
| D1 tables | `identity_merge_audit`, `identity_aliases`, `identity_conflict_dismissals`, `audit_log` |
| UI | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`, `IdentityConflictRow` |
| shared schema | `packages/shared/src/schemas/identity-conflict.ts` |
| runtime evidence | issue-194 Phase 11 / Phase 13 user approval boundary |

Do not reopen this file as a second implementation task. Use the alias trace only to route the old 04c name to the Issue #194 canonical workflow.
