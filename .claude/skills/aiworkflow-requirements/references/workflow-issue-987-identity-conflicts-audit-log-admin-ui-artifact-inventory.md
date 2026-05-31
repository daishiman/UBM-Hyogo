# Workflow Artifact Inventory: issue-987-identity-conflicts-audit-log-admin-ui

## Summary

| Field | Value |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #987 CLOSED (`Refs #987` only) |
| purpose | Record identity-conflicts dismiss operations in `audit_log` as `identity.dismiss` so existing `/admin/audit` can filter and display them |

## Implementation Artifacts

| Path | Role |
| --- | --- |
| `apps/api/src/repository/identity-conflict.ts` | Adds `actorAdminEmail` to `dismissIdentityConflict`, writes `identity.dismiss` audit row with the dismissal update |
| `apps/api/src/routes/admin/identity-conflicts.ts` | Passes admin email from auth context into dismiss repository call |
| `apps/api/src/repository/__tests__/identity-conflict.repository.spec.ts` | Verifies dismiss hides candidate, redacts stored reason, and appends `identity.dismiss` audit row without reason PII in audit payload |
| `apps/api/src/routes/admin/identity-conflicts.contract.spec.ts` | Verifies dismiss endpoint records actor email and `identity.dismiss` audit row |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | Verifies existing `/admin/audit` action/target filters return `identity.dismiss` rows |

## Workflow Artifacts

| Path | Role |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/index.md` | Root workflow summary and state |
| `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/artifacts.json` | Root artifact ledger |
| `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/outputs/artifacts.json` | Output artifact ledger mirror |
| `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/outputs/phase-11/phase-11.md` | NON_VISUAL evidence contract |
| `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 compliance evidence |

## System Spec Sync

| Path | Role |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Active workflow ledger entry |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | `/admin/audit` audit action contract update |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Quick lookup entry |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Progressive disclosure entry |
| `.claude/skills/aiworkflow-requirements/changelog/20260529-issue987-identity-conflicts-dismiss-audit.md` | Dated changelog |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | Latest update headline |

## User-Gated Boundaries

- Cloudflare staging deploy and authenticated `/admin/audit?action=identity.dismiss` runtime proof.
- Commit, push, and PR creation.

## Lessons Learned

体系版は [[lessons-learned-issue-987-identity-conflicts-audit-log-admin-ui-2026-05]] を参照。

- **L-I987-001（CLOSED issue は最新コードに照合してから仕様化）**: CLOSED issue を旧前提のまま信じず現行コードを grep 照合し、未解決の根本問題を最小単位（本件は「dismiss が `audit_log` に残らない一点」）へ最適化してから Phase 1 を起こす。Issue は CLOSED のまま `Refs #987` で参照し再 OPEN しない。
- **L-I987-002（対称操作の片側監査記録欠落の検出）**: merge/dismiss・apply/revert・grant/revoke など対称操作は `audit_log` INSERT の有無を対で grep 確認し、記録ありの側を SSOT として列順・brand・before/after_json を逐語コピーして欠落側を対称化する。
- **L-I987-003（新 audit action は brand + 列順を既存からコピー）**: `identity.dismiss` は merge (`identity-merge.ts`) の `audit_log` 9 列 INSERT を SSOT として `AuditAction` brand / `AdminId` / `AdminEmail | null` cast ごと踏襲。原子性は `db.batch` で担保し、`batch` 不在時は `DismissAtomicBatchUnavailable` を throw して部分書き込みを防ぐ。

task-specification-creator 側は既存 same-wave implementation / Phase 12 sync / D1 lane command lesson で吸収できるため no-op。
