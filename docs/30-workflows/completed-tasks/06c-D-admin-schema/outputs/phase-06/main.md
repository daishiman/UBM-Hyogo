# Phase 6 Output: Failure Modes

Status: SPEC_CREATED_BOUNDARY

Failure boundaries:

- Unauthenticated: 401.
- Non-admin: 403.
- Stable key collision: existing 07b alias workflow response contract.
- Back-fill continuation: HTTP 202 retryable continuation, not 5xx.
- Google Forms sync failure: sync route failure, not alias write success.
