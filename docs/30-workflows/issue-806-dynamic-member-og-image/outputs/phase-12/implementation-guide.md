# Implementation Guide: 動的メンバー OG 画像（issue-806）

## Part 1: 中学生にも分かる説明

SNS に「会員ページ」のリンクを共有したとき、これまでは**サイトの代表画像**だけが出ていました。今回の改修で、その会員の名前と肩書きが入った**専用のシェア画像**を、Cloudflare Workers が会員ページごとに自動生成して返すようにしました。これによりリンクをタップする前から「誰のページか」が分かるようになります。

## Part 2: 概要

`/members/[id]` の SNS シェア時に member 固有 OG 画像（1200×630 PNG、氏名・肩書き描画）を返す動的 OG image route を追加。issue #274 で実装済みの root OG はそのまま、member detail でのみ override。

## Part 3: 変更ファイル

| ファイル | 種別 | 内容 |
|---|---|---|
| `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` | 新規 | `next/og` の `ImageResponse` で 1200×630 PNG を返す dynamic image route |
| `apps/web/app/(public)/members/[id]/page.tsx` | 修正 | `generateMetadata` で `ogImage` を member-specific path に差し替え |
| `apps/web/src/lib/seo/site-metadata.ts` | 修正 | `PageMetaInput.ogImage` の doc comment 追加 |
| `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx` | 新規 | Vitest unit smoke 4 cases |
| `apps/web/playwright/tests/public-metadata.spec.ts` | 修正 | member-specific og:image / PNG / 404 の 3 ケース追加 |

## Part 4: 不変条件遵守

1. ✓ publicConsent=false の member は API contract で 404、web 側は `FetchPublicNotFoundError` → `notFound()` mapping のみ
2. ✓ root OG と同じ gradient / color（`#1e3a8a → #3b82f6`）を流用
3. ✓ D1 直接アクセスなし（`fetchPublicOrNotFound` 経由）
4. ✓ OpenNext Cloudflare 互換（route-level `runtime = "edge"` 未指定）

## Part 5: 動作確認

- `pnpm --filter @ubm-hyogo/web typecheck`: ✓ PASS
- `pnpm --filter @ubm-hyogo/web lint`: ✓ PASS
- `pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts "apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx"`: ✓ 4/4 PASS
- `ENVIRONMENT=local ... pnpm --filter @ubm-hyogo/web build`: ✓ PASS（placeholder env 付き）
- `next start -p 3002` + `curl -I /members/playwright-public-member/opengraph-image`: ✓ 200 `image/png`
- Phase 11 screenshot: `outputs/phase-11/screenshots/og-image-seeded.png`
- Phase 11 metadata grep: `outputs/phase-11/screenshots/og-image-meta-grep.txt`

## Part 6: 残課題 / フォローアップ

- Production SNS crawler 検証（Twitter Card Validator 等）は deploy 後の任意 smoke で実施
- フォント埋め込み最適化は Phase 11 手動検証で日本語フォント tofu が出た場合に同一サイクル内で対応

## 関連

- Source issue: #806
- Predecessor: #274（root OGP / sitemap / robots）
