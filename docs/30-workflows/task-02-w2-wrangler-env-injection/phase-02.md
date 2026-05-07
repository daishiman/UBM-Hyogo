# Phase 02 — 設計

実装区分: 実装仕様書（CONST_004 デフォルト適用）

## 1. 環境別キー一覧（元タスク §4 再掲）

| key | local (.dev.vars) | staging | production | 公開区分 |
|-----|------------------|---------|------------|---------|
| `ENVIRONMENT` | `local` | `staging` | `production` | non-secret |
| `NEXT_PUBLIC_API_BASE_URL` | `http://127.0.0.1:8787` | `https://ubm-hyogo-api-staging.daishimanju.workers.dev` | `https://ubm-hyogo-api.daishimanju.workers.dev` | public |
| `PUBLIC_API_BASE_URL` | 同上 | 同上 | 同上 | non-secret |
| `INTERNAL_API_BASE_URL` | 同上 | 同上 | 同上 | non-secret |
| `AUTH_URL` | `http://127.0.0.1:3000` | `https://web-staging.example.com` | `https://web.example.com` | non-secret |
| `SENTRY_DSN_WEB` | `op://Personal/UBM Sentry Dev/dsn` | Cloudflare Secret | Cloudflare Secret | secret |
| `SENTRY_ENVIRONMENT` | `local` | `staging` | `production` | non-secret |
| `SENTRY_TRACES_SAMPLE_RATE` | `1.0` | `0.2` | `0.1` | non-secret |
| `AUTH_SECRET` | `op://Personal/UBM Auth/secret` | Cloudflare Secret | Cloudflare Secret | secret |

## 2. wrangler.toml 差分（元タスク §5 原文再掲）

```toml
# apps/web/wrangler.toml （差分のみ抜粋）

[vars]
ENVIRONMENT = "production"
# NEXT_PUBLIC_* は build 時に bundler が解決する想定。Workers ランタイムからも参照可能とする。
NEXT_PUBLIC_API_BASE_URL = "https://ubm-hyogo-api.daishimanju.workers.dev"
PUBLIC_API_BASE_URL = "https://ubm-hyogo-api.daishimanju.workers.dev"
INTERNAL_API_BASE_URL = "https://ubm-hyogo-api.daishimanju.workers.dev"
AUTH_URL = "https://ubm-hyogo-web.daishimanju.workers.dev"
SENTRY_ENVIRONMENT = "production"
SENTRY_TRACES_SAMPLE_RATE = "0.1"

[env.staging.vars]
ENVIRONMENT = "staging"
PUBLIC_API_BASE_URL = "https://ubm-hyogo-api-staging.daishimanju.workers.dev"
INTERNAL_API_BASE_URL = "https://ubm-hyogo-api-staging.daishimanju.workers.dev"
NEXT_PUBLIC_API_BASE_URL = "https://ubm-hyogo-api-staging.daishimanju.workers.dev"
SENTRY_ENVIRONMENT = "staging"
SENTRY_TRACES_SAMPLE_RATE = "0.2"

[env.production.vars]
ENVIRONMENT = "production"
PUBLIC_API_BASE_URL = "https://ubm-hyogo-api.daishimanju.workers.dev"
INTERNAL_API_BASE_URL = "https://ubm-hyogo-api.daishimanju.workers.dev"
NEXT_PUBLIC_API_BASE_URL = "https://ubm-hyogo-api.daishimanju.workers.dev"
SENTRY_ENVIRONMENT = "production"
SENTRY_TRACES_SAMPLE_RATE = "0.1"
```

> Cloudflare Secrets（`SENTRY_DSN_WEB` / `AUTH_SECRET`）は wrangler.toml に書かない。`bash scripts/cf.sh secret put SENTRY_DSN_WEB --config apps/web/wrangler.toml --env production` 等で投入し、ランタイム読み出しのみ行う。

## 3. `.dev.vars.example`（元タスク §6 原文再掲）

```ini
# apps/web/.dev.vars.example
# このファイルはコミットする。実値は書かない。
# 利用法: cp .dev.vars.example .dev.vars && op inject -i .dev.vars -o .dev.vars.local

ENVIRONMENT=local
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787
PUBLIC_API_BASE_URL=http://127.0.0.1:8787
INTERNAL_API_BASE_URL=http://127.0.0.1:8787
AUTH_URL=http://127.0.0.1:3000
SENTRY_ENVIRONMENT=local
SENTRY_TRACES_SAMPLE_RATE=1.0

# secret（op 参照）
SENTRY_DSN_WEB=op://Personal/UBM Sentry Dev/dsn
AUTH_SECRET=op://Personal/UBM Auth/secret
```

## 4. 関数 / 型シグネチャ（元タスク §7 原文再掲）

### 4.1 `apps/web/src/lib/env.ts`

