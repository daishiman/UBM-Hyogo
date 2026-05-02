# Phase 11 Manual Smoke Log (NON_VISUAL / planned)

## Status

| Item | Value |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Evidence state | planned template |
| Runtime execution | not executed |
| Reason | Cloudflare Token reissue / GitHub Secret update requires explicit user approval before external side effects |
| Secret handling | Token value, Account ID value, Token ID, and Dashboard URL are not recorded |

This file is the required Phase 11 evidence container. It is intentionally not a PASS log yet.
After user approval, replace the planned result cells with command date, masked output summary, and exit code.

## NON_VISUAL Declaration

UI/UX changes are out of scope. Screenshots are not required and image files must not be placed in `outputs/phase-11/`.
Alternative evidence is command output, exit code, and permission-name-only dashboard transcription.

## Static Checks

| TC | Command | Expected | Result |
| --- | --- | --- | --- |
| TC-S01 | `gh secret list --env staging \| grep CLOUDFLARE_API_TOKEN` | secret name appears, value absent | planned |
| TC-S02 | `gh secret list --env production \| grep CLOUDFLARE_API_TOKEN` | secret name appears, value absent | planned |
| TC-S03 | `rg -n "secrets\\.CLOUDFLARE_API_TOKEN" .github/workflows` | backend/web workflow references only | planned |
| TC-S04 | `rg -n "vars\\.CLOUDFLARE_API_TOKEN" .github/workflows` | no matches | planned |
| TC-S05 | token-like string scan over Phase 11/12 artifacts | no unmasked token-like secret value | planned |

## Runtime Checks

| TC | Command | Expected | Result |
| --- | --- | --- | --- |
| TC-R01 | `bash scripts/cf.sh whoami` | exit 0, no token value | planned |
| TC-R02 | `bash scripts/cf.sh d1 list` | exit 0 | planned |
| TC-R03 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` | exit 0 | planned |
| TC-R04 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` | exit 0 | planned |
| TC-R05 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | exit 0 | planned |

## Redaction Rule

Before pasting any command output, redact 40+ character token-like values as `***REDACTED***`.
Do not run with `set -x`, `wrangler --debug`, or `gh secret get`.

