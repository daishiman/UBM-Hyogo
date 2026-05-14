# 2026-05-11 task-10 follow-up 001 OpenNext esbuild mismatch

`docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/` was closed as `implemented-local / implementation / NON_VISUAL / runtime_evidence_captured`.

## Changes

- Added root `pnpm.overrides.esbuild = "0.25.4"`.
- Regenerated `pnpm-lock.yaml` so the effective esbuild host and platform binary versions converge.
- Preserved `scripts/cf.sh` behavior and added a recovery note for future OpenNext mismatch cases.
- Captured `build:cloudflare`, `pnpm why esbuild`, platform binary scan, API build, root typecheck/lint, web checks, and wrapper smoke evidence.
- Unblocked task-10 follow-up 002 runtime screenshot / axe capture in the same cycle.

Commit, push, and PR remain user-gated.

