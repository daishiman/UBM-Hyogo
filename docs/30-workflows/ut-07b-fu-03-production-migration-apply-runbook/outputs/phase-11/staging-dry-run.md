# Phase 11 Staging Dry-Run

## Scope

This file records the intended NON_VISUAL staging dry-run gate for the runbook. No production command was executed in this task.

## Approved Command Shape

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
```

## Result

NOT_EXECUTED_IN_THIS_REVIEW. The command is intentionally preserved as a Phase 11 execution gate for the operator who has the required Cloudflare credentials. This document does not claim runtime PASS.

## Acceptance Boundary

- `migrations list` only
- `--env staging` only
- no `migrations apply`
- no `--env production`
- no raw Token / Account ID recording

## Follow-Up

If this runbook is executed as an operational task, paste the redacted command output and exit code here, then update `outputs/phase-12/phase12-task-spec-compliance-check.md` from `PASS_WITH_OPEN_RUNTIME_EVIDENCE` to `PASS`.
