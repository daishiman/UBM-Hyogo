# Phase 4 Main

## Status

- workflow state: `spec_created`
- task type: `docs-only`
- visualEvidence: `NON_VISUAL`

## Summary

Phase 4 fixes the contract-level test propositions T1〜T7 covering daily cron success log (T1), R2 30-day rolling + monthly generations (T2), SSE/KMS/ACL configuration (T3), UT-08 alert dry-run on failure (T4), restore drill in two stages (T5 — walkthrough then real D1 restore), empty-export tolerance for the pre/post first migration cases (T6), and SHA-256 integrity verification on both put-time and restore-time (T7). The AC × T trace covers AC-1〜AC-9 with no gaps. GHA schedule and Cloudflare cron trigger routes are both addressed in T1 / T4.

## Boundary

This phase is docs-only / spec_created. No commands are executed; T1〜T7 only define expected values, red states, triage notes, and the downstream phase that will actually run them (Phase 5 / 6 / 11). `wrangler` direct invocation is forbidden — every check is routed through `bash scripts/cf.sh`.
