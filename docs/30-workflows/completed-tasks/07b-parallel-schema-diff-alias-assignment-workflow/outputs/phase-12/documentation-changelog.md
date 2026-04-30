# Documentation Changelog

## Phase 12 Step 1-A / 1-B / 1-C / Step 2

| Step | 結果 | 証跡 |
| --- | --- | --- |
| Step 1-A 完了記録 | completed_without_pr / Phase 13 pending_user_approval として登録 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`, `indexes/resource-map.md` |
| Step 1-B 実装状況 | 07b workflow は implementation / NON_VISUAL / Phase 1-12 completed | `system-spec-update-summary.md`, `workflow-task-07b-parallel-schema-diff-alias-assignment-workflow-artifact-inventory.md` |
| Step 1-C 関連タスク | `UT-07B-schema-alias-hardening-001` / `UT-07B-alias-recommendation-i18n-001` を formalize 済み follow-up として登録 | `unassigned-task-detection.md`, `docs/30-workflows/unassigned-task/` |
| Step 2 システム仕様 | 新規 API response / dryRun apply contract / DB back-fill contract / audit action があるため更新あり | `api-endpoints.md`, `database-schema-07b-schema-alias-assignment.md`, `quick-reference.md` |

## Workflow-local changes

| 日付 | 変更 | 影響 |
|------|------|------|
| 2026-04-30 | `apps/api/src/workflows/schemaAliasAssign.ts` 新規追加（apply/dryRun/back-fill/audit） | apps/api |
| 2026-04-30 | `apps/api/src/services/aliasRecommendation.ts` 新規（Levenshtein + section/position score） | apps/api |
| 2026-04-30 | `apps/api/src/routes/admin/schema.ts` 拡張: ?dryRun=true / 422 collision / recommendedStableKeys 同梱 | apps/api |
| 2026-04-30 | audit_log action 名を `schema_diff.alias_assigned` に確定（旧 `admin.schema.alias_assigned` から変更） | audit |
| 2026-04-30 | 削除済 response の back-fill skip を `member_identities ⋈ deleted_members` 経由で実装 | apps/api |

## Global skill sync

| 日付 | 変更 | 影響 |
| --- | --- | --- |
| 2026-04-30 | aiworkflow-requirements に 07b API / DB / lessons / artifact inventory / indexes を同期 | system spec |
| 2026-04-30 | `database-schema.md` 500行制限対応として 07b DB workflow を semantic child file へ分離 | system spec |
| 2026-04-30 | task-specification-creator に実 DB schema grep / dryRun apply union / Phase 12 Step 2 再判定を反映 | skill |
| 2026-04-30 | skill-creator の Phase 12 retrospective template に internal hardening 例示を追加 | skill |
