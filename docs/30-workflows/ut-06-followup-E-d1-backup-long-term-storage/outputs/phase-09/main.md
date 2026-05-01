# Phase 9 Main

## Status

- workflow state: `spec_created`
- task type: `docs-only`
- visualEvidence: `NON_VISUAL`

## Summary

Phase 9 fixes the performance, cost, and free-tier operating envelope. RPO is daily (24h); RTO target is < 15 minutes via runbook-driven restore. R2 storage budget assumes ≤ 30 daily exports + 12 monthly snapshots, gzip-compressed, with object size projected from current D1 row count to stay well below the 10 GB R2 free-tier ceiling. The base case routes the schedule through GHA (≤ 5 min/day → ~150 min/month, well below the 2,000 min private free tier) with a Cloudflare cron healthcheck (1 of 5 free cron triggers consumed). UT-05-FU-003 monitoring is named as the upstream observer for the GHA workflow. The Cloudflare-cron-only fallback is documented for the case where GHA budget contention emerges.

## Boundary

This phase is docs-only / spec_created. Actual usage measurement, alert thresholds, and free-tier dashboards are deferred to UT-08 (alerting) and UT-05-FU-003 (GHA monitoring), with consumption tracked once the implementation PR ships.
