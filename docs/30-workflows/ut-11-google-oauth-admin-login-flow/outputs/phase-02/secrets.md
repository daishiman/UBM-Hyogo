# Phase 2 Secrets And Vars

## Reused Secrets

| Name | Owner | Note |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | 01c Google Workspace bootstrap | Reused for admin OAuth client |
| `GOOGLE_CLIENT_SECRET` | 01c Google Workspace bootstrap | Reused for token exchange |

## Introduced Secrets

| Name | Rule |
| --- | --- |
| `SESSION_SECRET` | Minimum 32 bytes of entropy; rotating it expires all active admin sessions |
| `ADMIN_EMAIL_ALLOWLIST` | Comma-separated admin emails; trim and lowercase before compare |

## Introduced Vars

| Name | Rule |
| --- | --- |
| `AUTH_REDIRECT_URI` | Environment-specific callback URL, for example `https://staging.example.com/api/auth/callback/google` |

## Logging Prohibitions

Do not log authorization `code`, `code_verifier`, `state`, access tokens, ID tokens, session JWTs, or raw allowlist contents.
