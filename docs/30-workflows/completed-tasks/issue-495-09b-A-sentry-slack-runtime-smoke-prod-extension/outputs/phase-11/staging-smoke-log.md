# Staging Smoke Log Template

State: `RUNTIME_PENDING_USER_APPROVAL`

This file is intentionally template-only in the spec_created cycle. It exists to keep `artifacts.json` output paths materialized without claiming runtime PASS.

## Runtime Fields

- staging smoke timestamp (ISO8601): PENDING_RUNTIME_EVIDENCE
- target: both
- response.ok: PENDING_RUNTIME_EVIDENCE
- sentry.event_id (short 8 hex chars): PENDING_RUNTIME_EVIDENCE
- sentry.environment: staging
- slack.status: PENDING_RUNTIME_EVIDENCE
- slack.permalink (T*/C*/p* only): PENDING_RUNTIME_EVIDENCE
- slack.message prefix: [STAGING SMOKE]
- redaction grep 3-series hit count: PENDING_RUNTIME_EVIDENCE
- AC-1 to AC-5 PASS confirmed: PENDING_RUNTIME_EVIDENCE
