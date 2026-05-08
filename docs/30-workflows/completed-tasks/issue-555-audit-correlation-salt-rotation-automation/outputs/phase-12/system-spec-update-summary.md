# System Spec Update Summary

Status: `implemented-local / runtime evidence blocked_upstream_pending`

## Step 1-A: task record

Issue #555 is registered as an active implementation spec for `AUDIT_CORRELATION_SALT` rotation automation and `fingerprintVersion=2` migration.

Updated / added in this cycle:

- `.claude/skills/aiworkflow-requirements/references/audit-correlation.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260508-issue555-audit-correlation-salt-rotation.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-555-audit-correlation-salt-rotation-artifact-inventory.md`

## Step 1-B: implementation state

Current state is `implemented-local / implementation / NON_VISUAL / runtime evidence blocked_upstream_pending`. Local code was implemented in `apps/api/src/audit-correlation/{types,redact,correlate}.ts`, `apps/api/src/audit-correlation/__tests__/rotation.test.ts`, `scripts/audit-correlation/{rotate-salt.sh,run.sh,runner.ts}`, and `scripts/grep-gate/audit-correlation-secrets.sh`.

No Cloudflare Secret mutation, staging runtime, production operation, commit, push, or PR operation was executed in this review cycle.

## Step 1-C: related task state

Parent FU-01 remains the Phase 11 runtime dependency. Issue #555 stays CLOSED; PR context must use `Refs #555` and not reopen the issue.

## Step 2: system spec changes

Updated. `references/audit-correlation.md` now records the Issue #555 dual-hash bridge exception to the previous "no mixed join" rule. `references/deployment-secrets-management.md` remains the single secrets-management SSOT; no parallel `secrets-management.md` was created.

Additional review fixes applied:

- `correlate()` now chooses the representative `correlationKey` as v2 canonical when any bridge record provides `fingerprintHashes.v2`, avoiding `fingerprintVersion: 2` with a v1 hash.
- `scripts/audit-correlation/run.sh` / `runner.ts` now accept `--previous-salt` and default to `AUDIT_CORRELATION_SALT_PREVIOUS` when present, connecting the runbook path to dual-hash mode.
- `rotate-salt.sh` now requires `--confirm-production` for production mutating modes and treats missing previous secret deletion as idempotent for rollback / end-rotation.

## Artifacts parity

`outputs/artifacts.json` is not created for this workflow; root `artifacts.json` is the only artifact ledger. Phase 12 outputs now include `main.md` plus the six strict helper files.
