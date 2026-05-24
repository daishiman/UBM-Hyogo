# Implementation Guide

## Part 1: 中学生レベル

管理画面は、運営の人が使う職員室のような場所です。職員室に入るには、どの建物へ行くかを書いた住所メモが必要です。

今回の不具合では、その住所メモを古い棚から探していました。Cloudflare Workers では設定メモは別の棚に置かれるため、古い棚を見ても見つからず、最後に「自分のパソコンの中へ行く」という間違った予備ルートに進んでいました。

修正では、設定メモを必ず正しい棚から取る `getEnv()` を使うようにし、間違った予備ルートを消しました。設定がないときは静かに別の場所へ行かず、すぐに失敗して原因を見つけやすくします。

| 用語 | 日常語での言い換え |
| --- | --- |
| env | 設定メモ |
| Cloudflare Workers | 世界中にある軽い実行場所 |
| Server Component | サーバー側で先に作る画面部品 |
| fallback | だめだったときの予備ルート |
| runtime smoke | 本当に動く場所での短い確認 |

## Part 2: 技術者レベル

### 背景

`apps/web/src/lib/admin/server-fetch.ts` は Server Component から admin API を呼ぶ helper である。Cloudflare Workers runtime では `process.env["INTERNAL_API_BASE_URL"]` が binding 正本ではないため、`getEnv()` 経由で `getCloudflareContext().env` を優先する必要がある。

### 実装ステップ

1. `server-fetch.ts` に `getEnv()` を import し、runtime base URL を `getEnv().INTERNAL_API_BASE_URL` から解決する。
2. `http://127.0.0.1:8787` fallback を削除する。
3. `EnvSchema` に `INTERNAL_AUTH_SECRET: z.string().min(1).optional()` を追加する。
4. focused Vitest で Cloudflare env binding 経由と missing base URL failure を固定する。

### API / Type Contract

```ts
export async function fetchAdmin<T>(
  path: string,
  opts?: AdminFetchOptions,
): Promise<T>;

export function getEnv(rawEnv?: RawEnv): Env;
```

`fetchAdmin` の public signature は不変。既存 API endpoint surface も不変。

### Error Handling

| Case | Behavior |
| --- | --- |
| `INTERNAL_API_BASE_URL` missing | `EnvSchema.parse` が fail し、localhost fallback は使わない |
| `INTERNAL_AUTH_SECRET` missing | schema parse は通す。header は空文字になり API 側 auth failure として扱われる |
| API non-2xx | `admin api <path> failed: <status>` を throw |

### Verification Commands

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts \
  apps/web/src/lib/__tests__/env.spec.ts
```

Broader `typecheck` / `lint` / build / staging runtime smoke は Phase 13 user-gated checks として残す。
