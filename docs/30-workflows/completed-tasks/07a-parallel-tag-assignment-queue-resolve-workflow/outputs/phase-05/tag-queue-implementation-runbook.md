# tag_queue 実装 runbook（実装結果反映済み）

## 作成順 (実装結果)

| # | path | 種別 | 状態 |
| --- | --- | --- | --- |
| 1 | `apps/api/src/repository/tagQueue.ts` | 既存更新 | `TagQueueStatus` に `rejected` 追加、`ALLOWED_TRANSITIONS` 拡張 |
| 2 | `apps/api/src/repository/tagQueue.test.ts` | 既存更新 | 新規許可遷移を反映 |
| 3 | `apps/api/src/schemas/tagQueueResolve.ts` | 新規 | zod discriminatedUnion |
| 4 | `apps/api/src/schemas/tagQueueResolve.test.ts` | 新規 | schema 6 ケース |
| 5 | `apps/api/src/workflows/tagQueueResolve.ts` | 新規 | resolve workflow 本体 |
| 6 | `apps/api/src/workflows/tagQueueResolve.test.ts` | 新規 | 12 ケース |
| 7 | `apps/api/src/workflows/tagCandidateEnqueue.ts` | 新規 | 03b sync hook |
| 8 | `apps/api/src/workflows/tagCandidateEnqueue.test.ts` | 新規 | 4 ケース |
| 9 | `apps/api/src/routes/admin/tags-queue.ts` | 既存差し替え | workflow 呼び出しに変更 |
| 10 | `apps/api/src/routes/admin/tags-queue.test.ts` | 既存差し替え | route 11 ケース |
| 11 | `apps/api/src/jobs/sync-forms-responses.ts` | 既存追記 | step 7: enqueueTagCandidate hook |

## 設計上のメモ

- migration ファイルは作成不要（既存 schema は `status TEXT` で CHECK 制約なし。`rejected` 値は application 層で管理）
- audit_log の action は `admin.tag.queue_resolved` を継続、`admin.tag.queue_rejected` を新規 brand として追加（`auditAction()` helper で動的生成）
- 既存 `assignTagsToMember` (memberTags.ts) は production code から caller がなくなった。本タスクでは削除しないが、Phase 9 で言及する

## sanity check 実行結果

```bash
$ mise exec -- pnpm -F @ubm-hyogo/api typecheck
# OK (0 errors)

$ mise exec -- pnpm -F @ubm-hyogo/api lint
# OK (0 errors, lint=tsc)

$ mise exec -- pnpm -F @ubm-hyogo/api test
# 69 files / 405 tests passed
```
