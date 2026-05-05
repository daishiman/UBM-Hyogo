# Phase 6: 異常系検証 — 成果物

failure-cases.md にて 13 ケース + fail-closed 方針 + race / DLQ 境界 + audit 記録ルール を定義。

## fail-closed 方針

- `incrementRetry` / `moveToDlq` は `WHERE status='queued'` の guarded UPDATE。terminal 状態の行に対しては副作用なし（`{moved: 'noop'}` / `{changed: false}` を返す）。
- `createIdempotent` は UNIQUE 違反を catch し、既存行を返す（idempotent path）。
- `transitionStatus` は ALLOWED_TRANSITIONS に基づき不正遷移で throw。

## 異常系 test カバレッジ

- `incrementRetry: terminal 行（resolved / rejected / dlq）には触らない` (tagQueueIdempotencyRetry.test.ts)
- `moveToDlq: terminal 行は changed=false` (同上)
- `transitionStatus: resolved → reviewing は throw` (tagQueue.test.ts)
- `createIdempotent: 同一 key 二度目` (idempotency conflict)
- 既存 `tagQueueResolve.test.ts` の race / member_deleted / unknown_tag_code / state_conflict / idempotent_payload_mismatch
