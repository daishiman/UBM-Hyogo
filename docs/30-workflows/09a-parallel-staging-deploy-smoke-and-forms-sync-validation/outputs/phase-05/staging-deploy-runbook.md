# Staging Deploy Runbook

## Steps

1. Confirm dev branch CI is green.
2. Confirm staging Cloudflare projects and API Worker bindings.
3. Confirm required GitHub environment secrets without printing values.
4. Trigger or observe staging deploy.
5. Check web/API staging URLs.
6. Run schema sync.
7. Run response sync.
8. Dump `sync_jobs`.
9. Run Playwright staging profile.
10. Capture manual route smoke.
11. Record free-tier and boundary checks.

## PASS Rule

Every command must include actual result, timestamp, and environment. Missing execution is `NOT_EXECUTED`, not PASS.
