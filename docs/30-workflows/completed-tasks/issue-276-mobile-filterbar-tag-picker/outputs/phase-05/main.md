# Phase 5: API 実装（topTags 集計）— 実装サマリ

## 実装変更（実コード）

| ファイル | 変更内容 |
|---------|---------|
| `packages/shared/src/zod/viewmodel.ts` | `PublicMemberListViewZ` に `topTags` フィールド追加（`max(20)`） |
| `packages/shared/src/types/viewmodel/index.ts` | `PublicMemberListView` TS 型に `topTags` 反映 |
| `packages/shared/src/zod/viewmodel.spec.ts` | strict reject ケースで `topTags` を必須化、上限テスト追加 |
| `apps/api/src/repository/publicMembers.ts` | `aggregateTopTags(c)` 新規追加。D1 集計 SQL（公開境界 + `td.active=1` + alias 除外 + ORDER BY count DESC, code ASC LIMIT 20） |
| `apps/api/src/use-cases/public/list-public-members.ts` | `Promise.all` に `aggregateTopTags` を合流 |
| `apps/api/src/view-models/public/public-member-list-view.ts` | `PublicMemberListSource.topTags` を含めて `PublicMemberListResponseZ.parse` に渡す |
| `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` | mock D1 に `topTags` fixture / SQL dispatch を追加 |
| `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | topTags assertion 追加（happy / empty） |
| `apps/api/src/view-models/public/__tests__/public-member-list-view.spec.ts` | fixture に topTags 追加 |
| `apps/api/src/routes/public/index.contract.spec.ts` | topTags assertion + 専用 contract test 追加 |
| `apps/web/src/lib/api/__tests__/public.spec.ts` | response fixture に topTags 追加 |
| `apps/web/playwright/fixtures/auth.ts` | mock public members fixture に topTags 追加 |

## ローカル検証結果

- `mise exec -- pnpm typecheck` → green（packages/shared / apps/api / apps/web 全て pass）
- `mise exec -- pnpm --filter @ubm-hyogo/shared test` → 19 files / 231 tests pass
- `mise exec -- pnpm --filter @ubm-hyogo/api test` → 50 files / 322 tests pass（新規 contract test 含む）
- `mise exec -- pnpm lint` → green（dependency-cruiser / stable-key / eslint 全て pass）

## DoD

- [x] shared / api テスト green
- [x] contract spec の topTags assertion pass
- [x] 全 fixture（unit / contract / playwright）に topTags 反映
- [x] apps/web typecheck green（Phase 6 で UI 側 prop 反映済）
