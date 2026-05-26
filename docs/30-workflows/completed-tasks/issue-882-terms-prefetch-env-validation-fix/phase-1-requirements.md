# Phase 1 — 要件定義 / Topology Verification

## 1. 真の論点

`/` を JavaScript 有効状態で開いた際、`<Link href="/terms">` などの **Next.js prefetch が `/terms` の RSC を request し、root layout の `generateMetadata` 経路で `getPublicEnv()` が zod parse throw → prefetch 500 → Console error → hover / focus / SPA navigation 全体が破綻**する。

## 2. 現状 topology（実測）

| layer | path | 役割 |
| --- | --- | --- |
| root layout | `apps/web/app/layout.tsx` | `generateMetadata` から `buildBaseMetadata()` を call |
| metadata builder | `apps/web/src/lib/seo/site-metadata.ts` | `buildBaseMetadata` / `getSiteUrl` で `getPublicEnv()` を call |
| env accessor | `apps/web/src/lib/env.ts` | `getPublicEnv()` = `PublicEnvSchema.parse(rawEnv)`（throw on parse failure） |
| env raw source | `apps/web/src/lib/env.ts#readRawEnv` | `getCloudflareContext().env` → 失敗時 `process.env` フォールバック |
| error boundary | `apps/web/app/error.tsx` | client-side error 補足だが RSC fetch 失敗は補足不可 |
| 影響先 | `apps/web/app/terms/page.tsx`, `apps/web/app/privacy/page.tsx`, その他全 public route | root layout を共有するため同症状が出る |

## 3. PublicEnvSchema 必須項目

`apps/web/src/lib/env.ts:22-25`:

```
PublicEnvSchema = EnvSchema.pick({ ENVIRONMENT: true, NEXT_PUBLIC_API_BASE_URL: true })
```

両方とも必須。未設定の runtime（`next start` 単体・dev container 内 RSC prefetch 等）で throw する。

## 4. 不変条件

1. env 参照は `getEnv()` / `getPublicEnv()` 経由のみ（`process.env.*` 直参照を導入しない）
2. zod schema 定義 (`EnvSchema` / `PublicEnvSchema`) の項目削除・必須項目の緩和は行わない
3. `apps/web` から D1 直接アクセス禁止（本タスクで触れない）
4. HEX 直書き禁止（本タスクで CSS 変更なし）
5. `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止）
6. metadata の semantic（title / openGraph / robots）を変更しない

## 5. 目的（DoD 直結）

- root layout の `generateMetadata` から呼ばれる env 参照を **prefetch / RSC 経路で throw させない**設計に揃える。
- 具体方針: `buildBaseMetadata()` 内で `getPublicEnv()` を **safeParse + fallback** に置き換え、parse 失敗時は default site URL / robots noindex でフォールバックする。throw は CONST 1 の不変条件を満たしつつ「メタデータ生成 path だけ safe にする」設計。
- 直接 page render path（既存 server fetch 等）の `getEnv()` throw 挙動は据え置く（CONST 維持）。
