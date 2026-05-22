# Phase 12 Main

## Status

- workflow: `task-03-w2-par-sentry-workers-sdk-unify`
- state: `implemented-local / implementation / NON_VISUAL`
- Phase 11 state: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`

## Summary

Sentry SDK 分離の local implementation を Phase 1〜13 と strict outputs へ同期した。server は `@sentry/cloudflare` + `getEnv().SENTRY_DSN_WEB`、browser は `@sentry/nextjs` + `NEXT_PUBLIC_SENTRY_DSN` とし、`@sentry/nextjs` の Workers bundle 混入を grep gate で検出する。

## Boundary

実コード変更と local evidence は実施済み。staging deploy、Sentry dashboard event 受信は user approval 後の runtime evidence とし、runtime verified PASS は主張しない。
