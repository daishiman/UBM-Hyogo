# Phase 11 link checklist

## Status

`runtime_pending`: links are placeholders until implementation CI runs.

## Checklist

| Item | Required link or file | State |
| --- | --- | --- |
| baseline CI run | GitHub Actions `coverage-gate` run URL | `runtime_pending` |
| after CI run | GitHub Actions run URL with `coverage-gate-shard` and `coverage-gate` | `runtime_pending` |
| per-shard artifacts | `coverage-web`, `coverage-api-unit`, `coverage-api-d1`, `coverage-packages` | `runtime_pending` |
| merged artifact | `coverage-report-merged` | `runtime_pending` |
| coverage summary | `apps/*/coverage/coverage-summary.json` / `packages/*/coverage/coverage-summary.json` | `runtime_pending` |
