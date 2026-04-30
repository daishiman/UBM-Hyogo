# Phase 5 サマリー

詳細: `schema-alias-implementation-runbook.md`。

## 作成順

1. `apps/api/src/services/aliasRecommendation.ts` (Levenshtein + score)
2. `apps/api/src/workflows/schemaAliasAssign.ts` (apply/dryRun/back-fill/audit)
3. `apps/api/src/routes/admin/schema.ts` 拡張（dryRun query / recommend embed / 422 / 409）
4. tests
