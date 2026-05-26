# Web Response Security Headers

## Canonical Contract

`apps/web` emits browser-facing security headers from `apps/web/middleware.ts` via `apps/web/src/lib/security-headers.ts`.

| Header | Canonical behavior |
| --- | --- |
| `Content-Security-Policy-Report-Only` / `Content-Security-Policy` | Header name is selected by `CSP_MODE`: `report-only` emits report-only, `enforce` emits enforced CSP. Local/default and production stay `report-only`; staging is configured as `enforce`. |
| `Reporting-Endpoints` / `Report-To` | When a Sentry public/browser DSN is available, emit both `Reporting-Endpoints: csp-endpoint="<derived Sentry CSP security endpoint>"` and legacy `Report-To` JSON with the same group/url. The endpoint is derived from `NEXT_PUBLIC_SENTRY_DSN`; do not add a separate CSP report URL env. |
| CSP reporting directives | When a report endpoint is derived, append `report-to csp-endpoint` and legacy `report-uri <derived-url>`. All reporting headers/directives use the same `CSP_REPORT_GROUP` / endpoint source. |
| `Permissions-Policy` | Disable `accelerometer`, `camera`, `geolocation`, `gyroscope`, `magnetometer`, `microphone`, `payment`, `usb`. Do not emit `browsing-topics`. |
| Trusted Types | Do not emit `require-trusted-types-for` or `trusted-types` in this workflow. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |

## Env Boundary

Use `getSecurityHeaderEnv()` for CSP runtime configuration. It returns `{ cspMode, apiBaseUrl }` from `CSP_MODE` and `NEXT_PUBLIC_API_BASE_URL`, with `CSP_MODE` defaulting to `report-only`. Use `getPublicEnv().NEXT_PUBLIC_SENTRY_DSN` only to derive the Sentry CSP security endpoint. `NEXT_PUBLIC_API_ORIGIN` and a separate `NEXT_PUBLIC_SENTRY_CSP_REPORT_URL` are not current env contracts and must not be introduced for this purpose.

`apps/web/wrangler.toml` owns environment defaults:

| Environment | `CSP_MODE` |
| --- | --- |
| `[vars]` | `report-only` |
| `[env.staging.vars]` | `enforce` |
| `[env.production.vars]` | `report-only` |

## CSP Nonce Contract

Issue #871 / U-AWSHH-002 is implemented locally in `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/`.

Current `apps/web` nonce flow:

- `apps/web/middleware.ts` generates a fresh 16-byte base64 nonce for each request with Edge-compatible Web Crypto APIs.
- The same nonce is placed in request header `x-nonce`, request `Content-Security-Policy` for App Router nonce parsing, response `x-nonce`, and response CSP.
- `apps/web/src/lib/security-headers.ts` accepts `SecurityHeaderConfig.nonce?: string`.
- With nonce present, `script-src` is `script-src 'self' 'nonce-<n>' 'strict-dynamic'`.
- With nonce present, `style-src` and `style-src-elem` require `nonce-<n>`.
- `style-src-attr` is not emitted. React `style={...}` props are forbidden in CSP-relevant `apps/web/src` and `apps/web/app` TSX because they serialize to DOM `style="..."` attributes. The local invariant gate is `bash scripts/verify-no-inline-style.sh`, which searches `style={` rather than only object-literal `style={{` so prop-forwarding cases are not missed. `ImageResponse` OG image routes are excluded because they render PNG output, not browser DOM.
- Response mode remains `Content-Security-Policy-Report-Only`; enforce mode is still a separate user-gated workflow.
- Literal `'unsafe-inline'` must not appear in `apps/web/src`, `apps/web/middleware.ts`, or the middleware focused spec. The grep gate is `rg "'unsafe-inline'" apps/web/src apps/web/middleware.ts apps/web/__tests__/middleware.spec.ts`.

## User-gated Follow-ups

| ID | Boundary |
| --- | --- |
| U-AWSHH-001 | Implemented locally by `issue-869-csp-enforce-cutover`; production cutover remains a user-gated config/deploy decision after observation |
| U-AWSHH-002 | implemented locally by `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/`; staging/production verification remains user-gated |
| ~~U-AWSHH-003~~ | Consumed by `docs/30-workflows/completed-tasks/awshh-followup-003-csp-reporting-endpoints/` (Issue #868, implemented local / runtime receive pending) |
| U-AWSHH-004 | Equivalent `apps/api` response header hardening |
| ~~U-AWSHH-005~~ | Consumed by `docs/30-workflows/completed-tasks/issue-924-style-src-attr-retirement/` (Issue #924, local static pass / browser pending) |

## Workflow

Canonical parent workflow root: `docs/30-workflows/apps-web-security-headers-hardening/`

CSP enforce cutover workflow root: `docs/30-workflows/completed-tasks/issue-869-csp-enforce-cutover/`

Style attribute retirement workflow root: `docs/30-workflows/completed-tasks/issue-924-style-src-attr-retirement/`

Artifact inventory: `references/workflow-apps-web-security-headers-hardening-artifact-inventory.md`
