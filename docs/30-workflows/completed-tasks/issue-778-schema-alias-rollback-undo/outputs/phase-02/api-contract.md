# Phase 2 output: API contract

[実装区分: 実装仕様書]

## endpoint

`POST /admin/schema/aliases/:aliasId/rollback`

## request

| 項目 | 値 |
| --- | --- |
| auth | `requireAdmin` middleware（既存と同じ） |
| header `If-Match` | `version=<N>` 必須（楽観ロック） |
| body | `{ "reason"?: string }` (optional, max 500 chars) |
| content-type | application/json |

## response 200

```json
{
  "aliasId": "uuid-string",
  "rolledBackAt": "2026-05-19T03:00:00.000Z",
  "relatedAuditId": "uuid-string",
  "newVersion": 2,
  "impact": {
    "affectedResponseCount": 3,
    "recomputeRequired": true
  }
}
```

## response error

| status | kind | 状況 |
| --- | --- | --- |
| 400 | `bad_request` | `If-Match` ヘッダ欠落 / 不正フォーマット / `reason` が 500 chars 超 |
| 403 | `forbidden` | non-admin actor（middleware が返却） |
| 404 | `not_found` | aliasId 該当行なし |
| 404 | `already_deleted` | `deleted_at IS NOT NULL` |
| 409 | `version_mismatch` | `expectedVersion != row.version` または batch 更新行数 0 |
| 500 | `batch_failed` | `db.batch` 内のいずれかの statement が throw |

error body 共通: `{ "error": "<kind>", "message": "<human readable>" }`

## transaction

```
db.batch([
  // 1. schema_aliases soft delete with optimistic lock
  UPDATE schema_aliases
    SET deleted_at = ?now, deleted_by = ?actor, version = version + 1
    WHERE id = ?aliasId AND version = ?expectedVersion AND deleted_at IS NULL,

  // 2. schema_diff_queue restore to queued
  UPDATE schema_diff_queue
    SET status = 'queued'
    WHERE question_id = ?aliasQuestionId AND status = 'resolved',

  // 3. audit_log insert with after_json.relatedAuditId
  INSERT INTO audit_log
    (audit_id, actor_email, action, target_type, target_id, before_json, after_json, created_at)
    VALUES (?auditId, ?actor, 'schema_alias.rollback', 'schema_alias', ?aliasId, ?beforeJson, ?afterJson, ?now),
])
```

batch[0].meta.changes = 0 → version_mismatch として 409 を返す。

## 影響件数算出

batch とは別 query（read-only、副作用なし）:

```sql
SELECT COUNT(*) AS c FROM responses WHERE stable_key = ?
```

- `affectedResponseCount = c`
- `recomputeRequired = c > 0`

## undo との関係

undo 経路も同一 endpoint を使用。UI 側で「resolve 直後 5 分以内かどうか」を判定するだけで、API 側は rollback と完全に同じ動作。

## 既存 endpoint との干渉

| 既存 | 干渉 |
| --- | --- |
| `POST /admin/schema/aliases` (resolve) | 無し。path namespace 分離 |
| `GET /admin/schema/diff` | 無し。`WHERE deleted_at IS NULL` 追加で出力上の整合は維持 |

## OpenAPI / spec 反映先

- `docs/00-getting-started-manual/specs/01-api-schema.md` admin endpoint 一覧に追加（Phase 08）
