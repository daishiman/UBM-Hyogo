# Implementation Guide — issue-882-terms-prefetch-env-validation-fix

## Part 1: What Changed

### なぜ必要か

`/` を開いた人が何も押していなくても、ブラウザは次に行きそうな `/terms` を先に取りに行きます。その先取りで環境情報の確認に失敗すると、利用規約ではなくホーム画面側までエラーに巻き込まれます。だから、ページの中身ではなく「ページの説明文」を作る場所だけは、環境情報が足りないときにも止まらない必要があります。

### Daily-Life Example

たとえば、玄関の表札を作るだけなのに、倉庫の鍵が見つからないという理由で家全体に入れなくなるのは困ります。この修正は、表札づくりに必要な情報が見つからないときだけ、仮の安全な表札を使うようにするものです。

`/terms` の画面そのものは静的ですが、Next.js は先にページ情報を取りに行きます。そのとき環境情報が足りないだけで失敗していたため、metadata 生成だけは安全な既定値へ逃がしました。

### 何をしたか

環境情報を厳しく確認する入口はそのまま残し、ページ説明を作る専用の「失敗しても止まらない入口」を追加しました。

### 今回作ったもの

| 作ったもの | 役割 |
| --- | --- |
| `getPublicEnvSafe()` | 環境情報が正しければ返し、不足時は `undefined` を返す |
| metadata fallback | `undefined` のとき local URL と noindex を使う |
| Playwright smoke | `/terms` の先取りで console error / 4xx が出ないことを確認する |

## Part 2: Technical Details

### TypeScript 型定義

```ts
type PublicEnv = Pick<Env, "ENVIRONMENT" | "NEXT_PUBLIC_API_BASE_URL">;
```

| Item | Detail |
| --- | --- |
| New API | `getPublicEnvSafe(rawEnv?: RawEnv): Pick<Env, "ENVIRONMENT" \| "NEXT_PUBLIC_API_BASE_URL"> \| undefined` |
| Existing API | `getEnv()` / `getPublicEnv()` remain throwing parsers |
| Fallback owner | `apps/web/src/lib/seo/site-metadata.ts` private `resolvePublicEnv()` |
| Default env | `ENVIRONMENT=local`, `NEXT_PUBLIC_API_BASE_URL=http://localhost:8787` |
| SEO safety | fallback is non-production, so robots remains `{ index: false, follow: false }` |
| Runtime smoke | `apps/web/playwright/tests/terms-prefetch.spec.ts` checks console/page errors and `/terms` 4xx responses |

### APIシグネチャ

```ts
export function getPublicEnvSafe(rawEnv?: RawEnv): PublicEnv | undefined;
export function getSiteUrl(): URL;
export function buildBaseMetadata(): Metadata;
```

### 使用例

```ts
const env = getPublicEnvSafe() ?? DEFAULT_PUBLIC_ENV;
const metadataBase = new URL(SITE_URL_MAP[env.ENVIRONMENT] ?? SITE_URL_MAP.local);
```

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3100 pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/terms-prefetch.spec.ts --project=desktop-chromium
```

### エラーハンドリング

`getPublicEnvSafe()` は zod parse 失敗を throw せず `undefined` に変換します。metadata 側は `undefined` を `DEFAULT_PUBLIC_ENV` へ寄せるため、RSC prefetch は env validation 由来で 500 になりません。既存 `getEnv()` / `getPublicEnv()` は従来どおり throw し、アプリ本体の設定不足は隠しません。

### エッジケース

| Case | Behavior |
| --- | --- |
| env 未設定の local `next dev` | metadata は local URL + noindex |
| staging / production binding 正常 | binding の `ENVIRONMENT` に応じた URL と robots |
| production で万一 fallback | noindex/nofollow になり SEO 安全側 |
| `/` Playwright smoke | mock API が必要。未起動なら `/` data fetch で error boundary になる |

### 設定項目と定数一覧

| Name | Value |
| --- | --- |
| `DEFAULT_PUBLIC_ENV.ENVIRONMENT` | `local` |
| `DEFAULT_PUBLIC_ENV.NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8787` |
| `SITE_URL_MAP.local` | `http://localhost:3000` |
| `SITE_URL_MAP.staging` | `https://ubm-hyogo-web-staging.daishimanju.workers.dev` |
| `SITE_URL_MAP.production` | `https://ubm-hyogo-web-production.daishimanju.workers.dev` |

### テスト構成

| Test | Purpose |
| --- | --- |
| `env.spec.ts` | safe accessor returns value/undefined and throwing accessor still throws |
| `site-metadata.spec.ts` | fallback URL/noindex and production index behavior |
| `terms-prefetch.spec.ts` | `/` to `/terms` prefetch regression smoke |

## Why This Is Minimal

The fix does not loosen `EnvSchema`, does not add new env vars, and does not introduce `process.env.*` direct reads. Only metadata generation uses safe parsing because metadata is the route prefetch failure point.

## Local Verification

```bash
pnpm --filter @ubm-hyogo/web test -- src/lib/__tests__/env.spec.ts src/lib/seo/__tests__/site-metadata.spec.ts
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web lint
node scripts/e2e-mock-api.mjs
PLAYWRIGHT_BASE_URL=http://localhost:3100 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/issue-882-terms-prefetch-env-validation-fix/outputs/phase-11/evidence pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/terms-prefetch.spec.ts --project=desktop-chromium
```
