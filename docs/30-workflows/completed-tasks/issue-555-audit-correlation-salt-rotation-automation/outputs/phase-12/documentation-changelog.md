# Documentation Changelog

## Entry checklist

Command: `git status --porcelain apps/ packages/ 2>/dev/null`

Result: Issue #555 app code changes are present under `apps/api/src/audit-correlation/`.

Command: `git diff --name-only -- apps packages 2>/dev/null`

Result: `apps/api/src/audit-correlation/{types,redact,correlate}.ts` changed. New local test file: `apps/api/src/audit-correlation/__tests__/rotation.test.ts`.

## Changed files

| Path | Change |
| --- | --- |
| `apps/api/src/audit-correlation/types.ts` | Added `FingerprintVersion = 1 | 2`, optional `fingerprintHashes`, and `RedactOpts.previousSalt` |
| `apps/api/src/audit-correlation/redact.ts` | Added v2 canonical fingerprint bundle and optional v1 previous-salt hash |
| `apps/api/src/audit-correlation/correlate.ts` | Added v1/v2 bridge grouping and v2-priority representative `correlationKey` |
| `apps/api/src/audit-correlation/__tests__/rotation.test.ts` | Added rotation dual-hash, rollback, v1/v2 merge, v2 canonical key, and continuity tests |
| `scripts/audit-correlation/rotate-salt.sh` | Added 4-mode salt rotation script with production confirmation and idempotent previous-secret delete handling |
| `scripts/audit-correlation/run.sh` | Added `--previous-salt` / `AUDIT_CORRELATION_SALT_PREVIOUS` bridge input |
| `scripts/audit-correlation/runner.ts` | Passes `previousSalt` into redaction |
| `scripts/grep-gate/audit-correlation-secrets.sh` | Added audit-correlation salt literal grep gate |
| `docs/runbooks/audit-correlation.md` | Aligned dual-hash runner invocation and separated end-rotation secret deletion from deploy |
| `docs/30-workflows/completed-tasks/issue-555-audit-correlation-salt-rotation-automation/artifacts.json` | Added Phase 12 `main.md` output |
| `docs/30-workflows/completed-tasks/issue-555-audit-correlation-salt-rotation-automation/index.md` | Fixed 4-mode rotation and SSOT target wording |
| `docs/30-workflows/completed-tasks/issue-555-audit-correlation-salt-rotation-automation/outputs/phase-2/phase-2.md` | Replaced parallel `NormalizedAuditEvent bridge shape` model with existing `CorrelationKey` extension |
| `docs/30-workflows/completed-tasks/issue-555-audit-correlation-salt-rotation-automation/outputs/phase-7/phase-7.md` | Added legacy v1 adapter rule |
| `docs/30-workflows/completed-tasks/issue-555-audit-correlation-salt-rotation-automation/outputs/phase-8/phase-8.md` | Normalized 1Password path and staging end-rotation deploy behavior |
| `docs/30-workflows/completed-tasks/issue-555-audit-correlation-salt-rotation-automation/outputs/phase-9/phase-9.md` | Removed parallel secrets SSOT plan |
| `docs/30-workflows/completed-tasks/issue-555-audit-correlation-salt-rotation-automation/outputs/phase-11/*` | Added blocked runtime evidence placeholders |
| `docs/30-workflows/completed-tasks/issue-555-audit-correlation-salt-rotation-automation/outputs/phase-12/*.md` | Materialized strict Phase 12 outputs |
| `.claude/skills/aiworkflow-requirements/references/audit-correlation.md` | Added Issue #555 rotation bridge contract |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Added audit-correlation salt rotation secret policy |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added Issue #555 quick reference |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added Issue #555 resource map row |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Added Issue #555 active task row |
| `.claude/skills/aiworkflow-requirements/changelog/20260508-issue555-audit-correlation-salt-rotation.md` | Added changelog fragment |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-555-audit-correlation-salt-rotation-artifact-inventory.md` | Added artifact inventory |

## Validator record

Recorded validators:

- `apps/api/package.json` checked: package name is `@ubm-hyogo/api`; stale package-placeholder command replaced.
- Phase 12 strict output existence checked by file materialization in this cycle.
- `git status` / `git diff --stat` executed after edits in final verification.
- Focused audit-correlation tests passed: 5 files / 40 tests.
- Full `@ubm-hyogo/api` test passed: 128 files / 906 tests.
- API typecheck, dry-run, production mutation guard, grep gate, shell syntax, and shellcheck were rerun after review fixes.
- Full root `pnpm typecheck` is blocked by pre-existing apps/web missing `@sentry/nextjs` / `@sentry/cloudflare` type resolution, unrelated to Issue #555.
