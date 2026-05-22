# Phase 1: 要件定義

## 1. 背景

- root `apps/web/app/opengraph-image.tsx` はサイト共通画像として #274 で実装済み。
- `/members/[id]` の `generateMetadata` (`apps/web/app/(public)/members/[id]/page.tsx:45-68`) は `buildPageMetadata` に `ogImage` 引数を渡さず、default の `SITE.ogImagePath="/opengraph-image"` を継承するため、Twitter/Facebook シェア時にどの member を共有しても同一の root 画像が表示される。
- 結果として member 固有の氏名・肩書きが SNS カードに反映されず、共有体験が generic になる。

## 2. 機能要件

| ID | 要件 |
|---|---|
| FR-1 | `/members/[id]/opengraph-image` への GET request に対し、当該 member の氏名・肩書きを描画した 1200×630 PNG を返す |
| FR-2 | member detail page の `og:image` / `twitter:image` が `/members/[id]/opengraph-image` を指す |
| FR-3 | 存在しない / publicConsent=false の member id に対しては root site image にフォールバックするか 404 を返す（後述設計で 404 を採用） |
| FR-4 | styling は root OG と同一 gradient（`linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)`）を流用し、氏名を主見出し、肩書きを副見出し、フッターに "UBM 兵庫支部会" を配置 |

## 3. 非機能要件

| ID | 要件 |
|---|---|
| NFR-1 | OpenNext Cloudflare build で `next/og` `ImageResponse` route が動作すること。route-level `runtime = "edge"` は指定しない |
| NFR-2 | 1 request の image generation が p95 < 1.5s（next/og のデフォルトを許容） |
| NFR-3 | `apps/web` から D1 直接アクセス禁止の不変条件を維持（`/public/members/:id` 経由のみ） |
| NFR-4 | publicConsent=false の情報を含めない（API 側で既に filter 済みの contract を信頼） |

## 4. 受け入れ基準（AC）

- AC-1: `curl -sI http://localhost:3000/members/<seeded-id>/opengraph-image` が `HTTP/1.1 200` と `Content-Type: image/png` を返す
- AC-2: `view-source:http://localhost:3000/members/<seeded-id>` の HTML に `<meta property="og:image" content=".../members/<id>/opengraph-image">` が含まれる
- AC-3: Playwright `public-metadata.spec.ts` の新規ケースで member-specific og:image path がアサートできる
- AC-4: 存在しない id（例: `/members/nonexistent/opengraph-image`）に対して `next/navigation` の `notFound()` 経由で 404 が返る
- AC-5: `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web build` が PASS

## 5. スコープ確定

- 含む: opengraph-image route 新規 / member detail metadata の og image path 差し替え / Playwright と unit test の追加
- 含まない: フォント埋め込み・複数言語 fallback・cache header の hand-tuning（next/og default に従う）
