# System Spec 更新概要

## specs/01-api-schema.md

- stableKey は `schema_questions` で管理し、コードに固定しない（不変条件 #1）を本 workflow が体現
- `__extra__:<questionId>` 形式は extra field の中間表現として実装上維持される

## specs/11-admin-management.md

- `/admin/schema` 集約 (不変条件 #14) は schemaAliasAssign workflow が UPDATE schema_questions の単独 path を担う形で実現

## specs/08-free-database.md

- `schema_diff_queue.status` enum は `queued | resolved` を継続採用（仕様書の `queued | resolved` は意味的同義）
- `schema_questions` の同 revision_id 内 stable_key UNIQUE は workflow 側 pre-check で保証（DB UNIQUE INDEX 化は別タスクで検討余地あり）

## 実装上の差分注記

実 DB schema には `response_fields.questionId` / `response_fields.is_deleted` が存在しないため:
- extra field 識別: `stable_key='__extra__:<questionId>'`
- 削除 skip: `member_identities ⋈ deleted_members` 経由
