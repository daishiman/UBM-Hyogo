# Web Response Security Headers

## Canonical Contract

`apps/web` emits browser-facing security headers from `apps/web/middleware.ts` via `apps/web/src/lib/security-headers.ts`.

| Header | Canonical behavior |
| --- | --- |
| `Content-Security-Policy-Report-Only` | Initial rollout only. Enforce mode requires a later runtime observation workflow. |
| `Permissions-Policy` | Disable `accelerometer`, `camera`, `geolocation`, `gyroscope`, `magnetometer`, `microphone`, `payment`, `usb`. Do not emit `browsing-topics`. |
| Trusted Types | Do not emit `require-trusted-types-for` or `trusted-types` in this workflow. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |

## Env Boundary

Use `getPublicEnv().NEXT_PUBLIC_API_BASE_URL` for CSP `connect-src`. `NEXT_PUBLIC_API_ORIGIN` is not a current env contract and must not be introduced for this purpose.

## User-gated Follow-ups

| ID | Boundary |
| --- | --- |
| U-AWSHH-001 | CSP enforce switch after report-only observation |
| U-AWSHH-002 | nonce-based CSP hardening and removal of `'unsafe-inline'` |
| U-AWSHH-003 | Reporting-Endpoints / Report-To aggregation |
| U-AWSHH-004 | Equivalent `apps/api` response header hardening |

## Workflow

Canonical workflow root: `docs/30-workflows/apps-web-security-headers-hardening/`

Artifact inventory: `references/workflow-apps-web-security-headers-hardening-artifact-inventory.md`
