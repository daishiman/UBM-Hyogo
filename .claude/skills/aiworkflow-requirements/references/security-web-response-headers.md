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

## CSP Nonce Contract

Issue #871 / U-AWSHH-002 is implemented locally in `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/`.

Current `apps/web` nonce flow:

- `apps/web/middleware.ts` generates a fresh 16-byte base64 nonce for each request with Edge-compatible Web Crypto APIs.
- The same nonce is placed in request header `x-nonce`, request `Content-Security-Policy` for App Router nonce parsing, response `x-nonce`, and response CSP.
- `apps/web/src/lib/security-headers.ts` accepts `SecurityHeaderConfig.nonce?: string`.
- With nonce present, `script-src` is `script-src 'self' 'nonce-<n>' 'strict-dynamic'`.
- With nonce present, `style-src` and `style-src-elem` require `nonce-<n>`.
- Existing React `style={{ ... }}` usage remains compatible through explicit `style-src-attr` separation. This is a transitional boundary, not an enforce-mode completion claim.
- Response mode remains `Content-Security-Policy-Report-Only`; enforce mode is still a separate user-gated workflow.
- Literal `'unsafe-inline'` must not appear in `apps/web/src`, `apps/web/middleware.ts`, or the middleware focused spec. The grep gate is `rg "'unsafe-inline'" apps/web/src apps/web/middleware.ts apps/web/__tests__/middleware.spec.ts`.

## User-gated Follow-ups

| ID | Boundary |
| --- | --- |
| U-AWSHH-001 | CSP enforce switch after report-only observation |
| U-AWSHH-002 | implemented locally by `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/`; staging/production verification remains user-gated |
| U-AWSHH-003 | Reporting-Endpoints / Report-To aggregation |
| U-AWSHH-004 | Equivalent `apps/api` response header hardening |

## Workflow

Canonical workflow root: `docs/30-workflows/apps-web-security-headers-hardening/`

Artifact inventory: `references/workflow-apps-web-security-headers-hardening-artifact-inventory.md`
