# Failure Cases

| # | case | trigger | 期待 | recovery | test |
| --- | --- | --- | --- | --- | --- |
| 1 | DB error (prepare 失敗) | D1 binding 未注入 | repository が throw、queue 行は変化なし | ログ + retry | runtime |
| 2 | UNIQUE 衝突 / idempotency | 同一 key で並行 INSERT | catch して既存行返却 (`isExisting=true`) | 正常応答 | createIdempotent.test |
| 3 | idempotency key 違うが同 (member, response) | 想定外 key 採番 | 別行作成（key 単位の idempotency） | 上位で key 採番統一 | deriveIdempotencyKey.test |
| 4 | retry transient error (attempt < N) | resolve 委譲先が一時失敗 | attempt+1, next_visible_at 更新 | backoff 後再試行 | incrementRetry.test |
| 5 | retry exhausted (attempt > MAX) | 上限超過 | status='dlq', dlq_at 確定 | admin による DLQ 確認 | incrementRetry dlq.test |
| 6 | DLQ poison message 誤再実行 | dlq 行への incrementRetry | guarded WHERE で no-op | 何も起きない | incrementRetry terminal.test |
| 7 | concurrent resolve race | 二重 markResolved | 一方のみ changes=1 | 敗者は no-op (`race_lost` error) | tagQueueResolve.test (既存) |
| 8 | resolve+reject race | 並行遷移 | 先勝ち、後者は changes=0 | UI 側で再 fetch | tagQueueResolve.test (既存) |
| 9 | unidirectional 違反 | resolved→rejected 直接遷移 | `RangeError` で reject | 不正経路として 409 | tagQueue.test (既存) |
| 10 | 02a memberTags.ts へ write 追加 | 開発者が誤 export 追加 | type-level test 失敗 | CI で reject | memberTags.readonly.test-d |
| 11 | clock skew | system clock 後退 | `now` 引数 deterministic | clock 修正 | runtime |
| 12 | audit_log INSERT 失敗 | constraint violation | 後続書き込みは guarded UPDATE 後のみ実行（07a workflow が担保） | log 調査 | tagQueueResolve.test (既存) |
| 13 | DLQ 移送中の re-entry | retry と移送並行 | guarded UPDATE 1 つのみ成功 | 整合性維持 | incrementRetry race assumption |

## audit 記録 (既存 07a workflow が担当)

| event | action key |
| --- | --- |
| enqueue 完了 | (本タスクでは workflow 経路で audit 経由。enqueueTagCandidate は audit 未発火・03b sync 側で sync_jobs に記録) |
| resolve 完了 | `admin.tag.queue_resolved` |
| reject 完了 | `admin.tag.queue_rejected` |
| DLQ 移送 | (将来の retry workflow で `admin.tag.queue_dlq_moved` を追加予定) |
