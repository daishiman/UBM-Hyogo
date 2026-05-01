# Phase 8 Main

## Status

- workflow state: `spec_created`
- task type: `docs-only`
- visualEvidence: `NON_VISUAL`

## Summary

Phase 8 fixes the security and compliance posture: D1 export contains plaintext SQL with member PII, so R2 storage MUST apply SSE-S3 default encryption with SSE-C as the high-sensitivity escalation path (per `outputs/phase-09/secret-hygiene-checklist.md` of UT-06). Bucket access is private with anonymous GET returning 403; signed URL is the only download path. `wrangler login` OAuth tokens are forbidden — every credential is sourced from 1Password Environments through `scripts/cf.sh` (op run wrapper). Secret rotation cadence (R2 access key, 1Password reference) is fixed at 90 days minimum.

## Boundary

This phase is docs-only / spec_created. Bucket creation, IAM binding, KMS key provisioning, and the actual signed-URL distribution policy are deferred to UT-12 R2 storage (upstream) and the implementation PR after Phase 13.
