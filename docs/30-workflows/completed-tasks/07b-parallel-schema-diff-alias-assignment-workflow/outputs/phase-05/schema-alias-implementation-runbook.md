# 実装ランブック（実 DB 対応版）

## 実 DB と仕様書の差分吸収

| 仕様書記述 | 実 DB | 採用方針 |
|------|------|---------|
| `response_fields.questionId` | 存在しない（stable_key のみ） | extra field は `__extra__:<questionId>` 形式の stable_key で識別 |
| `response_fields.is_deleted` | 存在しない | `deleted_members.first_response_id` を NOT IN で除外 |
| `schema_versions.id` 列名 | `revision_id` | revision_id を schemaVersion 同等として扱う |
| `schema_diff_queue.status` enum | `queued / resolved` | `queued`, `resolved` |

## 擬似コード骨子

```ts
// services/aliasRecommendation.ts
function levenshtein(a: string, b: string): number { /* DP */ }
export function recommendAliases(
  diff: { label: string; sectionKey: string | null; position: number | null },
  existing: Array<{ stableKey: string; label: string; sectionKey: string; position: number }>,
  topN = 5,
): string[];

// workflows/schemaAliasAssign.ts
export async function schemaAliasAssign(
  c: DbCtx,
  input: SchemaAliasAssignInput,
): Promise<SchemaAliasAssignResult>;
```

主要 SQL:
- collision check: `SELECT count(*) AS c FROM schema_questions WHERE stable_key = ?1 AND revision_id = (SELECT revision_id FROM schema_questions WHERE question_id = ?2 ORDER BY revision_id DESC LIMIT 1) AND question_id != ?2`
- back-fill: `UPDATE response_fields SET stable_key = ?1 WHERE stable_key = ?2 AND response_id NOT IN (SELECT first_response_id FROM deleted_members WHERE first_response_id IS NOT NULL)`
  - LIMIT 句は SQLite UPDATE では非標準なので、affected を選択 → batch UPDATE で代替
- count for dryRun: `SELECT count(*) AS c FROM response_fields WHERE stable_key = ?1 AND response_id NOT IN (...)`

## sanity check

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test schemaAliasAssign
```
