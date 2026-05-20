# Phase 1: 要件定義

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 名称 | 要件定義 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的
公開 4 ルートに対し SNS シェアと検索エンジン発見性を担保する metadata / OG image / sitemap / robots の AC を確定する。

## 実行タスク
1. 公開 4 ルート（`/`, `/members`, `/members/[id]`, `/register`）の URL と表示意図を `docs/00-getting-started-manual/specs/05-pages.md` から確認
2. `apps/web/src/lib/env.ts` の `getPublicEnv()` が返す `ENVIRONMENT` 値（`local|staging|production`）を確認
3. `apps/api/src/routes/public/members.ts` の response shape を確認（sitemap 動的部分の source）
4. AC-1〜AC-10 を確定

## AC（Acceptance Criteria）
- **AC-1**: `apps/web/app/sitemap.ts` が `MetadataRoute.Sitemap` を返し、静的 4 ルート（`/`, `/members`, `/register` ※ `/members/[id]` は動的展開） + 動的 member URL を含む
- **AC-2**: `apps/web/app/robots.ts` が `MetadataRoute.Robots` を返し、`ENVIRONMENT === "production"` で `Allow: ["/", "/members", "/members/*", "/register"]` + `Disallow: ["/admin", "/profile", "/login", "/api"]`、それ以外は `Disallow: "/"`
- **AC-3**: `apps/web/app/opengraph-image.tsx` が 1200x630 の OG image を `next/og` の `ImageResponse` で返し、`alt` を持つ
- **AC-4**: `apps/web/app/layout.tsx` の `metadata` に `metadataBase` / `openGraph` / `twitter` / `robots` が定義される
- **AC-5**: `/` が `metadata` export で `openGraph.title` / `description` / `twitter.card="summary_large_image"` を設定
- **AC-6**: `/members` が `metadata` export で同上の OGP/Twitter を設定
- **AC-7**: `/members/[id]` の `generateMetadata` が `openGraph.title = "{fullName} | UBM 兵庫支部会"`、`description` を `summary` から生成、`twitter.card="summary"` を設定
- **AC-8**: `/register` が `metadata` export で `noindex` ではなく公開（registration への誘導意図）、OGP/Twitter を設定
- **AC-9**: sitemap の動的 member 部分は `/public/members?limit=100&page=N` を `pagination.hasNext === false` まで server fetch で辿り、`publicConsent=true` のみ含む（API 既存契約に依拠、追加 filter 不要）
- **AC-10**: Playwright smoke が 4 ルートに対し `og:title` / `og:description` / `og:image` / `twitter:card` の `<meta>` 存在を assert

## 完了条件
- [ ] この Phase の成果物が作成または更新されている
- [ ] 参照資料との矛盾がない
- `outputs/phase-01/main.md` に AC-1〜AC-10、URL contract 表、env 分岐表が記述されている

## 参照
- `docs/00-getting-started-manual/specs/05-pages.md`
- `apps/web/src/lib/env.ts`
- `apps/web/wrangler.toml`


## 参照資料
| 種別 | パス | 用途 |
| --- | --- | --- |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set と workflow 登録先の確認 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 公開導線・SEO/metadata 関連の即時参照 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 台帳との依存整合確認 |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/create-workflow.md` | Phase 1-13 生成・検証フロー |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | Phase 12 strict / 4条件 / same-wave sync gate |
| 現行ページ仕様 | `docs/00-getting-started-manual/specs/05-pages.md` | 公開 4 ルート URL contract |
| 現行 env | `apps/web/src/lib/env.ts` | `getPublicEnv()` / `getEnv()` の境界 |
| 現行 API | `apps/api/src/routes/public/members.ts` | sitemap 動的 member source |


## 成果物
- `outputs/phase-01/main.md`（AC / URL contract / env 分岐表）
