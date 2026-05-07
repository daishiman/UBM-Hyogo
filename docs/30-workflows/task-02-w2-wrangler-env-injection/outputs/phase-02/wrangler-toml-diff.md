# wrangler.toml 差分（適用済）

## `[vars]`（top-level / production fallback）

```toml
[vars]
ENVIRONMENT = "production"
NEXT_PUBLIC_API_BASE_URL = "https://ubm-hyogo-api.daishimanju.workers.dev"
PUBLIC_API_BASE_URL = "https://ubm-hyogo-api.daishimanju.workers.dev"
INTERNAL_API_BASE_URL = "https://ubm-hyogo-api.daishimanju.workers.dev"
AUTH_URL = "https://ubm-hyogo-web.daishimanju.workers.dev"
SENTRY_ENVIRONMENT = "production"
SENTRY_TRACES_SAMPLE_RATE = "0.1"
```

## `[env.staging.vars]`

```toml
[env.staging.vars]
ENVIRONMENT = "staging"
NEXT_PUBLIC_API_BASE_URL = "https://ubm-hyogo-api-staging.daishimanju.workers.dev"
PUBLIC_API_BASE_URL = "https://ubm-hyogo-api-staging.daishimanju.workers.dev"
INTERNAL_API_BASE_URL = "https://ubm-hyogo-api-staging.daishimanju.workers.dev"
AUTH_URL = "https://ubm-hyogo-web-staging.daishimanju.workers.dev"
SENTRY_ENVIRONMENT = "staging"
SENTRY_TRACES_SAMPLE_RATE = "0.2"
```

## `[env.production.vars]`

```toml
[env.production.vars]
ENVIRONMENT = "production"
NEXT_PUBLIC_API_BASE_URL = "https://ubm-hyogo-api.daishimanju.workers.dev"
PUBLIC_API_BASE_URL = "https://ubm-hyogo-api.daishimanju.workers.dev"
INTERNAL_API_BASE_URL = "https://ubm-hyogo-api.daishimanju.workers.dev"
AUTH_URL = "https://ubm-hyogo-web.daishimanju.workers.dev"
SENTRY_ENVIRONMENT = "production"
SENTRY_TRACES_SAMPLE_RATE = "0.1"
```

## 不変

- `SENTRY_DSN_WEB` / `AUTH_SECRET` は wrangler.toml に**書かない**（Cloudflare Secrets + 1Password 正本）
- `D1` binding は `apps/web` 側に持たない（不変条件 #5）
- `[observability]` ブロックは task-03 owner（本タスクは現状の `enabled = true` 既定値を維持）
