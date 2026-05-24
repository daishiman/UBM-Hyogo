# Web Response Security Headers

## Canonical Contract

`apps/web` emits browser-facing security headers from `apps/web/middleware.ts` via `apps/web/src/lib/security-headers.ts`.

| Header | Canonical behavior |
| --- | --- |
| `Content-Security-Policy-Report-Only` / `Content-Security-Policy` | Header name is selected by `CSP_MODE`: `report-only` emits report-only, `enforce` emits enforced CSP. Local/default and production stay `report-only`; staging is configured as `enforce`. |
| `Permissions-Policy` | Disable `accelerometer`, `camera`, `geolocation`, `gyroscope`, `magnetometer`, `microphone`, `payment`, `usb`. Do not emit `browsing-topics`. |
| Trusted Types | Do not emit `require-trusted-types-for` or `trusted-types` in this workflow. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |

## Env Boundary

Use `getSecurityHeaderEnv()` for CSP runtime configuration. It returns `{ cspMode, apiBaseUrl }` from `CSP_MODE` and `NEXT_PUBLIC_API_BASE_URL`, with `CSP_MODE` defaulting to `report-only`. `NEXT_PUBLIC_API_ORIGIN` is not a current env contract and must not be introduced for this purpose.

`apps/web/wrangler.toml` owns environment defaults:

| Environment | `CSP_MODE` |
| --- | --- |
| `[vars]` | `report-only` |
| `[env.staging.vars]` | `enforce` |
| `[env.production.vars]` | `report-only` |

## User-gated Follow-ups

| ID | Boundary |
| --- | --- |
| U-AWSHH-001 | Implemented locally by `issue-869-csp-enforce-cutover`; production cutover remains a user-gated config/deploy decision after observation |
| U-AWSHH-002 | nonce-based CSP hardening and removal of `'unsafe-inline'` |
| U-AWSHH-003 | Reporting-Endpoints / Report-To aggregation |
| U-AWSHH-004 | Equivalent `apps/api` response header hardening |

## Workflow

Canonical parent workflow root: `docs/30-workflows/apps-web-security-headers-hardening/`

CSP enforce cutover workflow root: `docs/30-workflows/completed-tasks/issue-869-csp-enforce-cutover/`

Artifact inventory: `references/workflow-apps-web-security-headers-hardening-artifact-inventory.md`
