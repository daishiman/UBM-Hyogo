# Secret List Check

## Purpose

Define the NON_VISUAL evidence required before staging or production Magic Link smoke runs.

## Expected staging name set

| Name | Kind | Required check |
| --- | --- | --- |
| `MAIL_PROVIDER_KEY` | Cloudflare Secret | Present in name list only |
| `MAIL_FROM_ADDRESS` | Cloudflare Variable / wrangler env var | Present by name |
| `AUTH_URL` | Cloudflare Variable / wrangler env var | Present by name |

## Stale names that must not be present

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `SITE_URL`

## Command template

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
```

Values are never printed, copied, hashed, or pasted into evidence. If an old name appears, downstream execution must delete the old name and reinsert the canonical name from 1Password through stdin.
