# Phase 2: 設計

## 1. ファイル配置

```
apps/web/app/(public)/members/[id]/
  ├─ page.tsx                                # 既存（修正）
  ├─ not-found.tsx                           # 既存（変更なし）
  ├─ opengraph-image/
  │   └─ route.tsx                           # 新規
  └─ __tests__/
      └─ opengraph-image.spec.tsx            # 新規 (Vitest)
```

> Next.js 16 の metadata special file `opengraph-image.tsx` は hash suffix route を生成するため、SNS meta tag に明示する unhashed path とは一致しない。本タスクでは `opengraph-image/route.tsx` の route handler で `/members/[id]/opengraph-image` を明示的に提供する。

## 2. profile 取得関数の共有化

`page.tsx` 内の `fetchProfile(id)` は private function。本タスクでは **新しい公開 helper を増やさず、`opengraph-image/route.tsx` でも同じ fetch boundary を薄く再利用する**。簡潔性優先で fetch logic を inline に留める（共通 helper 化は §6 参照）。

理由: page.tsx の private function をそのまま import-export 化すると surface が増える。inline 複製で `apps/web/src/lib/fetch/public.ts` の `fetchPublicOrNotFound` を直接呼ぶ方が薄い。

## 3. `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` 設計

```tsx
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import type { z } from "zod";

import { PublicMemberProfileZ } from "@ubm-hyogo/shared";

import { fetchPublicOrNotFound } from "../../../../src/lib/fetch/public";

type PublicMemberProfile = z.infer<typeof PublicMemberProfileZ>;

export const alt = "UBM 兵庫支部会 メンバープロフィール";
export const size = { width: 1200, height: 630 } as const;
interface Props {
  params: Promise<{ id: string }>;
}

export default async function Image({ params }: Props) {
  const { id } = await params;
  let profile: PublicMemberProfile;
  try {
    profile = await fetchPublicOrNotFound<PublicMemberProfile>(
      `/public/members/${encodeURIComponent(id)}`,
      { revalidate: 0 },
    );
  } catch (e) {
    if (e instanceof Error && e.name === "FetchPublicNotFoundError") {
      notFound();
    }
    throw e;
  }

  const fullName = profile.summary.fullName;
  const occupation = profile.summary.occupation;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 96px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            opacity: 0.85,
            letterSpacing: 2,
          }}
        >
          UBM 兵庫支部会 / Member
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1.05,
          }}
        >
          {fullName}
        </div>
        {occupation ? (
          <div
            style={{
              marginTop: 32,
              fontSize: 40,
              opacity: 0.9,
            }}
          >
            {occupation}
          </div>
        ) : null}
        <div
          style={{
            marginTop: "auto",
            fontSize: 24,
            opacity: 0.75,
          }}
        >
          Hyogo Branch Members
        </div>
      </div>
    ),
    { ...size },
  );
}
```

### 設計上のポイント

- OpenNext Cloudflare 互換のため route-level `runtime = "edge"` は指定しない（Workers 実行環境への bundle は adapter に委ねる）。
- `PublicMemberProfileZ` の `summary.fullName` / `summary.occupation` のみ参照（publicConsent gate は `apps/api/src/routes/public/member-profile.ts` と `apps/api/src/use-cases/public/get-public-member-profile.ts` に委譲、`apps/web` 側で重複した privacy logic を持たない）。
- 404 は `notFound()` で `not-found.tsx` ではなく Next の standard 404 に委ねる（ImageResponse は HTML を返さないため `not-found.tsx` rendering は発生しない）。
- 例外時は throw して `app/error.tsx` の boundary に委譲。

## 4. `apps/web/app/(public)/members/[id]/page.tsx` の修正

`generateMetadata` 内で `buildPageMetadata` に `ogImage` を明示的に渡す（path 相対指定で OK。Next が `metadataBase` と結合）。

差分要点:

```diff
   return buildPageMetadata({
     title: profile.summary.fullName,
     description: `${profile.summary.fullName}${
       occ ? `（${occ}）` : ""
     }の UBM 兵庫支部会プロフィール`,
     path: `/members/${id}`,
     twitterCard: "summary",
+    ogImage: `/members/${encodeURIComponent(id)}/opengraph-image`,
   });
```

> not-found branch（`fetchProfile` が null）では root site image を継承させるため `ogImage` は指定しない。

## 5. site-metadata.ts 側の確認

`buildPageMetadata` は既に `input.ogImage` を受け取り `og:image` / `twitter:image` の両方に反映する設計（site-metadata.ts:67-92）。**変更不要**。type doc コメントを 1 行追加するに留める。

```diff
 export interface PageMetaInput {
   title: string;
   description?: string;
   path: string;
+  /** Absolute path or relative path. Relative path is resolved against metadataBase. */
   ogImage?: string;
   twitterCard?: "summary" | "summary_large_image";
 }
```

## 6. 共通 fetch helper 化の判断

`fetchProfile(id)` 相当の取得処理は page.tsx と opengraph-image/route.tsx で同一実装になるが、共通 helper 化は **本タスク scope 外**（CONST_007 例外なし、将来 refactor 候補）。理由は abstraction cost が高く、現状 2 callsite で重複 8 行は許容範囲。

## 7. publicConsent ガード論理

API `/public/members/:id` は既に publicConsent=false の member を 404 で返す contract（`apps/api/src/routes/public/member-profile.ts` → `apps/api/src/use-cases/public/get-public-member-profile.ts`）。`apps/web` 側で重複ガードしない（DRY 原則）。web 側のテストは `FetchPublicNotFoundError` → `notFound()` の mapping を検証し、publicConsent=false そのものは API contract の責務として参照する。
