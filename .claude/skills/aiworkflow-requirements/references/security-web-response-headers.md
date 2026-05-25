# Web Response Security Headers

## Canonical Contract

`apps/web` emits browser-facing security headers from `apps/web/middleware.ts` via `apps/web/src/lib/security-headers.ts`.

| Header | Canonical behavior |
| --- | --- |
| `Content-Security-Policy-Report-Only` | Initial rollout uses report-only. Enforce mode requires a later runtime observation workflow. |
| `Reporting-Endpoints` / `Report-To` | When a Sentry public/browser DSN is available, emit both `Reporting-Endpoints: csp-endpoint="<derived Sentry CSP security endpoint>"` and legacy `Report-To` JSON with the same group/url. The endpoint is derived from `NEXT_PUBLIC_SENTRY_DSN`; do not add a separate CSP report URL env. |
| CSP reporting directives | When a report endpoint is derived, append `report-to csp-endpoint` and legacy `report-uri <derived-url>`. All reporting headers/directives use the same `CSP_REPORT_GROUP` / endpoint source. |
| `Permissions-Policy` | Disable `accelerometer`, `camera`, `geolocation`, `gyroscope`, `magnetometer`, `microphone`, `payment`, `usb`. Do not emit `browsing-topics`. |
| Trusted Types | Do not emit `require-trusted-types-for` or `trusted-types` in this workflow. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |

## Env Boundary

Use `getPublicEnv().NEXT_PUBLIC_API_BASE_URL` for CSP `connect-src`. Use `getPublicEnv().NEXT_PUBLIC_SENTRY_DSN` only to derive the Sentry CSP security endpoint. `NEXT_PUBLIC_API_ORIGIN` and a separate `NEXT_PUBLIC_SENTRY_CSP_REPORT_URL` are not current env contracts and must not be introduced for this purpose.

## User-gated Follow-ups

| ID | Boundary |
| --- | --- |
| U-AWSHH-001 | CSP enforce switch after report-only observation |
| U-AWSHH-002 | nonce-based CSP hardening and removal of `'unsafe-inline'` |
| ~~U-AWSHH-003~~ | Consumed by `docs/30-workflows/completed-tasks/awshh-followup-003-csp-reporting-endpoints/` (Issue #868, implemented local / runtime receive pending) |
| U-AWSHH-004 | Equivalent `apps/api` response header hardening |

## Workflow

Canonical workflow root: `docs/30-workflows/apps-web-security-headers-hardening/`

Artifact inventory: `references/workflow-apps-web-security-headers-hardening-artifact-inventory.md`
