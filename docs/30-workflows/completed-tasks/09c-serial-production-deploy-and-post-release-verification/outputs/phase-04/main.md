# Phase 4 Output: Test Strategy Summary

Status: spec_created  
Runtime evidence: pending_user_approval

## Strategy

The verification suite is divided into four layers: pre-deploy, deploy-time, production smoke, and post-release. Runtime pass/fail results must be captured in Phase 11; this file only defines the template.

| Layer | Purpose | Runtime status |
| --- | --- | --- |
| Pre-deploy | Confirm upstream completion, main readiness, clean tree, and production D1 backup. | TBD at execution |
| Deploy-time | Confirm migrations, secrets, and API / web production deploy commands. | TBD at execution |
| Smoke | Confirm public, auth, admin, and sync behavior on production URLs. | TBD at execution |
| Post-release | Confirm release tag, incident sharing, 24h metrics, and invariants. | TBD at execution |

## Coverage

| AC range | Covered by |
| --- | --- |
| AC-1 to AC-3 | Deploy-time suite D-1 to D-5 |
| AC-4 to AC-5 | Smoke suite S-1 to S-5 |
| AC-6 to AC-8 | Post-release suite R-1 to R-5 |
| AC-9 to AC-12 | Smoke and post-release invariant checks S-3, R-6, R-7 |

## Failure Routing

| Failing suite | Return path |
| --- | --- |
| D1 migration | schema / D1 implementation task |
| Secrets | infrastructure secret registration task |
| API / web deploy | owning implementation or deployment task |
| Smoke route/authz | owning UI / API / auth task |
| Manual sync | sync implementation task |
| Release tag / share evidence | 09c runbook or execution correction |
| 24h metric breach | cron frequency, query optimization, or incident runbook path |
