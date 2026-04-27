# Phase 2 Architecture

## Decision

Use a minimal Google OAuth 2.0 Authorization Code Flow with PKCE in `apps/web`.
`apps/api` does not own this login flow in the MVP; API authorization remains a downstream consumer of the signed admin session.

## Runtime Boundary

| Component | Responsibility |
| --- | --- |
| `apps/web/src/app/api/auth/login/route.ts` | Generate `state`, `code_verifier`, and safe `next`; store temporary HttpOnly cookies; redirect to Google |
| `apps/web/src/app/api/auth/callback/google/route.ts` | Validate `state`, exchange code, fetch user identity, check allowlist, issue session cookie |
| `apps/web/src/app/api/auth/logout/route.ts` | Expire session and temporary auth cookies |
| `apps/web/middleware.ts` | Gate `/admin/*` by verifying the signed session cookie |
| `apps/api` | No direct OAuth callback ownership for this task |

## Security Shape

- PKCE uses `S256`.
- `state` is single use, stored in an HttpOnly temporary cookie, and cleared on callback.
- `next` is bound to `state` and must be a relative `/admin` path.
- Session JWT claims are intentionally small: `sub`, `email`, `role`, `iat`, `exp`.
- No D1, KV, Auth.js, or server-side session store is introduced in this spec-created MVP.

## Canonical References

- `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md`
- `.claude/skills/aiworkflow-requirements/references/security-principles.md`
- `.claude/skills/aiworkflow-requirements/references/csrf-state-parameter.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
