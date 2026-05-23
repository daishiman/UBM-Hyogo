# Phase 5 成果物: 実装サマリ

source: `../../phase-5-implementation.md` に準拠。

## 実コード変更（git diff --stat 反映）

| ファイル | 種別 | 内容 |
|---|---|---|
| `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` | 新規 | next/og ImageResponse による member 固有 OG 画像 route |
| `apps/web/app/(public)/members/[id]/page.tsx` | 修正 | `generateMetadata` に `ogImage: /members/<id>/opengraph-image` 追加 |
| `apps/web/src/lib/seo/site-metadata.ts` | 修正 | `PageMetaInput.ogImage` に doc comment 追加 |
| `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx` | 新規 | Vitest unit smoke (4 cases) |
| `apps/web/playwright/tests/public-metadata.spec.ts` | 修正 | member-specific og:image / PNG / 404 の 3 ケース追加 |

## 実装上の決定

- `params` 型は `Promise<{ id: string }> | { id: string }` 両対応とし、`await Promise.resolve(params)` で正規化（Next.js 16 App Router 互換 + テスト容易性）。
- unit test では `next/og` を mock化（実 ImageResponse は Vitest node 環境では起動コスト高）。
- `FetchPublicNotFoundError` クラスの import が circular にならないよう `vi.mock` 内に inline class を定義。

## 実行結果

- `pnpm typecheck`: ✓ PASS
- `pnpm lint`: ✓ PASS
- `pnpm --filter @ubm-hyogo/web test -- opengraph-image`: ✓ 4 tests PASS
- `pnpm --filter @ubm-hyogo/web build`: ✓ PASS（`/members/[id]/opengraph-image-1kt88e` route 登録確認）
