# 2026-05-17 i02-admin-error-type-unify

`docs/30-workflows/completed-tasks/i02-admin-error-type-unify/` を `implemented_local_evidence_captured / implementation / NON_VISUAL`
として同期した（ワークフロー完了に伴い completed-tasks 配下へ移動済み。元発注書も
`docs/30-workflows/completed-tasks/integration-fixes-i02-admin-error-type-unify.md` へ移動）。

- `apps/web/src/features/admin/hooks/useAdminMutation.ts` の 401 を `AuthRequiredError`、非 2xx を
  `FetchAuthedError(status, bodyText)` に統一し、401 は `toLoginRedirect(currentPath)` で `/login?redirect=...` に接続。
- `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` を 401 redirect DI / 403 / 5xx / reset assertion へ更新。
- Phase 12 strict 7、root/output artifacts parity、source unassigned consumed trace を追加。
- `workflow-i02-admin-error-type-unify-artifact-inventory.md`、resource-map、quick-reference、task-workflow-active、LOGS を同一 wave 同期。
- commit / push / PR は user-gated のため未実行。
