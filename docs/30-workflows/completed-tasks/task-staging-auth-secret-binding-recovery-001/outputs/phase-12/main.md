# Phase 12 Main: task-staging-auth-secret-binding-recovery-001

## Summary

`AUTH_SECRET` binding falsy が admin endpoint 全滅の真因であることを正本化し、同サイクルで local preventive implementation を完了した。

## Local Implementation

- `apps/api/src/middleware/require-admin.ts`: `UBM-AUTH-SECRET-MISSING` structured log helper.
- `apps/api/src/env.ts`: `AuthSecretEnvSchema` / `validateAuthSecretEnv()`.
- `scripts/smoke/runtime-attendance-provider.sh`: `auth-secret-binding-missing` reason persistence.
- `scripts/cf.sh`: `secret put` empty stdin guard and non-empty dry-run.

## Runtime Boundary

Staging secret reinjection, production verification, backend-ci rerun, commit, push, and PR remain user-gated.

