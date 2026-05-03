# Phase 13 Change Summary

## Status

- State: `PENDING_USER_APPROVAL`
- Boundary: PR 作成前の change summary placeholder。実 PR 用の最終差分は user GO 後に更新する。

## Current Change Set

| Area | Files |
| --- | --- |
| API DDL | `apps/api/migrations/0010_identity_merge_audit.sql`, `0011_identity_aliases.sql`, `0012_identity_conflict_dismissals.sql` |
| API repository / service / route | `apps/api/src/repository/identity-conflict.ts`, `apps/api/src/repository/identity-merge.ts`, `apps/api/src/services/admin/identity-conflict-detector.ts`, `apps/api/src/routes/admin/identity-conflicts.ts`, `apps/api/src/index.ts` |
| Tests | `apps/api/src/repository/__tests__/identity-conflict.test.ts`, `identity-merge.test.ts`, `apps/api/src/services/admin/identity-conflict-detector.test.ts` |
| Shared schema | `packages/shared/src/schemas/identity-conflict.ts`, `packages/shared/src/schemas/index.ts` |
| Web UI | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`, `apps/web/src/components/admin/IdentityConflictRow.tsx` |
| Workflow / specs | `docs/30-workflows/issue-194-03b-followup-001-email-conflict-identity-merge/`, manual specs, aiworkflow-requirements indexes |

