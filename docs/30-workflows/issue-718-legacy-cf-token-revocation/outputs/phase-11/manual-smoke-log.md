# Manual Smoke Log

Status: `runtime_pending`.

No Cloudflare, GitHub Secrets, or 1Password mutation was executed in this cycle.

Pre-approval local checks:

| Check | Result |
| --- | --- |
| `bash scripts/__tests__/workflow-env-scope.test.sh` | PASS |
| backend-ci legacy `with.apiToken` reference | 0 matches |
| UI screenshot | N/A (`NON_VISUAL`) |

Required before merge/deploy:

- Confirm `CF_TOKEN_D1_STAGING` and `CF_TOKEN_WORKERS_STAGING` exist in GitHub Environment `staging`.
- Confirm `CF_TOKEN_D1_PRODUCTION` and `CF_TOKEN_WORKERS_PRODUCTION` exist in GitHub Environment `production`.
- Record only secret names and command exit codes. Do not record values, suffixes, account IDs, token IDs, hashes, or 1Password URIs.
