# user-approval-log

判定行: `blocked_until_user_approval`

## Boundary

This file is a placeholder evidence ledger for the 09c-A production execution operation. It is not approval evidence and must not be treated as runtime PASS.

## Gates

| Gate | Subject | Status | Evidence rule |
| --- | --- | --- | --- |
| Phase 10 | final GO review | `blocked_until_user_approval` | Record approver, timestamp, target commit, and explicit GO/NO-GO text before mutation entry |
| Phase 11-A | D1 migration apply | `blocked_until_user_approval` | Record approval before `bash scripts/cf.sh d1 migrations apply ...` |
| Phase 11-B | API production deploy | `blocked_until_user_approval` | Record approval before API deploy |
| Phase 11-C | Web production deploy | `blocked_until_user_approval` | Record approval before Web deploy |
| Phase 11-D | release tag push | `blocked_until_user_approval` | Record approval before tag creation and push |
| Phase 13 | PR creation | `blocked_until_user_approval` | Separate from production approval; does not authorize mutation |

## Redaction

Do not store secret values, session tokens, Cloudflare token values, or full account/database/version IDs.
