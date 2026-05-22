# Implementation guide

## Part 1: 中学生にもわかる説明

学校の文化祭で看板を作るとき、当日の教室に貼る紙とは別に、前の日に印刷所へ渡す原稿が必要になる。この問題では、Cloudflare に置く本番用の設定はあったが、印刷所にあたる「build」の時間にはその設定が渡っていなかった。

そのため、build は「サイトの住所がわからない」と言って止まっていた。今回の修正では、build の手順にも同じ住所を渡す。実際に公開された後に使う設定はこれまでどおり Cloudflare の設定を使うので、サイトの動き方は変えない。

もう一つの問題は、Cloudflare に入るための鍵が古いか、権限が足りない可能性があること。これはコードでは直せないため、持ち主が新しい鍵を作って GitHub に入れ直す必要がある。手順は runbook にまとめた。

## Part 2: 技術者向け詳細

### Implemented local files

| File | Change |
| --- | --- |
| `.github/workflows/web-cd.yml` | Added step-scoped build-time env to staging / production `Build web app (OpenNext Workers bundle)` steps |
| `apps/web/src/lib/__tests__/build-time-env.spec.ts` | Added zod contract tests for staging / production build-time env and a drift check between `apps/web/wrangler.toml` and `.github/workflows/web-cd.yml` |
| `apps/web/wrangler.toml` | Aligned production `AUTH_URL` to the canonical production Workers hostname `ubm-hyogo-web-production.daishimanju.workers.dev` (top-level `[vars]` and `[env.production.vars]`) |
| `apps/web/src/lib/seo/site-metadata.ts` | Updated `SITE_URL_MAP.production` to the canonical production hostname so SEO metadata, OGP and sitemap absolute URLs match the deployed Worker |
| `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` | Updated production `getSiteUrl()` expectation to the new canonical hostname |

### Contract

`getPublicEnv(rawEnv)` requires:

```ts
type PublicBuildEnv = {
  ENVIRONMENT: "staging" | "production";
  NEXT_PUBLIC_API_BASE_URL: string;
};
```

`getEnv(rawEnv)` additionally requires `PUBLIC_API_BASE_URL`, `INTERNAL_API_BASE_URL`, `AUTH_URL`, `SENTRY_ENVIRONMENT`, and `SENTRY_TRACES_SAMPLE_RATE`. The workflow injects these from `apps/web/wrangler.toml` to avoid build-time `EnvSchema.parse` failures without adding application fallback code.

### User-gated external operations

Run `outputs/task-02-cf-api-token-d1-permission-restore/runbook.md` before claiming runtime completion:

1. Create or rotate Cloudflare tokens for staging and production.
2. Store values in 1Password.
3. Update GitHub Environment secrets with `gh secret set CLOUDFLARE_API_TOKEN --env staging` and `--env production`.
4. Push to `dev` and capture `web-cd / deploy-staging` plus `backend-ci / deploy-staging` evidence.
