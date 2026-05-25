# CSP Violation Report Privacy Review

## Payload Fields

| Field | PII risk | Handling |
| --- | --- | --- |
| `document-uri` | May include member/profile path segments or query strings | Use Sentry data scrubbing for IDs and query strings before operational review |
| `referrer` | May include user navigation source | Scrub query strings and member identifiers |
| `blocked-uri` | Usually third-party origin / asset URL | Retain for CSP allowlist diagnosis |
| `source-file` / `line-number` | Application asset location | Retain for debugging; no direct user data expected |

## Retention / Storage

Reports are sent to Sentry only. The app does not add an `apps/api` receiver, D1 table, R2 bucket, or local persistence path for CSP violation payloads.

Sentry retention and inbound filters are the operational control points. Before CSP enforce rollout (U-AWSHH-001), review Sentry CSP issues for high-volume false positives and apply scrubbing/rate-limit rules as needed.

## Boundary

No secrets are written to evidence. The derived `sentry_key` is public DSN material; real project URLs should be redacted in shared logs when possible.
