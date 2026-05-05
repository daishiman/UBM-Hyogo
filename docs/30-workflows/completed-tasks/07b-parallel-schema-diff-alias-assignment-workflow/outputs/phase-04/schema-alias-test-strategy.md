# schema-alias-test-strategy

| layer | path | 観点 |
|-------|------|------|
| unit (workflow) | apps/api/src/workflows/schemaAliasAssign.test.ts | apply / dryRun / collision / idempotent / deleted skip / back-fill |
| unit (service) | apps/api/src/services/aliasRecommendation.test.ts | Levenshtein + section/index スコア順、empty existing |
| route | apps/api/src/routes/admin/schema.test.ts | 401/403, dryRun query, 422 collision, recommend embed |
| contract | 同上 | response shape (mode union) |

## 主な test cases

- `apply_updates_stable_key`
- `dryRun_no_write`
- `collision_422`
- `idempotent_apply` (re-apply not double-audited)
- `deleted_response_skip`
- `audit_apply_recorded`
- `audit_dryRun_no_record`
- `recommend_score_order`
- `recommend_empty_existing`
- `backfill_batch_loop` (250 行 fixture → 3 batch 100/100/50)
- `backfill_idempotent_resume`
- `unauthorized_401`
- `non_admin_403`
- `diff_recommend_embed`
