# task-01 Implementation Guide

Replace `cloudflare/wrangler-action@v3` Pages deploy with:

- `jdx/mise-action@v2`
- `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare`
- `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging|production`

Do not modify `apps/web/wrangler.toml` or `apps/web/package.json` in this task.
