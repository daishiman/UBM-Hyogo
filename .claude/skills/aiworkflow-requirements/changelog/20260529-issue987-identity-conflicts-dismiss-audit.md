# 2026-05-29 issue-987 identity-conflicts dismiss audit

`docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/` を `implemented_local_evidence_captured / implementation / NON_VISUAL` として同期（close-out で completed-tasks へ移動済み・`hasCompletedTasksAncestor: true`。staging runtime proof / commit / push / PR は user-gated）。

## Changes

- `apps/api/src/repository/identity-conflict.ts` の dismiss path を `audit_log.action='identity.dismiss'` 追記へ対称化。
- `apps/api/src/routes/admin/identity-conflicts.ts` で admin email を repository へ配線。
- D1 lane focused tests を追加・更新:
  - `apps/api/src/repository/__tests__/identity-conflict.repository.spec.ts`
  - `apps/api/src/routes/admin/identity-conflicts.contract.spec.ts`
  - `apps/api/src/routes/admin/audit.contract.spec.ts`
- `api-endpoints.md`、`task-workflow-active.md`、quick-reference、resource-map、artifact inventory を同一サイクルで同期。
- `lessons-learned/lessons-learned-issue-987-identity-conflicts-audit-log-admin-ui-2026-05.md` を新規追加（L-I987-001..003: CLOSED issue 最新コード照合 / 対称操作の片側監査記録欠落検出 / 新 audit action は brand + 列順を既存からコピー）し、artifact inventory 末尾に `## Lessons Learned` 節を追加。

## Boundary

Endpoint surface、D1 schema、UI は変更しない。staging runtime proof、commit、push、PR は user-gated。
