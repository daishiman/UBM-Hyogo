# Phase 7: Coverage

## Coverage Assessment

The defect surface is a transport selector in `fetchAdmin()`. The added tests cover:

- binding-present production-like path,
- binding-absent fallback path,
- test override fallback path,
- request init parity,
- non-2xx error body propagation.

## Residual Runtime Risk

Cloudflare service binding behavior must still be validated on staging after deploy. That action is user-gated by the specification and remains outside local implementation.
