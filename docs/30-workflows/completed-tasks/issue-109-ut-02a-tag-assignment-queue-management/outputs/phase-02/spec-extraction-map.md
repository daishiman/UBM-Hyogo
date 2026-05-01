# Spec ↔ 実装語 対応表

| 仕様語（docs / UI） | 実装語（DB / API / repository） | 出現箇所 | 備考 |
| --- | --- | --- | --- |
| candidate | `queued` | column `status`, repo enum, `tagCandidateEnqueue.ts` | 入口の状態 |
| reviewing | `reviewing` | column `status`, repo enum | 02b 既存・admin 手動レビュー中 |
| confirmed | `resolved` | column `status`, repo enum, `tagQueueResolve.ts` | 07a が遷移 |
| rejected | `rejected` | column `status`, repo enum | 仕様 / 実装一致 |
| (DLQ) | `dlq` | column `status` 拡張（本タスクで導入） | retry 上限超過 |
| 投入 | `enqueue` / `enqueueTagCandidate` / `createIdempotent` | repo function 名 | |
| 解決 | `resolve` / `transitionStatus` / `tagQueueResolve` | repo function / 07a workflow | |
| べき等性キー | `idempotency_key` | column（本タスクで追加） | UNIQUE |
| 再試行回数 | `attempt_count` | column（本タスクで追加） | retry counter |
| 最終エラー | `last_error` | column（本タスクで追加） | DLQ 用 |
| 次回可視時刻 | `next_visible_at` | column（本タスクで追加） | 指数バックオフ |
| DLQ 移送時刻 | `dlq_at` | column（本タスクで追加） | DLQ entry timestamp |

## ファイル path 差分

| 仕様書 | 採用 path（既存規約準拠） | 理由 |
| --- | --- | --- |
| `apps/api/src/repositories/tagAssignmentQueue.ts` | `apps/api/src/repository/tagQueue.ts` | 既存 monorepo 規約は `repository/`（単数）、ファイル名は `tagQueue.ts`。新規拡張のみ既存ファイルへ追加。 |
| `apps/api/src/schemas/tagAssignmentQueue.ts` | `apps/api/src/schemas/tagQueueResolve.ts`（既存） + `tagQueueEnqueue.ts`（新規 / Phase 5 で必要に応じて追加） | 既存 schema を流用。 |
| `apps/api/src/lib/queue/` | 未採用（YAGNI） | 02b/03a と共有可能 helper は将来 Phase 8 で必要なら導入する。本タスクでは inline 実装。 |

## memberTags.ts 既存差分

| 項目 | 仕様書記述 | 実態 | 採用方針 |
| --- | --- | --- | --- |
| `memberTags.ts` の write API | 「export しない（read-only）」 | `assignTagsToMember` が export されている（07a workflow から呼ばれる） | 既存 export を維持（07a 経路の helper として認識）。本タスクでは新規 write 関数追加禁止を type-level test で担保。`apps/web` からの呼び出しは存在しないことを grep で実証。 |
