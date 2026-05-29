# google-form-reflection-diagnostics-fu-002-h2-identity-rebuild artifact inventory

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics-fu-002-h2-identity-rebuild/` |
| parent | `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/` |
| status | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| purpose | `member_responses` には存在するが `member_identities` に無い verified email を、bridge-backed migration と `/auth/session-resolve` auto-link で救済する |
| implementation | `apps/api/migrations/0021_backfill_member_identities.sql`, `apps/api/src/repository/identities.ts`, `apps/api/src/routes/auth/session-resolve.ts` |
| tests | `apps/api/src/repository/__tests__/identities.autolink.spec.ts`, `apps/api/src/routes/auth/session-resolve.contract.spec.ts` |
| system specs | `docs/00-getting-started-manual/specs/02-auth.md`, `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`, `.claude/skills/aiworkflow-requirements/references/database-schema.md` |
| Phase 11 | NON_VISUAL local evidence: typecheck, lint, focused API tests. Staging/prod D1 backup, migration apply, deployed diagnostics, and 24h autolink log observation are user-gated runtime evidence. |
| Phase 12 | strict 7 files present under `outputs/phase-12/`; root/output artifacts parity maintained |
| boundary | Bridge-less historical rows cannot be attached to unknown existing `member_status.member_id` with current schema data. Verified-email auto-link can create `autolink:<uuid>` identity but still requires normal `member_status` gates. |
| user gate | staging/prod D1 backup, migration apply, deployed diagnostics capture, commit, push, PR |

## Skill knowledge synced

| 観点 | 場所 |
| --- | --- |
| parent inventory | `references/workflow-google-form-reflection-diagnostics-artifact-inventory.md` H2 follow-up sync row |
| active workflow | `references/task-workflow-active.md` google-form-reflection-diagnostics-fu-002 row |
| indexes | `indexes/quick-reference.md`, `indexes/resource-map.md` |
| auth API | `references/api-endpoints.md` `/auth/session-resolve` row |
| D1 schema | `references/database-schema.md` `member_identities` row |
| manual spec | `docs/00-getting-started-manual/specs/02-auth.md` H2 identity auto-link section |
| changelog | `SKILL.md` / `SKILL-changelog.md` `v2026.05.27-google-form-reflection-diagnostics-fu-002-h2-identity-rebuild`, `changelog/20260527-google-form-reflection-diagnostics-fu-002-h2-identity-rebuild.md` |
| logs | `LOGS/_legacy.md` 2026-05-27 entry |
