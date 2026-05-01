# Phase 5 Main

## Status

- workflow state: `spec_created`
- task type: `docs-only`
- visualEvidence: `NON_VISUAL`

## Summary

Phase 5 fixes the implementation runbook for the two cron adoption routes (GHA schedule primary + Cloudflare cron healthcheck), R2 bucket construction, lifecycle policy (30-day daily + monthly snapshot promotion), SSE encryption, the `bash scripts/cf.sh d1 export` wrapper sequence, UT-08 webhook integration, 1Password Environments as the secondary store, and the secret rotation checklist. Step-level Green conditions reference T1 / T2 / T3 / T6 / T7 from Phase 4.

## Boundary

The runbook is fixed at the spec level only. Actual GitHub Actions YAML, Cloudflare cron triggers `wrangler.toml`, R2 lifecycle JSON, the wrapper shell script, and the 1Password reference rollout are deferred to the post-Phase-13 implementation PR. `wrangler` direct invocation and `wrangler login` OAuth token persistence are forbidden in every step.
