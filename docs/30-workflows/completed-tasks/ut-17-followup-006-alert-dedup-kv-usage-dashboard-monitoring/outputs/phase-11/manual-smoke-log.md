# Manual Smoke Log

## Current Status

Runtime Cloudflare apply and Slack staging delivery smoke are pending user approval.

## Local Evidence Captured

- `mise exec -- pnpm test:alerts` passed for 52 tests / 7 files.
- `mise exec -- pnpm typecheck` was previously recorded as PASS in `non-visual-evidence.md`.
- `mise exec -- pnpm lint` was previously recorded as PASS in `non-visual-evidence.md`.

## User-Gated Evidence Not Captured

- `bash scripts/cf.sh alerts apply --yes`
- `mise exec -- pnpm cf:alerts:diff` after apply
- Slack staging message URL or screenshot for `/internal/alert-relay`

