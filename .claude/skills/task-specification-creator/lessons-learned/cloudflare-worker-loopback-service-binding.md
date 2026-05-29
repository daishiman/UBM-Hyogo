# Cloudflare Worker loopback 1042 and Service Binding task pattern

## Context

Cloudflare Workers in the same account can fail when one Worker calls another `*.workers.dev` Worker through raw external HTTP fetch. In UBM-Hyogo this appeared as HTTP 404 with body `error code: 1042` from admin Server Component `fetchAdmin`.

## Task-Spec Rule

When a Phase 1-13 implementation spec diagnoses Worker-to-Worker loopback or `error code: 1042`:

1. Check whether `wrangler.toml` already defines a Service Binding for the target Worker.
2. Prefer `env.<BINDING>.fetch()` as the primary staging/production transport.
3. Keep HTTP fallback only for local/test/Playwright paths with explicit base URL override.
4. Add focused tests for Service Binding, HTTP fallback, headers/body propagation, and bounded error-body propagation.
5. Treat staging deploy, authenticated smoke, wrangler tail, commit, push, and PR as user-gated evidence when credentials or runtime mutation are required.
6. Do not leave the workflow as docs-only if concrete `apps/` implementation targets are known and locally editable.

## Evidence Boundary

Local close-out may be `implemented_local_runtime_pending` when code and tests pass but staging runtime evidence is user-gated. Phase 11 must clearly mark runtime deploy/smoke/tail as `pending_user_gate`, not PASS.

## Reusable Acceptance Criteria

| AC | Requirement |
| --- | --- |
| AC-1 | Workers runtime uses Service Binding first. |
| AC-2 | test/Playwright with explicit base URL uses HTTP fallback. |
| AC-3 | auth/cookie/content-type/body semantics are identical across transports. |
| AC-4 | non-2xx response body is bounded and preserved for diagnosis. |
| AC-5 | runtime smoke remains user-gated until executed. |
