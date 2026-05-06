# Phase 11 Link Checklist

## Status

RUNTIME_PENDING

## Required Links

| Category | Path / URL Placeholder | Status |
| --- | --- | --- |
| Workflow run staging web | `outputs/phase-11/evidence/workflow-run/staging-run-url.txt` | PENDING_RUNTIME_EVIDENCE |
| Workflow run staging api | `outputs/phase-11/evidence/workflow-run/staging-run-url.txt` | PENDING_RUNTIME_EVIDENCE |
| Workflow run production web | `outputs/phase-11/evidence/workflow-run/production-run-url.txt` | PENDING_RUNTIME_EVIDENCE |
| Workflow run production api | `outputs/phase-11/evidence/workflow-run/production-run-url.txt` | PENDING_RUNTIME_EVIDENCE |
| D1 migration verify impact | `.github/workflows/d1-migration-verify.yml` grep / run evidence | PENDING_RUNTIME_EVIDENCE |
| Token verification | `outputs/phase-11/evidence/token-verify/*.json` | PENDING_RUNTIME_EVIDENCE |
| Scope verification | `outputs/phase-11/evidence/scope/cf-token-scope.json` | PENDING_RUNTIME_EVIDENCE |
| Audit correlation | `outputs/phase-11/evidence/audit-log/oidc-cf-audit-correlation.json` | PENDING_RUNTIME_EVIDENCE |
| Secret hygiene | `outputs/phase-11/evidence/secret-hygiene/grep-zero-match.log` | PENDING_RUNTIME_EVIDENCE |
| Approval gates | `outputs/phase-11/evidence/approval-gates.log` | PENDING_RUNTIME_EVIDENCE |

## Screenshot Rule

`visualEvidence=NON_VISUAL`; screenshots are not required. Runtime verification is represented by sanitized command output, workflow links, audit correlation, and manual smoke logs.
