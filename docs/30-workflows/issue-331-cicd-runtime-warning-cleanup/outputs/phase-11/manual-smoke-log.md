# Phase 11 Manual Smoke Log

状態: user-gated runtime pending

## Local Static Smoke

| Check | Expected |
| --- | --- |
| `rg -n "pages deploy" .github/workflows/web-cd.yml` | 0 matches |
| `rg -n "scripts/cf.sh deploy --config apps/web/wrangler.toml" .github/workflows/web-cd.yml` | staging and production matches |
| `rg -n "^\\[vars\\]" apps/api/wrangler.toml` | 0 matches |

## Runtime Smoke

These commands require Cloudflare/GitHub runtime access and are user-gated:

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production --dry-run
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run
gh workflow run web-cd.yml --ref dev
gh run watch
```

## Secret Hygiene

No secret values were read, printed, or written during local implementation.
