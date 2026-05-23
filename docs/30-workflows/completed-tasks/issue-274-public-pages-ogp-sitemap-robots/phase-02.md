# Phase 2: 設計

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 前 Phase | 1 | 次 Phase | 3 |
| 状態 | completed |

## 目的
metadata 構造、ファイル配置、helper 抽出、env 分岐ロジックを設計確定する。

## 設計内容

### 2.1 ファイル配置（変更対象一覧）
| ファイル | 種別 | 役割 |
| --- | --- | --- |
| `apps/web/src/lib/seo/site-metadata.ts` | 新規 | site 基本情報（name / description / locale / OG image path）の SSOT、`buildBaseMetadata()` / `buildPageMetadata()` helper |
| `apps/web/app/layout.tsx` | 編集 | `metadata` を helper 経由に置換 |
| `apps/web/app/sitemap.ts` | 新規 | `MetadataRoute.Sitemap` 実装 |
| `apps/web/app/robots.ts` | 新規 | `MetadataRoute.Robots` 実装 |
| `apps/web/app/opengraph-image.tsx` | 新規 | ImageResponse 1200x630 |
| `apps/web/app/page.tsx` | 編集 | `metadata` export 追加 |
| `apps/web/app/(public)/members/page.tsx` | 編集 | `metadata` export 追加 |
| `apps/web/app/(public)/members/[id]/page.tsx` | 編集 | `generateMetadata` 拡張 |
| `apps/web/app/(public)/register/page.tsx` | 編集 | `metadata` export 追加 |
| `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` | 新規 | helper unit test |
| `apps/web/playwright/tests/public-metadata.spec.ts` | 新規 | Playwright smoke |

### 2.2 helper API 設計（`site-metadata.ts`）

```ts
// site-metadata.ts (signature 設計)
import type { Metadata } from "next";
import { getPublicEnv } from "@/lib/env";

export const SITE = {
  name: "UBM 兵庫支部会",
  shortName: "UBM Hyogo",
  description: "兵庫を拠点に活動する UBM 支部会のメンバーディレクトリと活動紹介",
  ogImagePath: "/opengraph-image",
  twitterHandle: undefined as string | undefined, // 取得済みなら設定
  locale: "ja_JP",
} as const;

export function getSiteUrl(): URL {
  const env = getPublicEnv();
  // wrangler vars に AUTH_URL は env.ts schema にあるが、フロント公開 URL は別。
  // production / staging で site URL を分岐する。
  const map: Record<string, string> = {
    production: "https://ubm-hyogo.daishimanju.workers.dev",
    staging: "https://ubm-hyogo-staging.daishimanju.workers.dev",
    local: "http://localhost:3000",
  };
  return new URL(map[env.ENVIRONMENT] ?? map.local);
}

export function buildBaseMetadata(): Metadata {
  const base = getSiteUrl();
  return {
    metadataBase: base,
    title: { default: SITE.name, template: `%s | ${SITE.name}` },
    description: SITE.description,
    openGraph: {
      type: "website", siteName: SITE.name, locale: SITE.locale,
      url: base, title: SITE.name, description: SITE.description,
      images: [{ url: SITE.ogImagePath, width: 1200, height: 630, alt: SITE.name }],
    },
    twitter: { card: "summary_large_image", title: SITE.name, description: SITE.description, images: [SITE.ogImagePath] },
    robots: getPublicEnv().ENVIRONMENT === "production"
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export interface PageMetaInput {
  title: string;
  description?: string;
  path: string;             // 例: "/members"
  ogImage?: string;         // 既定は SITE.ogImagePath
  twitterCard?: "summary" | "summary_large_image";
}

export function buildPageMetadata(input: PageMetaInput): Metadata;
```

### 2.3 sitemap 設計
- static entries: `/`, `/members`, `/register`（`changeFrequency: "weekly"`, `priority` は `/` = 1.0, `/members` = 0.8, `/register` = 0.7）
- dynamic entries: `/public/members?limit=100&page=N` を `cache: "no-store"` で `pagination.hasNext === false` まで fetch し、各 `memberId` から `/members/{memberId}` を生成。`changeFrequency: "monthly"`, `priority: 0.5`
- 失敗時は static entries のみ返す（throw しない、`console.warn` でログ）
- `INTERNAL_API_BASE_URL`（env.ts 既定）を使用してサーバ間通信

### 2.4 robots 設計
- production: `rules: [{ userAgent: "*", allow: ["/", "/members", "/members/*", "/register"], disallow: ["/admin", "/admin/*", "/profile", "/login", "/api"] }]`, `sitemap: ${siteUrl}/sitemap.xml`, `host: siteUrl.host`
- それ以外: `rules: [{ userAgent: "*", disallow: "/" }]`

### 2.5 opengraph-image 設計
- `runtime = "edge"` を export（OpenNext Workers 互換のため required）
- `size = { width: 1200, height: 630 }`, `contentType = "image/png"`
- `ImageResponse` で背景は OKLch token `--brand` 相当の `#1e3a8a`〜`#3b82f6` グラデーション風 RGB（token と乖離させないこと）
- 中央に "UBM 兵庫支部会" を白で表示

## 完了条件
- [ ] この Phase の成果物が作成または更新されている
- [ ] 参照資料との矛盾がない
- `outputs/phase-02/main.md` に上記設計が反映されている

## 4 条件評価
- **責務単一**: helper / route / page metadata の責務を分離
- **置換性**: helper 経由なので site URL 変更時の影響を 1 ファイルに局所化
- **テスタビリティ**: helper を pure 関数で書き unit test 可能
- **整合性**: env / robots / sitemap の env 分岐が `getPublicEnv()` 単一経路


## 実行タスク
- [ ] metadata helper / sitemap / robots / OG image の責務境界を確定する
- [ ] site URL と robots の env 分岐を単一 helper に寄せる
- [ ] Phase 3 以降の型・実装タスクへ渡す設計を固定する


## 参照資料
| 種別 | パス | 用途 |
| --- | --- | --- |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set と workflow 登録先の確認 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 公開導線・SEO/metadata 関連の即時参照 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 台帳との依存整合確認 |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/create-workflow.md` | Phase 1-13 生成・検証フロー |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | Phase 12 strict / 4条件 / same-wave sync gate |
| 現行 app root | `apps/web/app/layout.tsx` | root metadata 変更点 |
| 現行 env | `apps/web/src/lib/env.ts` | site URL / robots 分岐 |
| Next.js | `https://nextjs.org/docs/app/api-reference/file-conventions/metadata` | Metadata API 公式仕様 |


## 成果物
- `outputs/phase-02/main.md`（設計・責務境界・helper API）
