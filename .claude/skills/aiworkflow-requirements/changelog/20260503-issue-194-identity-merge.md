# 2026-05-03 — Issue #194 EMAIL_CONFLICT identity merge follow-up sync

- Synced workflow root `docs/30-workflows/completed-tasks/issue-194-03b-followup-001-email-conflict-identity-merge/` as `implemented-local` / implementation-spec / VISUAL_ON_EXECUTION / Phase 1-12 completed / Phase 11 runtime pending / Phase 13 pending_user_approval.
- Implementation surface (local diff, not committed):
  - admin API: `apps/api/src/routes/admin/identity-conflicts.ts` (`createAdminIdentityConflictsRoute`)
  - repository: `apps/api/src/repository/identity-conflict.ts`, `apps/api/src/repository/identity-merge.ts`
  - service: `apps/api/src/services/admin/identity-conflict-detector.ts`
  - shared schema: `packages/shared/src/schemas/identity-conflict.ts` (`MergeIdentityRequest/Response`, `maskResponseEmail`)
  - migrations: `apps/api/migrations/0010_identity_merge_audit.sql`, `0011_identity_aliases.sql`, `0012_identity_conflict_dismissals.sql`
  - admin UI: `apps/web/app/(admin)/admin/identity-conflicts/`, `apps/web/src/components/admin/IdentityConflictRow.tsx`, navigation `apps/web/src/components/layout/AdminSidebar.tsx`
- Manual specs synced (same wave): `docs/00-getting-started-manual/specs/01-api-schema.md` (3 endpoints + request/response types), `08-free-database.md` (3 DDL + atomic D1 batch contract), `11-admin-management.md` (identity merge 節).
- Skill registry updates:
  - `indexes/quick-reference.md`: corrected workflow root path to `completed-tasks/...` and added lessons-learned anchor.
  - `indexes/resource-map.md`: corrected workflow root path and added lessons-learned to canonical references.
  - `references/task-workflow-active.md`: corrected workflow root path and added lessons reference.
  - `references/legacy-ordinal-family-register.md`: corrected canonical / superseded paths to `completed-tasks/`.
  - New: `references/lessons-learned-issue-194-identity-merge-2026-05.md` (L-IDENT-001..006).
- Lessons captured: alias-only canonical merge (no raw response moves), first-stage 100%-confidence detection scope, PII redact-on-write + mask-on-read 2-stage policy, dismiss upsert with composite PK, undo via runbook (no UI), composite cursor `(submittedAt DESC, memberId ASC)`.
- Phase 11 runtime evidence (curl / screenshot / axe), staging D1 migration apply, commit, push, and PR remain blocked behind Phase 13 user approval gate.
