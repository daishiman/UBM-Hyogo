# Implementation Runbook

## 状態 alias

| 仕様語 | DB 実装語 |
| --- | --- |
| candidate | queued |
| reviewing | reviewing |
| confirmed | resolved |
| rejected | rejected |
| (DLQ) | dlq |

## 実施した変更ファイル一覧

| 種別 | path | 変更内容 |
| --- | --- | --- |
| migration | `apps/api/migrations/0009_tag_queue_idempotency_retry.sql` | 新規。tag_assignment_queue に idempotency_key / attempt_count / last_error / next_visible_at / dlq_at 列を追加し、partial unique index と pending/dlq 用 index を作成。 |
| repository | `apps/api/src/repository/tagQueue.ts` | `dlq` を `TagQueueStatus` に追加し `ALLOWED_TRANSITIONS` を拡張。`TagAssignmentQueueRow` に新規 5 列を追加。`findByIdempotencyKey / createIdempotent / listPending / listDlq / incrementRetry / moveToDlq / deriveIdempotencyKey` を追加。 |
| test (unit) | `apps/api/src/repository/tagQueueIdempotencyRetry.test.ts` | 新規。createIdempotent / findByIdempotencyKey / listPending / listDlq / incrementRetry / moveToDlq の 12 ケース。 |
| test (type) | `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` | 新規。memberTags.ts に `insert*/update*/delete*/upsert*` 接頭辞の export が無いことを assert。 |

## 既存（変更していない）ファイル

| path | 役割 |
| --- | --- |
| `apps/api/src/workflows/tagCandidateEnqueue.ts` | 03b sync hook 入口（`enqueueTagCandidate(c, { memberId, responseId })`）。AC-10 を既に満たす。 |
| `apps/api/src/workflows/tagQueueResolve.ts` | 07a 側 resolve workflow。本タスクの transitionStatus 経路と integrate 済。 |
| `apps/api/src/repository/memberTags.ts` | read-only 規約維持（assignTagsToMember は 07a 専用 helper として allow list）。 |

## migration 反映手順

```bash
# local (miniflare)
mise exec -- pnpm -F @repo/api d1:migrate:local

# staging
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-stg --env staging

# production
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

## sanity check

```bash
mise exec -- pnpm -F @repo/api typecheck
mise exec -- pnpm --filter @repo/api exec vitest run --no-coverage tagQueue tagCandidateEnqueue tagQueueResolve memberTags
```

## 02b との衝突回避

| 衝突点 | 回避策 |
| --- | --- |
| `memberTags.ts` 編集 | 本タスクは触らない（read-only 維持） |
| `tag_assignment_queue` migration | 0009 連番で追加（既存 0002 への ALTER のみ） |
| 関数命名 | 既存 `enqueue / transitionStatus` を維持し、新規は `createIdempotent / incrementRetry / moveToDlq` |
