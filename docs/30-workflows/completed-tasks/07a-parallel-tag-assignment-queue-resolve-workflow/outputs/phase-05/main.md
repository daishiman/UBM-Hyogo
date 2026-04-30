# Phase 5: 実装ランブック — outputs

[tag-queue-implementation-runbook.md](./tag-queue-implementation-runbook.md) に擬似コード一式と作成順を確定。

## 作成順 (5 → 1 ファイル順依存)

1. `apps/api/migrations/0007_tag_queue_rejected_status.sql` — rejected status 受容（schema 不変条件確認）
2. `apps/api/src/repository/_shared/brand.ts` 追記 — `admin.tag.queue_rejected` audit action を brand に追加
3. `apps/api/src/repository/tagQueue.ts` 更新 — `TagQueueStatus` に `rejected` 追加、`ALLOWED_TRANSITIONS` 拡張、`updateStatusWithGuard` 追加
4. `apps/api/src/schemas/tagQueueResolve.ts` 新規 — zod discriminatedUnion
5. `apps/api/src/workflows/tagQueueResolve.ts` 新規 — workflow 本体
6. `apps/api/src/workflows/tagCandidateEnqueue.ts` 新規 — 03b hook
7. `apps/api/src/routes/admin/tags-queue.ts` 差し替え — workflow 呼び出しに変更
8. test files（4 ファイル）

## sanity check

```bash
mise exec -- pnpm -F @ubm-hyogo/api typecheck
mise exec -- pnpm -F @ubm-hyogo/api lint
mise exec -- pnpm -F @ubm-hyogo/api test
```
