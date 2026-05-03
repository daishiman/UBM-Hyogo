# Manual smoke log

Status: runtime-evidence-blocked.

No authenticated OAuth browser session was available during this improvement cycle. Manual smoke must execute after local/staging login is available:

1. Visit `/profile`, confirm `data-testid="sign-out-button"`, capture screenshot.
2. Visit `/admin`, confirm `data-testid="sign-out-button"`, capture screenshot.
3. Click sign-out and confirm `/login` redirect.
4. Fetch `/api/auth/session` and save unauthenticated JSON.
5. Save redacted cookie inventory and confirm session cookie removal or invalidation.
