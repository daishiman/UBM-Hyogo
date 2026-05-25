# 2026-05-24 issue-857 internal alert relay binding wiring

Registered `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/` as `implemented_local_evidence_captured / implementation / NON_VISUAL`.

The local implementation adds `API_INTERNAL_BASE_URL` to `apps/api/wrangler.toml` production and staging vars, documents the existing receiver-auth contract in `apps/api/src/env.ts`, adds a static TOML binding guard, and proves `CF_WEBHOOK_AUTH_SECRET` fallback in the sheets-auth healthcheck contract test.

The five struggle points are captured in `lessons-learned/lessons-learned-issue-857-internal-alert-relay-binding-wiring-2026-05.md` (L-857ALERT-001..005: wrangler `[vars]` non-inheritance, receiver-contract-first no extra token, optional-vs-deploy-required env, shared `CF_WEBHOOK_AUTH_SECRET` fallback trade-off, binding parity gate test) and linked from `indexes/resource-map.md`.

Issue #857 remains CLOSED and PR text must use `Refs #857`. Cloudflare secret presence, staging deploy/tail, controlled SA key invalidation, commit, push, and PR remain user-gated.
