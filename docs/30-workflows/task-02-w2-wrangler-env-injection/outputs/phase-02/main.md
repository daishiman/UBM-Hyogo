# Phase 2 — 設計

## 設計サマリ

`apps/web/src/lib/env.ts` を単一の env 入口として導入。Workers ランタイムでは `getCloudflareContext().env` を、Node（build / test / next dev）では `process.env` を読む二経路 + 共通 zod parse。`wrangler.toml` の 3 環境 `[vars]` セクションを正本とし、secret は wrangler.toml に書かない。

詳細は次の補助ドキュメントに分割:

- `wrangler-toml-diff.md`
- `env-ts-signature.md`
- `changed-files.md`

## 公開 API

```ts
export const EnvSchema: ZodObject;
export type Env = z.infer<typeof EnvSchema>;
export function readRawEnv(): Record<string, unknown>;
export function getEnv(rawEnv?: Record<string, unknown>): Env;
export function getPublicEnv(rawEnv?: Record<string, unknown>): Pick<Env, "ENVIRONMENT" | "NEXT_PUBLIC_API_BASE_URL">;
```

## 設計決定

1. `getCloudflareContext()` は import 失敗・context 未注入時に throw するため `try/catch` で safe degrade。
2. `SENTRY_TRACES_SAMPLE_RATE` は wrangler 由来で文字列、Node では数値の可能性があるため `z.coerce.number()` で吸収。
3. `SENTRY_DSN_WEB` / `AUTH_SECRET` は optional。runtime 側 secret binding 未設定でも `getEnv()` は parse 通過。
4. `getPublicEnv()` は `EnvSchema.pick(...)` で部分集合化し、誤って secret を expose しない。
