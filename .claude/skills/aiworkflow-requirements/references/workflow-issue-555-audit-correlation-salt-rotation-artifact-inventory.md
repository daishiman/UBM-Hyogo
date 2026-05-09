# Workflow Artifact Inventory: Issue #555 audit correlation salt rotation

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-555-audit-correlation-salt-rotation-automation/` |
| state | `implemented-local / implementation / NON_VISUAL / runtime evidence blocked_upstream_pending` |
| parent | Issue #516 audit correlation |
| source | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-03-salt-rotation-automation.md` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-555-audit-correlation-salt-rotation-automation/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Local implementation artifacts

| Path | Role |
| --- | --- |
| `scripts/audit-correlation/rotate-salt.sh` | 4-mode semi-automated salt rotation |
| `scripts/audit-correlation/run.sh` | CLI wrapper with `--previous-salt` / `AUDIT_CORRELATION_SALT_PREVIOUS` bridge input |
| `scripts/audit-correlation/runner.ts` | Redacts GitHub / Cloudflare fixtures with current and optional previous salt |
| `scripts/grep-gate/audit-correlation-secrets.sh` | Salt literal grep gate for build/output paths |
| `apps/api/src/audit-correlation/types.ts` | Extend existing `CorrelationKey` / `NormalizedAuditEvent` |
| `apps/api/src/audit-correlation/redact.ts` | Emit v2 canonical hash and optional previous v1 hash |
| `apps/api/src/audit-correlation/correlate.ts` | Merge v1/v2 bridge groups while preserving public `correlate()` signature and v2 canonical representative key |
| `apps/api/src/audit-correlation/__tests__/rotation.test.ts` | Dual-hash / rollback / v1-v2 merge / continuity tests |
| `docs/runbooks/audit-correlation.md` | Rotation / emergency / end-rotation runbook |
| `.claude/skills/aiworkflow-requirements/references/audit-correlation.md` | Audit correlation SSOT |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Secret placement SSOT |

## Gates

- Runtime staging evidence is blocked on FU-01 live wiring.
- Production rotation, commit, push, and PR creation require user approval.
