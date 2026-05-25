# task-02 — `site-metadata.ts` を safeParse + DEFAULT fallback に置換

[実装区分: 実装仕様書]

## 目的

root layout の `generateMetadata` 経路が env 不在で throw して `/terms` 等の RSC prefetch を 500 化するのを止める。

## 変更対象ファイル

| ファイル | 変更種別 |
| --- | --- |
| `apps/web/src/lib/seo/site-metadata.ts` | 編集 |
| `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` | 編集（fallback ケース追加） |

## 変更仕様

```ts
import { getPublicEnvSafe } from "../env";

const DEFAULT_PUBLIC_ENV = {
  ENVIRONMENT: "local",
  NEXT_PUBLIC_API_BASE_URL: "http://localhost:8787",
} as const;

export function getSiteUrl(): URL {
  const env = getPublicEnvSafe() ?? DEFAULT_PUBLIC_ENV;
  return new URL(SITE_URL_MAP[env.ENVIRONMENT] ?? SITE_URL_MAP.local);
}

export function buildBaseMetadata(): Metadata {
  const env = getPublicEnvSafe() ?? DEFAULT_PUBLIC_ENV;
  const base = new URL(SITE_URL_MAP[env.ENVIRONMENT] ?? SITE_URL_MAP.local);
  return { /* 既存 OG/twitter/robots ロジックを env 参照のみ置換 */ };
}
```

- `getPublicEnv` import を削除。
- robots は `env.ENVIRONMENT === "production"` のときのみ index（fallback 経由なら noindex 維持）。
- `buildPageMetadata` は `getSiteUrl` 経由のため修正不要。

## テスト（追加）

`site-metadata.spec.ts`:

- 既存: env mock 成功時に正しい URL / robots が返る。
- 追加 A: `vi.spyOn(envMod, "getPublicEnvSafe").mockReturnValue(undefined)` → `getSiteUrl()` が `http://localhost:3000` を返し、`buildBaseMetadata().robots` が `{ index: false, follow: false }`。
- 追加 B: `buildBaseMetadata()` が throw しない（`expect(() => buildBaseMetadata()).not.toThrow()`）。
- 追加 C: production 値 mock 時に `metadataBase` が `https://ubm-hyogo-web-production.daishimanju.workers.dev` で robots が index/follow true。

## ローカル実行コマンド

```
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/seo/__tests__/site-metadata.spec.ts
```

## DoD

- vitest 全 PASS（既存 + 追加 3 ケース）。
- `apps/web/app/layout.tsx` から見える signature 不変（`generateMetadata` を変更しない）。
- typecheck / lint green。
