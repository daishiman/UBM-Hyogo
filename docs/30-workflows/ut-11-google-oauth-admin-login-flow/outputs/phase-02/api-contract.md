# Phase 2 API Contract

## `GET /api/auth/login`

Starts Google OAuth.

### Query

| Name | Rule |
| --- | --- |
| `next` | Optional. Must be a relative URL under `/admin`; defaults to `/admin`. External URLs, protocol-relative URLs, control characters, and non-admin paths are rejected or normalized to `/admin`. |

### Behavior

1. Generate `state` and PKCE `code_verifier`.
2. Store `state`, `code_verifier`, and normalized `next` in temporary HttpOnly cookies with 10 minute TTL.
3. Redirect to Google with `response_type=code`, `scope=openid email`, `code_challenge_method=S256`, and `prompt=select_account`.

## `GET /api/auth/callback/google`

Completes Google OAuth.

### Query

| Name | Rule |
| --- | --- |
| `code` | Required authorization code |
| `state` | Required; must match the temporary cookie |
| `error` | Optional Google error; terminates flow without token exchange |

### Responses

| Case | Response |
| --- | --- |
| Valid allowlisted admin | `302` to bound `next`, with signed session cookie |
| State mismatch or missing temp cookie | `400` |
| Google token/userinfo failure | `502` |
| Email missing or unverified | `303` to `/login?error=email_not_verified` |
| Email outside allowlist | `303` to `/login?error=not_in_allowlist` |

Temporary cookies are cleared on every terminal callback path.

## `POST /api/auth/logout`

Expires the session cookie and redirects to `/login`.

## Cookie Attributes

| Cookie | Attributes |
| --- | --- |
| `admin_session` | `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400` |
| `oauth_state` | `HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=600` |
| `oauth_code_verifier` | `HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=600` |
| `oauth_next` | `HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=600` |

In local HTTP development, `Secure` may be disabled only when `AUTH_REDIRECT_URI` uses `http://localhost`.
