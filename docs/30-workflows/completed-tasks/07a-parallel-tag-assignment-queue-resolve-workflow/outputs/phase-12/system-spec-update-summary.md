# system-spec 更新サマリー

## 仕様準拠状況

| 仕様 | 内容 | 本タスク反映 |
| --- | --- | --- |
| `specs/11-admin-management.md` | tag 付与は管理者レビュー経由 | resolve workflow で実装、admin gate で保護 |
| `specs/12-search-tags.md` | queue panel + resolve API | endpoint POST /admin/tags/queue/:queueId/resolve の body / error / idempotent 契約を反映 |
| `specs/08-free-database.md` | tag_assignment_queue / member_tags / audit_log | 既存 schema を維持しつつ `rejected` と alias 表を反映 |

## 仕様との drift / 解決

| drift | 解決 |
| --- | --- |
| 仕様 status (`candidate/confirmed/rejected`) vs 既存 02b (`queued/reviewing/resolved`) | application 層で alias 実装。DB 側は既存 status 値 + `rejected` を追加（CHECK 制約は元から無いため migration 不要） |
| 仕様 member_tags 列 (`tag_code, assigned_via_queue_id`) vs 既存 (`tag_id, source, assigned_by`) | workflow 内で tagCode → tag_id 解決、`source='admin_queue'`, `assigned_by=actorUserId` で記録 |

## 今回同期した正本仕様

- `docs/00-getting-started-manual/specs/12-search-tags.md`: request body shape、error code、idempotent 挙動、audit action
- `docs/00-getting-started-manual/specs/08-free-database.md`: `tag_assignment_queue.status` の 07a alias
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`: 管理バックオフィス API の 07a 契約
- `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md`: `resolveTagQueue(queueId, body)` 契約
