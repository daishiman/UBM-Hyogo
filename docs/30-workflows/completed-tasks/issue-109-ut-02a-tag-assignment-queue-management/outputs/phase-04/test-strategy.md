# Test Strategy

## 4 層分担

| layer | tool | scope | 担当ファイル |
| --- | --- | --- | --- |
| unit | vitest + fake D1 | repository CRUD / state guard / idempotency / retry / DLQ | `apps/api/src/repository/tagQueue.test.ts`（既存・拡張）+ `tagQueueIdempotencyRetry.test.ts`（新規） |
| integration | vitest + setupD1 (in-memory) | enqueueTagCandidate / tagQueueResolve | `apps/api/src/workflows/tagCandidateEnqueue.test.ts`（既存）/ `tagQueueResolve.test.ts`（既存） |
| contract | vitest | repository 戻り値 shape | 既存 unit test に統合 |
| type-level | vitest typecheck | memberTags.ts read-only export 規約 | `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts`（新規） |

## test 計画

### tagQueue (unit, 既存)

- isAllowedTransition の許可/不許可（既存）
- enqueue / findById / listQueue（既存）
- transitionStatus 各方向（既存）

### tagQueue idempotency / retry / DLQ (unit, 新規)

| test | 期待 |
| --- | --- |
| `createIdempotent: 新規 key で行作成・isExisting=false` | INSERT 成功 |
| `createIdempotent: 同一 key 二度目で isExisting=true` | INSERT 副作用なし、既存 row 返却 |
| `incrementRetry: attempt < N で next_visible_at が指数バックオフ` | attempt+1 |
| `incrementRetry: attempt == N で status='dlq'` | DLQ 移送 |
| `moveToDlq: queued のみ DLQ 化 (terminal は changes=0)` | guarded UPDATE |
| `findByIdempotencyKey` | 1 件返却 |
| `listPending: next_visible_at <= now のみ` | filter |
| `listDlq: status='dlq' のみ` | filter |

### memberTags read-only (type-level, 新規)

| test | 期待 |
| --- | --- |
| `types.memberTagsRepo_no_new_write_export` | `insert*`/`update*`/`delete*`/`upsert*` 接頭辞の export 0 件 |

`assignTagsToMember` は既存特例として allow list に明示記録。

## mock / fixture

- D1: `createFakeD1` 経由 unit、`setupD1` 経由 integration
- clock: 引数 `now: string` を repository が受け取る pattern
- fixture: 既存 `tagQueue.test.ts` の `seed()` を流用

## AC × test 紐付け

| AC | test |
| --- | --- |
| AC-1 | tagQueue unit 既存 |
| AC-2 | transitionStatus + isAllowedTransition unit |
| AC-3 | createIdempotent unit |
| AC-4 | incrementRetry / moveToDlq unit |
| AC-5 | memberTags read-only type-level |
| AC-6 | grep（Phase 9 quality-report） |
| AC-7 | tagQueueResolve.test.ts （audit assertion） |
| AC-8 | spec-extraction-map.md + grep |
| AC-9 | migration-grep-table.md |
| AC-10 | tagCandidateEnqueue.test.ts（既存） |
