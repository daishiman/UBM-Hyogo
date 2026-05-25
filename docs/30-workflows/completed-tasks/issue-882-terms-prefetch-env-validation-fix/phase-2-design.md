# Phase 2 — システム設計

## 1. 設計方針

`buildBaseMetadata()` / `getSiteUrl()`（`apps/web/src/lib/seo/site-metadata.ts`）の env 参照を **safeParse + 既定値 fallback** に書き換える。env が解決できない経路（next start without Workers context / 一部 RSC prefetch path）でも throw せず `local` 既定値で metadata を返す。

### 1.1 env.ts 拡張

`apps/web/src/lib/env.ts` に以下を追加する。

```
// 既存 PublicEnvSchema をそのまま流用。safeParse helper を export
export function getPublicEnvSafe(
  rawEnv: RawEnv = readRawEnv(),
): Pick<Env, "ENVIRONMENT" | "NEXT_PUBLIC_API_BASE_URL"> | undefined {
  const parsed = PublicEnvSchema.safeParse(rawEnv);
  return parsed.success ? parsed.data : undefined;
}
```

- `getPublicEnv()` は throw 仕様維持（CONST 不変条件）。
- 新規 `getPublicEnvSafe()` だけ safe 経路。

### 1.2 site-metadata.ts 修正

```
const DEFAULT_PUBLIC_ENV = { ENVIRONMENT: "local", NEXT_PUBLIC_API_BASE_URL: "http://localhost:8787" } as const;

export function getSiteUrl(): URL {
  const env = getPublicEnvSafe() ?? DEFAULT_PUBLIC_ENV;
  return new URL(SITE_URL_MAP[env.ENVIRONMENT] ?? SITE_URL_MAP.local);
}

export function buildBaseMetadata(): Metadata {
  const env = getPublicEnvSafe() ?? DEFAULT_PUBLIC_ENV;
  const base = new URL(SITE_URL_MAP[env.ENVIRONMENT] ?? SITE_URL_MAP.local);
  // ... 既存 OG / twitter / robots ロジック（robots は env.ENVIRONMENT === "production" のときのみ index）
}
```

- robots: env 解決失敗 = 非 production 扱い = `{ index: false, follow: false }`。SEO 安全側に倒す。
- `buildPageMetadata` は `getSiteUrl()` 経由のため自動的に safe 化される。

## 2. ファイル変更マップ

| ファイル | 変更種別 | 変更内容 |
| --- | --- | --- |
| `apps/web/src/lib/env.ts` | 編集 | `getPublicEnvSafe()` 追加（既存 export は不変） |
| `apps/web/src/lib/seo/site-metadata.ts` | 編集 | `getSiteUrl` / `buildBaseMetadata` を `getPublicEnvSafe` + `DEFAULT_PUBLIC_ENV` fallback に置換 |
| `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` | 編集 | env 不在 fallback case を追加 |
| `apps/web/src/lib/__tests__/env.spec.ts` | 新規 or 追記 | `getPublicEnvSafe` の success / failure 両ケース |
| `apps/web/playwright/tests/terms-prefetch.spec.ts`（新規） | 新規 | playwright smoke: `/` → `/terms` SPA navigation で console error 0 件 |

## 3. 受け入れ条件への mapping

| 受け入れ基準 | 実装手段 |
| --- | --- |
| `/` JS 有効時に `/terms` env validation error が出ない | `getPublicEnvSafe` fallback で throw 解消 |
| `<Link href="/terms">` prefetch 200 | RSC fetch が throw しないため自動的に 200 |
| `/` hydration mismatch 0 | metadata は server / client 同じ DEFAULT で安定 |
| `process.env.*` 直参照を導入しない | `env.ts` 経由を維持 |
| `bash scripts/verify-pr-ready.sh` exit 0 | gate-metadata / phase12-compliance / indexes 全 green |

## 4. 設計 trade-off

- safeParse は env 未設定を「local 既定」と扱うため、誤って production に local URL で deploy されないか懸念があるが、Cloudflare Workers production binding では `getCloudflareContext().env` が必ず resolve するため fallback path は走らない（unit test で固定）。
- 万一 prod でも fallback に落ちた場合は robots noindex が SEO safety net として効く。
