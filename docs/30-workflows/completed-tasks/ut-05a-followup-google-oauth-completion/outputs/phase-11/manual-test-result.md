# Phase 11 Manual Test Result

Status: partial_runtime_execution

Stage A was partially executed on staging. OAuth provider configuration reached Google and the callback returned to the app, but session issuance is blocked by member identity resolution (`/login?gate=unregistered`).

| Stage | Result | Notes |
| --- | --- | --- |
| A | BLOCKED / PARTIAL | M-01 and M-02 passed. M-03 reached callback but ended at `/login?gate=unregistered`; M-04/M-05 skipped because no session cookie/session JSON was issued. |
| B | pending | Verification submission not executed in this spec-created pass |
| C | pending | External login smoke not executed in this spec-created pass |

## Stage A Runtime Notes

- Staging web URL: `https://ubm-hyogo-web-staging.daishimanju.workers.dev`
- Secrets corrected for web staging: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- Correct 1Password retrieval pattern: `op item get ubm-hyogo-env --vault Employee --fields label=<FIELD> --reveal`.
- Current blocker: staging API health is OK, and the missing `member_identities` table / `members` view were repaired, but `member_identities` still has `0` rows. Run the Google Forms response sync (`POST /admin/sync/responses?fullSync=true`) and then verify the tested Google email exists in `member_identities.response_email` with `member_status.rules_consent = 'consented'`.
