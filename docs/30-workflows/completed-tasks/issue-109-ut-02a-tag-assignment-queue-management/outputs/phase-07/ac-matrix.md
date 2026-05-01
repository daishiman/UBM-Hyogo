# AC マトリクス

| AC | 内容 | 検証 (test) | 実装 (code) | 異常系 (case) | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | CRUD: enqueue / findById / listQueue / listPending / listDlq | tagQueue.test.ts (9 件) + tagQueueIdempotencyRetry.test.ts (listPending / listDlq) | apps/api/src/repository/tagQueue.ts | #1 DB error | #5 |
| AC-2 | 状態遷移 unidirectional | tagQueue.test.ts (transitionStatus / isAllowedTransition) | tagQueue.ts ALLOWED_TRANSITIONS + transitionStatus | #9 unidirectional 違反 | #13 |
| AC-3 | idempotency key で重複 INSERT 防止 | tagQueueIdempotencyRetry.test.ts (createIdempotent 同一 key) | createIdempotent / findByIdempotencyKey | #2 / #3 | #5 |
| AC-4 | retry 指数バックオフ + DLQ 隔離 | tagQueueIdempotencyRetry.test.ts (incrementRetry / moveToDlq) | incrementRetry / moveToDlq + 0009 migration | #4 / #5 / #6 | fail-closed |
| AC-5 | memberTags.ts read-only 維持 | memberTags.readonly.test-d.ts (typecheck) | memberTags.ts に新規 write 関数を追加していない | #10 read-only 違反 | #13 |
| AC-6 | apps/web から本 repository 直接参照なし | grep（Phase 9 quality-report） | repository は apps/api 配下のみ | #11 boundary violation | #5 |
| AC-7 | enqueue / transition / DLQ 移送で audit_log 観測点 | tagQueueResolve.test.ts (admin.tag.queue_resolved/rejected の audit 件数) | tagQueueResolve.ts 内 audit INSERT | #12 audit 失敗 | 監査 |
| AC-8 | 仕様語↔実装語対応表が固定 | spec-extraction-map.md（grep 一致） | TagQueueStatus enum + ALLOWED_TRANSITIONS | #13 alias drift | #13 |
| AC-9 | migration × repository 列が一致 | migration-grep-table.md | 0002 + 0009 migration と tagQueue.ts DbRow | #1 migration drift | #5 |
| AC-10 | enqueueTagCandidate(env, payload) の 1 行公開 API | tagCandidateEnqueue.test.ts (4 件) | apps/api/src/workflows/tagCandidateEnqueue.ts | hook signature drift | #5 / #13 |

## 不変条件 → AC マッピング

| 不変条件 | 内容 | 対応 AC |
| --- | --- | --- |
| #5 | D1 直接アクセスは apps/api に閉じる | AC-1, AC-3, AC-6, AC-9, AC-10 |
| #13 | member_tags 書込みは 07a queue resolve 経由のみ | AC-2, AC-5, AC-7, AC-8, AC-10 |

## 抜け漏れチェック

- [x] 全 10 AC に検証手段
- [x] 全 10 AC に実装位置
- [x] 不変条件 #5 / #13 に対応 AC 紐付け
- [x] 02a memberTags.ts read-only を type-level + spec で二重担保
- [x] retry / DLQ / idempotency すべてに test と異常系 case
