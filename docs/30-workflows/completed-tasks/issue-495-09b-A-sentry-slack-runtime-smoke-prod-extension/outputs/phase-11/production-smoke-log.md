# Production Smoke Log Template

State: `RUNTIME_PENDING_USER_APPROVAL`

This file is intentionally template-only in the spec_created cycle. It must not be treated as runtime PASS until G1-G4 are completed by explicit user approval.

## Runtime Fields

- G1 passed timestamp / approver: PENDING_RUNTIME_EVIDENCE
- G2 passed timestamp / approver: PENDING_RUNTIME_EVIDENCE
- G3 passed timestamp / approver: PENDING_RUNTIME_EVIDENCE
- production smoke timestamp: PENDING_RUNTIME_EVIDENCE
- target: both
- response.ok: PENDING_RUNTIME_EVIDENCE
- sentry.event_id (short 8 hex chars): PENDING_RUNTIME_EVIDENCE
- sentry.environment: production
- slack.status: PENDING_RUNTIME_EVIDENCE
- slack.permalink (T*/C*/p* only): PENDING_RUNTIME_EVIDENCE
- slack.channel id/name (redacted or non-secret name only): PENDING_RUNTIME_EVIDENCE
- slack.message prefix: [PRODUCTION SMOKE]
- redaction grep 3-series hit count: PENDING_RUNTIME_EVIDENCE
- AC-P1 to AC-P6 PASS confirmed: PENDING_RUNTIME_EVIDENCE
- G4 passed timestamp / approver: PENDING_RUNTIME_EVIDENCE
