# Phase 9: 品質保証

## 静的解析

- typecheck: PASS (`mise exec -- pnpm --filter @ubm-hyogo/api typecheck`)
- lint: PASS (`mise exec -- pnpm --filter @ubm-hyogo/api lint`)

## テスト

- vitest: 397/397 PASS
  - `aliasRecommendation.test.ts` (8 tests)
  - `schemaAliasAssign.test.ts` (8 tests: question_not_found / apply / dryRun / collision / idempotent / backfill batch (250 行) / deleted_response_skip / diff_question_mismatch)
  - `schema.test.ts` (8 tests: 401 / GET diff / 400 / 200 apply / dryRun no-write / 422 collision / 400 regex / recommendedStableKeys 同梱)

## back-fill 性能（in-memory D1）

- 250 行 / 100 batch → 単一 request 内で完了 (test 実行時間内)
- 実環境での 10000 行計測は Phase 11 manual smoke で実施想定（本タスク未実施）
