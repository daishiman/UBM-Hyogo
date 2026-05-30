# 2026-05-27 google-form-reflection-diagnostics-fu-002-h2-identity-rebuild

H2 identity rebuild を `implemented_local_runtime_pending / implementation / NON_VISUAL` として同期。

- `apps/api/migrations/0021_backfill_member_identities.sql` で `tag_assignment_queue(response_id, member_id)` bridge 付き response を `member_identities` へ backfill する。
- `apps/api/src/repository/identities.ts` に verified email auto-link helper を追加し、既存 identity を上書きしない `INSERT OR IGNORE` + 再 SELECT に固定した。
- `apps/api/src/routes/auth/session-resolve.ts` は既存 lookup miss 時のみ auto-link を試行し、`member_status.rules_consent` / `is_deleted` gate は迂回しない。
- `docs/00-getting-started-manual/specs/02-auth.md`、`references/api-endpoints.md`、`references/database-schema.md`、quick-reference / resource-map / task-workflow-active / artifact inventory / SKILL 履歴 / LOGS を同一 wave で反映した。

Staging/prod D1 backup、migration apply、deployed diagnostics capture、24h autolink log observation、commit、push、PR は user-gated。
