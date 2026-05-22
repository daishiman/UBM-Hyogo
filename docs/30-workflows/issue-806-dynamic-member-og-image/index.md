# issue-806-dynamic-member-og-image

> Source issue: [#806](https://github.com/daishiman/UBM-Hyogo/issues/806)（CLOSED のまま仕様書化）
> Parent workflow: `docs/30-workflows/completed-tasks/issue-274-public-pages-ogp-sitemap-robots/`（root OGP / sitemap / robots は完了）
> Predecessor one-pager: `docs/30-workflows/unassigned-task/task-issue-274-followup-001-dynamic-member-og-image.md`
> 実装区分: **実装仕様書**
> 状態: `implemented-local / implementation / VISUAL / local-evidence-captured`
> 作成日: 2026-05-20

## 調査サマリ（CLOSED 状態の妥当性検証）

| 項目 | 現状 | 判定 |
|---|---|---|
| `apps/web/app/opengraph-image.tsx`（root） | 存在 | ✓ 完了（#274 で実装） |
| `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx`（動的） | 存在 | ✓ 実装済み |
| `apps/web/app/(public)/members/[id]/page.tsx` の `generateMetadata` | `buildPageMetadata` に member-specific `ogImage` を渡す | ✓ 実装済み |
| Playwright `public-metadata.spec.ts` の `/members/[id]` 検証 | `og:image` / `twitter:image` path、PNG response、404、Phase 11 証跡保存を検証 | ✓ 検証済み |

**結論**: Issue は CLOSED のまま、member 固有 OG 画像 route と metadata override を実装済み。PR 文言は `Refs #806` のみを使う。

## 概要

`/members/[id]` SNS シェア時に member 固有 OG 画像（氏名・肩書きを描画した 1200×630 PNG）を返す `next/og` `ImageResponse` route を追加し、member detail の `generateMetadata` が当該動的 path を `og:image` として返すようにする。

## Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義 |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計 |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画 |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順 |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト追加 |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタ（本タスクではなし） |
| 9 | [phase-9-qa.md](phase-9-qa.md) | QA |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント（概念説明含む） |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成 |

## 変更対象ファイル

- `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx`（**新規**）
- `apps/web/app/(public)/members/[id]/page.tsx`（修正：`generateMetadata` の `ogImage` 引数指定）
- `apps/web/src/lib/seo/site-metadata.ts`（修正：`buildPageMetadata` が dynamic ogImage を受け取れることを再確認・必要なら型 doc コメント追加のみ）
- `apps/web/playwright/tests/public-metadata.spec.ts`（修正：member-specific og:image path / PNG response アサート追加）
- `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx`（**新規**：unit smoke / publicConsent=false ガード）

## スコープ外（本仕様内では新規バックログ化しない）

- sitemap / robots / root OG（#274 完了済み）
- API endpoint 追加 / D1 schema 変更
- 共通 fetch helper 化（callsite が 3 以上になるまで抽出しない。今回の新規未タスクにはしない）
- フォント埋め込み最適化は TC-4 の目視で tofu が出た場合に同一実装サイクル内で修正する。runtime / bundle 制約で同一サイクル修正が破綻すると判明した場合だけ、理由・実施時期・起票先を明記してエスカレーションする

## 不変条件

1. publicConsent=false の member 情報を含めない（`apps/api/src/routes/public/member-profile.ts` → `apps/api/src/use-cases/public/get-public-member-profile.ts` contract で公開許可された profile のみ使用）
2. styling は root OG と同じ gradient / color literal を流用する。`next/og` の Satori renderer は Tailwind / CSS variable を resolve しないため、`SITE` 定数や design token bridge には依存しない
3. D1 への直接アクセス禁止（`apps/web` から API 経由のみ）
4. OpenNext Cloudflare 互換前提（`next/og` `ImageResponse` を使用し、route-level `runtime = "edge"` は指定しない）
