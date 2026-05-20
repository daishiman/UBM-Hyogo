# Phase 7: 実装 — OG image / Root layout metadata

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 | 前 | 6 | 次 | 8 |
| 状態 | completed |

## 目的
`opengraph-image.tsx` を新規作成し、`site-metadata.ts` の helper を完成、`apps/web/app/layout.tsx` の root metadata を helper 経由に置換する。

## 7.1 変更対象ファイル

| ファイル | 種別 |
| --- | --- |
| `apps/web/src/lib/seo/site-metadata.ts` | 編集（helper 関数追加） |
| `apps/web/app/opengraph-image.tsx` | 新規 |
| `apps/web/app/layout.tsx` | 編集 |

## 7.2 実装手順

### Step 1: helper 追加（`site-metadata.ts`）

```ts
// 既存 import / SITE / getSiteUrl はそのまま
import type { Metadata } from "next";

export function buildBaseMetadata(): Metadata {
  const base = getSiteUrl();
  const env = getPublicEnv();
  return {
    metadataBase: base,
    title: { default: SITE.name, template: `%s | ${SITE.name}` },
    description: SITE.description,
    applicationName: SITE.shortName,
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: SITE.locale,
      url: base.toString(),
      title: SITE.name,
      description: SITE.description,
      images: [{ url: SITE.ogImagePath, width: 1200, height: 630, alt: SITE.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE.name,
      description: SITE.description,
      images: [SITE.ogImagePath],
    },
    robots: env.ENVIRONMENT === "production"
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export interface PageMetaInput {
  title: string;
  description?: string;
  path: string;
  ogImage?: string;
  twitterCard?: "summary" | "summary_large_image";
}

export function buildPageMetadata(input: PageMetaInput): Metadata {
  const base = getSiteUrl();
  const url = new URL(input.path, base).toString();
  const description = input.description ?? SITE.description;
  const ogImage = input.ogImage ?? SITE.ogImagePath;
  return {
    title: input.title,
    description,
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: SITE.locale,
      url,
      title: input.title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: input.title }],
    },
    twitter: {
      card: input.twitterCard ?? "summary_large_image",
      title: input.title,
      description,
      images: [ogImage],
    },
  };
}
```

### Step 2: `apps/web/app/opengraph-image.tsx`

```tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "UBM 兵庫支部会";
export const size = { width: 1200, height: 630 } as const;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
          color: "#ffffff",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>UBM 兵庫支部会</div>
        <div style={{ marginTop: 24, fontSize: 32, opacity: 0.9 }}>Hyogo Branch Members</div>
      </div>
    ),
    { ...size }
  );
}
```

### Step 3: `apps/web/app/layout.tsx` の編集

差分方針: 既存 `metadata` を helper 呼び出しに置換。`<html lang="ja">` と `ToastProvider` はそのまま。

```ts
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { buildBaseMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildBaseMetadata();

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
```

## 7.3 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm --filter @ubm-hyogo/web dev &
sleep 5
curl -s http://localhost:3000/ | grep -E 'og:|twitter:'
curl -sI http://localhost:3000/opengraph-image | head -5  # 200 OK + image/png
```

## 7.4 DoD
- `pnpm typecheck` / `pnpm build` PASS
- `/opengraph-image` が 200 OK + `Content-Type: image/png`
- ルート `/` の HTML に `og:title` / `og:image` / `twitter:card` が含まれる


## 実行タスク
- [ ] `opengraph-image.tsx` を 1200x630 PNG contract で実装する
- [ ] `layout.tsx` の root metadata を helper 経由へ置換する
- [ ] typecheck / lint / `/opengraph-image` response を確認する


## 参照資料
| 種別 | パス | 用途 |
| --- | --- | --- |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set と workflow 登録先の確認 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 公開導線・SEO/metadata 関連の即時参照 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 台帳との依存整合確認 |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/create-workflow.md` | Phase 1-13 生成・検証フロー |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | Phase 12 strict / 4条件 / same-wave sync gate |
| 実装対象 | `apps/web/app/opengraph-image.tsx` | OG image metadata route |
| 実装対象 | `apps/web/app/layout.tsx` | root metadata |
| Design tokens | `apps/web/src/styles/tokens.css` | OG image 色の正本照合 |


## 成果物
- `apps/web/app/opengraph-image.tsx`, `apps/web/app/layout.tsx`


## 依存 Phase 参照
- Phase 5 の成果物を参照する
- Phase 6 の成果物を参照する


## 完了条件
- [ ] 上記成果物が作成または更新されている
- [ ] 参照資料との矛盾がない
- [ ] 次 Phase が必要とする入力が本文または成果物に明記されている
