# Phase 5 Runbook

## 1. Google OAuth Client

Register exactly these callback classes:

| Environment | Callback |
| --- | --- |
| local | `http://localhost:8788/api/auth/callback/google` |
| staging | fixed staging URL only |
| production | production URL only |

Preview deployment URLs are not registered as OAuth redirect URIs.

## 2. Cloudflare Secrets

```bash
wrangler secret put SESSION_SECRET
wrangler secret put ADMIN_EMAIL_ALLOWLIST
wrangler secret list
```

`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are reused from the Google Workspace bootstrap task and are not renamed for UT-03.

## 3. Local Vars

Create `apps/web/.dev.vars` outside git tracking:

```dotenv
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SESSION_SECRET=...
ADMIN_EMAIL_ALLOWLIST=admin@example.com
AUTH_REDIRECT_URI=http://localhost:8788/api/auth/callback/google
```

Verify `.dev.vars` is ignored before running the flow.

## 4. Local Smoke

```bash
pnpm --filter web build
pnpm --filter web preview
```

Use the actual local Workers-compatible URL emitted by the command. If the project uses `wrangler pages dev` for local OpenNext preview, keep the callback URL consistent with the listening port.

## 5. Admin Changes

| Operation | Steps |
| --- | --- |
| Add admin | Update `ADMIN_EMAIL_ALLOWLIST`, redeploy, run login smoke |
| Remove admin | Update allowlist, rotate `SESSION_SECRET` if immediate revocation is required, redeploy, run logout/login smoke |
| Emergency revoke all | Rotate `SESSION_SECRET`, redeploy, verify existing sessions are rejected |
