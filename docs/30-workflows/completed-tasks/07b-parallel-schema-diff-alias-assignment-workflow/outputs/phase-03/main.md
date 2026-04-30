# Phase 3: 設計レビュー

| 案 | 概要 | 判定 | 採否 |
|----|------|------|------|
| A | resolved → queued 再オープン可能 | MAJOR | 不採用（不変条件 #14 violate） |
| B | dryRun を GET 別 endpoint | MINOR | 不採用（POST + ?dryRun=true で統合） |
| C | back-fill cron 分割 | MINOR | 現時点不採用（性能超過時に再評価） |
| Phase 2 採用案 | unidirectional + tx + dryRun 統合 + 同期 back-fill | PASS | 採用 |

## handoff to Phase 4

採用設計:
- workflow path: `apps/api/src/workflows/schemaAliasAssign.ts`
- recommend service: `apps/api/src/services/aliasRecommendation.ts`
- 既存 `apps/api/src/routes/admin/schema.ts` を拡張（新規 `schemaDiff.ts` を作らず既存集約を維持）
