# Phase 3: データ / 型契約

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 | 前 | 2 | 次 | 4 |
| 状態 | completed |

## 目的
metadata helper の型契約、sitemap dynamic source の API contract、Next.js Metadata 型との整合性を確定する。

## 3.1 型定義（`site-metadata.ts`）

```ts
import type { Metadata, MetadataRoute } from "next";

export type Environment = "local" | "staging" | "production";

export interface PageMetaInput {
  /** ブラウザタブと OG title の root（layout の template が "%s | UBM 兵庫支部会" を付加） */
  title: string;
  /** OG description / twitter description / <meta name="description"> */
  description?: string;
  /** OG URL 用パス（先頭スラッシュ必須、クエリ含めない） */
  path: string;
  /** 既定は SITE.ogImagePath。動的 OG image を持つページのみ上書き */
  ogImage?: string;
  /** 既定 "summary_large_image"。member detail は "summary" */
  twitterCard?: "summary" | "summary_large_image";
}

export type SitemapEntry = MetadataRoute.Sitemap[number];
export type RobotsRule = MetadataRoute.Robots["rules"];
```

## 3.2 sitemap dynamic source contract

呼び出し: `GET ${INTERNAL_API_BASE_URL}/public/members?limit=100&page=N`

期待 response shape（既存 `apps/api/src/routes/public/members.ts` 契約）:
```ts
type Response = {
  items: Array<{ memberId: string; fullName: string }>;
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
  generatedAt: string;
};
```

不変条件:
- API は `publicConsent=true` のみ返す（既存契約）
- sitemap 側では追加 filter しない
- `limit` は現行 parser で最大 100 に clamp されるため、`pagination.hasNext` が false になるまで page を進める
- member list item に per-member `updatedAt` は無いため、member entry の `lastModified` は response `generatedAt` または sitemap 生成時刻を使う
- 失敗（fetch reject / non-2xx / JSON parse error）時は static entries のみ返す

## 3.3 Next.js Metadata Routes 型

- `sitemap.ts`: `export default function sitemap(): Promise<MetadataRoute.Sitemap>`
- `robots.ts`: `export default function robots(): MetadataRoute.Robots`
- `opengraph-image.tsx`:
  - `export const runtime = "edge"`
  - `export const size = { width: 1200, height: 630 }`
  - `export const contentType = "image/png"`
  - `export const alt = "UBM 兵庫支部会"`
  - `export default async function Image(): Promise<ImageResponse>`

## 3.4 generateMetadata 契約（`/members/[id]`）

```ts
export async function generateMetadata(
  { params }: MemberDetailPageProps,
): Promise<Metadata> {
  const { id } = await params;
  const profile = await fetchProfile(id);
  if (!profile) return { title: "メンバーが見つかりません" }; // notFound() は本体で実行
  return buildPageMetadata({
    title: profile.summary.fullName,
    description: `${profile.summary.fullName}（${profile.summary.occupation ?? ""}）の UBM 兵庫支部会プロフィール`,
    path: `/members/${id}`,
    twitterCard: "summary",
  });
}
```

## 依存 Phase 参照
- Phase 1 の成果物を参照する
- Phase 2 の成果物を参照する


## 完了条件
- [ ] この Phase の成果物が作成または更新されている
- [ ] 参照資料との矛盾がない
- `outputs/phase-03/main.md` に上記型定義と API contract が記述されている


## 実行タスク
- [ ] `Metadata` / `MetadataRoute` の型契約を定義する
- [ ] `/public/members` response shape と sitemap 転写ルールを固定する
- [ ] `/members/[id]` の `generateMetadata` 契約を固定する


## 参照資料
| 種別 | パス | 用途 |
| --- | --- | --- |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set と workflow 登録先の確認 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 公開導線・SEO/metadata 関連の即時参照 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 台帳との依存整合確認 |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/create-workflow.md` | Phase 1-13 生成・検証フロー |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | Phase 12 strict / 4条件 / same-wave sync gate |
| 現行 shared schema | `packages/shared/src` | public member response 型の source |
| 現行 API | `apps/api/src/routes/public/members.ts` | `/public/members` response shape |
| Next.js | `https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap` | `MetadataRoute.Sitemap` 型 |


## 成果物
- `outputs/phase-03/main.md`（型契約・API contract）
