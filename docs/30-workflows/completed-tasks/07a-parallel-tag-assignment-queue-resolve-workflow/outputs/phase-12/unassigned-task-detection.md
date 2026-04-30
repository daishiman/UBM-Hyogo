# 未タスク検出

## 本タスクで顕在化した未タスク（別タスクへ handoff）

| 件 | 内容 | 推奨 owner |
| --- | --- | --- |
| UT-07A-01 | `apps/api/src/repository/memberTags.ts` の `assignTagsToMember` は production caller がなくなった。削除 or 内部利用限定の cleanup を別タスクで実施 | refactor / 02b の後続 |
| UT-07A-02 | `specs/12-search-tags.md` に resolve API 契約（zod 構造、error code、idempotent 挙動）を追記 | docs |
| UT-07A-03 | race_lost (UPDATE changes=0) の実機テスト。in-memory D1 では再現困難。staging で並行 POST する smoke を 08b に組み込む | 08b |
| UT-07A-04 | `assigned_via_queue_id` を member_tags に正式に追加するか検討（仕様準拠 vs 既存 schema 維持の trade-off） | 08c 以降の長期検討 |

いずれも本タスク (07a) の AC には影響せず、blocking ではない。

## 実体化済みファイル

- `docs/30-workflows/unassigned-task/UT-07A-01-member-tags-assign-cleanup.md`
- `docs/30-workflows/unassigned-task/UT-07A-02-search-tags-resolve-contract-followup.md`
- `docs/30-workflows/unassigned-task/UT-07A-03-tag-queue-race-smoke.md`
- `docs/30-workflows/unassigned-task/UT-07A-04-member-tags-assigned-via-queue-id-decision.md`
