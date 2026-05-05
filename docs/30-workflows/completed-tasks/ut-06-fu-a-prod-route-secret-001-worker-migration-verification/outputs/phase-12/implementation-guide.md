# Implementation Guide

## Part 1: Middle School Level

Imagine a school changing which classroom handles visitors. Before opening the doors, someone must check that the signs, keys, and announcement speaker all point to the new classroom.

This workflow is that checklist for the web app's production Worker. It checks:

1. The correct Worker name is used.
2. Routes and custom domains point to the correct Worker.
3. The new Worker has the same secret key names it needs.
4. Logs and monitoring watch the correct Worker.

It does not open the doors, move DNS, reveal secret values, or delete the old classroom. Those actions need separate approval.

## Part 2: Technical Guide

### Scope

`apps/web` production Worker migration verification for OpenNext Workers.

### Target

| Field | Value |
| --- | --- |
| config | `apps/web/wrangler.toml` |
| environment | `production` |
| expected Worker | `ubm-hyogo-web-production` |
| command wrapper | `bash scripts/cf.sh` |

### Evidence Contract

```ts
type VerificationResult = "PASS" | "FAIL" | "TBD_APPROVED_VERIFICATION";

interface WorkerPreflightEvidence {
  workerName: "ubm-hyogo-web-production";
  routeTarget: VerificationResult;
  secretKeyParity: VerificationResult;
  observabilityTarget: VerificationResult;
  legacyWorkerDisposition: "retain" | "separate-approval-required";
}
```

### Phase 11 Evidence Files

This workflow is `NON_VISUAL`; Phase 11 completion means the evidence templates and runbook checks are present, not that production Cloudflare state was mutated or fully inspected.

| Evidence | File |
| --- | --- |
| Manual verification format | `outputs/phase-11/manual-verification-log.md` |
| Route / custom domain snapshot format | `outputs/phase-11/route-snapshot.md` |
| Secret key snapshot format | `outputs/phase-11/secret-keys-snapshot.md` |
| Tail sample format | `outputs/phase-11/tail-sample.md` |
| Legacy Worker disposition format | `outputs/phase-11/legacy-worker-disposition.md` |
| Runbook walkthrough | `outputs/phase-11/runbook-walkthrough.md` |
| Grep integrity check | `outputs/phase-11/grep-integrity.md` |

### Error Handling

| Error | Handling |
| --- | --- |
| direct `wrangler` required | stop and update wrapper/runbook |
| secret value visible | stop and redact; do not commit |
| route mismatch | block deploy approval |
| missing secret key | block deploy approval |
| old Worker deletion requested | require separate approval |

### Constants

| Name | Value |
| --- | --- |
| `EXPECTED_WORKER` | `ubm-hyogo-web-production` |
| `VISUAL_EVIDENCE` | `NON_VISUAL` |
| `TASK_TYPE` | `docs-only` |
