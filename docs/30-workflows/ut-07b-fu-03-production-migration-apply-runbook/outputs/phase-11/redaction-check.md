# Phase 11 Redaction Check

## Scope

This check verifies the newly materialized workflow outputs do not intentionally contain Cloudflare secret values or production apply result values.

## Redaction Rules

| Rule | Result |
| --- | --- |
| Do not record `CLOUDFLARE_API_TOKEN` values | PASS |
| Do not record Account ID values | PASS |
| Do not enable `set -x` / debug traces | PASS |
| Do not record production apply result rows, timestamps, or hashes as if executed | PASS |

## Known Allowlist

The workflow may contain variable names such as `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Variable names are allowed; concrete values are not.
