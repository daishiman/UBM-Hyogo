# Implementation Guide

## Part 1: 中学生レベル

学校の教室で、同じタブレットを「練習の日」「発表のリハーサル」「本番発表」で使うとします。タブレット本体は同じでも、つなぐ Wi-Fi や先生から配られる合言葉が違うと、見るページも変わります。

今回の作業は、アプリが置かれる場所ごとに正しい合言葉と行き先を受け取れるようにすることです。まず「なぜ必要か」というと、本番なのに練習用の行き先へつないでしまうと、利用者が正しい情報を見られないからです。そこで、場所ごとの設定表を作り、アプリはその設定表だけを見るようにします。

| 用語 | 日常語での言い換え |
| --- | --- |
| env | 場所ごとの合言葉メモ |
| binding | アプリにメモを渡す接続口 |
| staging | 本番前のリハーサル場所 |
| production | 本番場所 |
| secret | 他人に見せない合言葉 |

## Part 2: 技術者レベル

### TypeScript Contract

`apps/web/src/lib/env.ts` が `EnvSchema` / `Env` / `getEnv()` / `getPublicEnv()` を export する。`getEnv()` は Cloudflare Workers では `getCloudflareContext().env`、Node build/test では `process.env` を読み、同一 zod schema で parse する。

```ts
export function getEnv(rawEnv?: Record<string, unknown>): Env;
export function getPublicEnv(rawEnv?: Record<string, unknown>): Pick<Env, "ENVIRONMENT" | "NEXT_PUBLIC_API_BASE_URL">;
```

### Settings

`apps/web/wrangler.toml` は `[vars]`、`[env.staging.vars]`、`[env.production.vars]` に次の non-secret key を揃える。

| key | source |
| --- | --- |
| `ENVIRONMENT` | wrangler vars |
| `NEXT_PUBLIC_API_BASE_URL` | wrangler vars |
| `PUBLIC_API_BASE_URL` | wrangler vars |
| `INTERNAL_API_BASE_URL` | wrangler vars |
| `AUTH_URL` | wrangler vars |
| `SENTRY_ENVIRONMENT` | wrangler vars |
| `SENTRY_TRACES_SAMPLE_RATE` | wrangler vars |

`SENTRY_DSN_WEB` / `AUTH_SECRET` は Cloudflare Secrets / 1Password 正本であり、`wrangler.toml` に値を書かない。

### Error Handling

必須 key 欠落、URL 形式違反、`SENTRY_TRACES_SAMPLE_RATE` 範囲外は `ZodError` として fail fast する。`getPublicEnv()` も空文字 fallback を禁止し、public subset を parse する。

### Downstream

| task | interface |
| --- | --- |
| task-03 sentry-workers-sdk-unify | `getEnv().SENTRY_*` |
| task-04 window-guard-and-logger | `getEnv().ENVIRONMENT` |
| task-05 error-boundary-and-staging-smoke | `ZodError` boundary |
| task-18 regression smoke | `127.0.0.1:8888` grep zero gate |

