# Phase 6: 異常系検証

| case | http | recovery |
|------|------|----------|
| 401 session 切れ | 401 | UI 再 login |
| 403 non-admin | 403 | admin 申請 |
| 404 question | 404 | UI 再 fetch |
| 404 diff | 404 | UI 再 fetch |
| 409 diff questionId 不一致 | 409 | diff 再選択 |
| 422 collision | 422 | 別 stableKey 選択 |
| 422 zod (空 stableKey) | 400 | 入力修正 |
| race condition | 409 | UI 再 fetch (UNIQUE 二段防御) |
| D1 batch failure | 5xx | retry |
| audit INSERT 失敗 | 5xx | 手動補完、再 apply で idempotent |
| back-fill CPU 超過 | 5xx (Retryable) | 同 endpoint 再 apply で続行 |
| dryRun 書き込み regression | test 失敗 | code 修正 |

## race condition

`UPDATE schema_diff_queue SET status='resolved' WHERE diff_id=? AND status='queued'` の meta.changes が 0 なら他者既 resolved → 409。

## back-fill 中断耐性

stable_key が既に新値の行は WHERE で除外される（`stable_key = '__extra__:<questionId>'` 条件）ため再 apply で重複なく続行。