```ts
import { z } from "zod";

/** Cloudflare Workers ランタイムから渡る env binding の正本スキーマ */
export const EnvSchema = z.object({
  ENVIRONMENT: z.enum(["local", "staging", "production"]),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  PUBLIC_API_BASE_URL: z.string().url(),
  INTERNAL_API_BASE_URL: z.string().url(),
  AUTH_URL: z.string().url(),
  SENTRY_DSN_WEB: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.enum(["local", "staging", "production"]),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1),
  AUTH_SECRET: z.string().min(16).optional(),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Cloudflare Workers / Next.js (RSC / Server Action / Edge / Node) いずれの
 * ランタイムでも安全に env を取得する。
 *
 * - Workers: `getCloudflareContext().env`
 * - Node (build / test): `process.env`
 *
 * @throws {z.ZodError} 必須キー欠落時
 */
export function getEnv(): Env {
  const raw = readRawEnv();
  return EnvSchema.parse(raw);
}

/** クライアント bundle に焼き込まれる public env 用ヘルパ（NEXT_PUBLIC_* のみ） */
export function getPublicEnv(): Pick<Env, "NEXT_PUBLIC_API_BASE_URL" | "ENVIRONMENT"> {
  return EnvSchema.pick({
    NEXT_PUBLIC_API_BASE_URL: true,
    ENVIRONMENT: true,
  }).parse(readRawEnv());
}

function readRawEnv(): Record<string, unknown> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext?.();
    if (ctx?.env) return ctx.env as Record<string, unknown>;
  } catch {
    /* fallthrough to process.env */
  }
  return process.env as Record<string, unknown>;
}
```

### 4.2 `apps/web/next.config.ts` 最小編集

`NEXT_PUBLIC_*` 公開キー許可リストへの追記のみ（既存 `env` フィールドがある場合）。現行 `apps/web/next.config.ts` には `env` field がないため変更不要。build 設定本体・webpack carve / @opennextjs 連携設定は触らない。

## 5. 変更ファイル一覧（CONST_005 必須項目）

### 5.1 `apps/web/wrangler.toml`（M）

| 項目 | 内容 |
| --- | --- |
| 変更種別 | M（既存ファイル修正） |
| 関数シグネチャ | 該当なし（toml 設定） |
| 入力 | 編集前の wrangler.toml |
| 出力 | `[vars]` / `[env.staging.vars]` / `[env.production.vars]` を §2 差分通りに整理 |
| 副作用 | wrangler dev / build / deploy 時の env 注入挙動が変わる |
| テスト方針 | wrangler dev 起動 → env 注入 dump で全キー確認、staging dry-run でエラーなし |
| ローカル実行 | `bash scripts/cf.sh dev --config apps/web/wrangler.toml` |
| DoD | AC-1 / AC-9 |

### 5.2 `apps/web/.dev.vars.example`（C）

| 項目 | 内容 |
| --- | --- |
| 変更種別 | C（新規作成） |
| 関数シグネチャ | 該当なし（ini 形式） |
| 入力 | なし |
| 出力 | §3 の通り |
| 副作用 | ローカル開発者が `cp .dev.vars.example .dev.vars && op inject` で env を生成可能 |
| テスト方針 | grep で実値（`SENTRY_DSN_WEB=https://...` 等）が含まれないこと |
| ローカル実行 | `cp apps/web/.dev.vars.example apps/web/.dev.vars && op inject -i ... -o ...` |
| DoD | AC-2 |

### 5.3 `apps/web/src/lib/env.ts`（C）

| 項目 | 内容 |
| --- | --- |
| 変更種別 | C（新規作成） |
| 関数シグネチャ | `EnvSchema: z.ZodObject<...>` / `type Env` / `getEnv(): Env` / `getPublicEnv(): Pick<Env, ...>` |
| 入力 | Workers `env` binding または `process.env` |
| 出力 | zod parse 済みの `Env` オブジェクト / public subset |
| 副作用 | parse 失敗時 `ZodError` throw（read-only） |
| テスト方針 | env.test.ts で 4+ ケース |
| ローカル実行 | `mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/__tests__/env.test.ts` |
| DoD | AC-3 / AC-4 / AC-7 |

### 5.4 `apps/web/src/lib/__tests__/env.test.ts`（C）

| 項目 | 内容 |
| --- | --- |
| 変更種別 | C（新規作成） |
| 関数シグネチャ | Vitest `describe` / `it` |
| 入力 | mocked `process.env` |
| 出力 | 全 case PASS |
| 副作用 | なし |
| テスト方針 | 必須 parse / URL 違反 throw / 範囲違反 throw / optional 欠落許容 |
| ローカル実行 | `mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/__tests__/env.test.ts` |
| DoD | AC-7 |

### 5.5 `apps/web/next.config.ts`（M, 最小）

| 項目 | 内容 |
| --- | --- |
| 変更種別 | M（最小編集） |
| 関数シグネチャ | 既存 `nextConfig` object の `env` プロパティのみ |
| 入力 | 既存 next.config.ts |
| 出力 | `NEXT_PUBLIC_*` 公開キー許可リストに本タスクのキーが含まれる |
| 副作用 | client bundle に焼き込まれる env キーが拡張される |
| テスト方針 | `pnpm --filter @ubm-hyogo/web build` 通過、build 出力 grep で `NEXT_PUBLIC_API_BASE_URL` の値が environment 通りに焼かれていること |
| ローカル実行 | `mise exec -- pnpm --filter @ubm-hyogo/web build` |
| DoD | AC-8 / AC-11 |

## 6. 入出力 / 副作用サマリ

| 種別 | 内容 |
| --- | --- |
| 入力 | wrangler.toml `[vars]` / Cloudflare Secrets / `.dev.vars` |
| 出力 | `getEnv()` が型安全な `Env` を返す。違反時は ZodError |
| 副作用 | なし（read-only） |
| 失敗時挙動 | Zod parse 失敗 → throw → `app/error.tsx`（task-05）が補足 |
