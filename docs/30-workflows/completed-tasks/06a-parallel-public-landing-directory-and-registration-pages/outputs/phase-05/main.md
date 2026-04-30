# Phase 5 成果物 — 実装ランブックサマリ

## 概要

4 ルート (`/`, `/members`, `/members/[id]`, `/register`) を Next.js App Router + RSC で実装。本 Phase は runbook ドキュメント (`runbook.md`) に加えて apps/web 配下の実コードまで完了している。

## 実装結果サマリ

| route | ファイル | 種別 | revalidate |
| --- | --- | --- | --- |
| `/` | `apps/web/app/page.tsx` | RSC | 60s |
| `/members` | `apps/web/app/(public)/members/page.tsx` | RSC | 30s |
| `/members` filter | `apps/web/app/(public)/members/_components/MembersFilterBar.client.tsx` | Client | - |
| `/members` list | `apps/web/app/(public)/members/_components/MemberList.tsx` | RSC | - |
| `/members/[id]` | `apps/web/app/(public)/members/[id]/page.tsx` | RSC | 60s |
| `/register` | `apps/web/app/(public)/register/page.tsx` | RSC | 600s |
| error | `apps/web/app/error.tsx` | Client | - |
| 404 | `apps/web/app/not-found.tsx` | RSC | - |

## 共通インフラ

| ファイル | 役割 |
| --- | --- |
| `apps/web/src/lib/fetch/public.ts` | `fetchPublic<T>` / `fetchPublicOrNotFound<T>` |
| `apps/web/src/lib/url/members-search.ts` | `membersSearchSchema`, `parseSearchParams`, `toApiQuery` |
| `apps/web/src/components/feedback/EmptyState.tsx` | 共通空状態 |
| `apps/web/src/components/public/Hero.tsx` | ランディング Hero |
| `apps/web/src/components/public/StatCard.tsx` | 統計表示 |
| `apps/web/src/components/public/MemberCard.tsx` | メンバーカード（density 対応） |
| `apps/web/src/components/public/Timeline.tsx` | 最近の支部会 |
| `apps/web/src/components/public/ProfileHero.tsx` | 詳細ページ Hero |
| `apps/web/src/components/public/FormPreviewSections.tsx` | form-preview の section 表示 |

## 実行コマンドと結果

| コマンド | 結果 |
| --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | error 0 |
| `mise exec -- pnpm vitest run apps/web/src/lib/url/__tests__/members-search.test.ts` | 10 passed / 10 |

## サブタスク

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | layout.tsx | completed (既存活用) |
| 2 | / 実装 | completed |
| 3 | /members 実装 | completed |
| 4 | /members/[id] 実装 | completed |
| 5 | /register 実装 | completed |
| 6 | ESLint rule 設計 | designed (placeholder, runbook 記載) |
| 7 | sanity check | partial (typecheck + unit pass、dev server smoke は Phase 11) |

## 完了条件

- [x] 4 page の実装完了（placeholder ではなく動作コード）
- [x] ESLint rule placeholder（runbook.md にルール案記載）
- [ ] sanity check S-01〜S-07: typecheck / unit pass。dev server smoke は Phase 11 で実施
- [x] secret 値を含まない
