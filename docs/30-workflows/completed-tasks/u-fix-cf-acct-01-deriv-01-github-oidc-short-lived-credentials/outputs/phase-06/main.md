# Phase 6 Output: 異常系検証

## Status

SPEC_CREATED

## Failure Paths

| Scenario | Handling |
| --- | --- |
| fork PR obtains OIDC token | stop rollout, remove trigger, require security review |
| provider token lifetime exceeds 3600 seconds | block cutover until provider cap is fixed |
| deploy workflow still references long-lived secret | block AC1 and update all real workflow files |
| secret appears in logs or evidence | stop, revoke exposed token, purge/redact evidence |
| rollback exceeds 24h | revoke emergency token and create incident follow-up |

