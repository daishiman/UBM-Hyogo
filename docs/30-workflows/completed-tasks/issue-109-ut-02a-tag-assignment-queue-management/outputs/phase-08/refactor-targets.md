# Refactor Targets

| target | path | 採用 | 理由 |
| --- | --- | --- | --- |
| status enum 共通化 | `apps/api/src/repository/tagQueue.ts` 内 `TagQueueStatus` | as-is | 単一所有 |
| guarded UPDATE wrapper | `apps/api/src/lib/d1Tx.ts` への切り出し | 不採用 | 02b との共通化が将来課題になる時に再検討 |
| audit emit | 07a `tagQueueResolve.ts` 既存実装で十分 | 維持 | 重複なし |
| idempotency helper | `deriveIdempotencyKey` を repository 内 export | 採用 | 03b sync 側でも参照可能 |

DRY 化の追加対象なし。命名統一は本タスクで完了。
