# Phase 7 — contract test 補強 + database-schema.md 参照再確認

## sync-jobs-schema.test.ts 追加内容
- `expect(SYNC_JOB_TYPES).toEqual(["schema_sync", "response_sync"])` リテラル値断言
- `expect(SYNC_LOCK_TTL_MS).toBe(600000)` 数値リテラル断言
- 新テストケース「rejects email-shaped values even under non-PII keys」

## sync-jobs-schema.ts 補強
- `findPiiKeyPath` を `findPiiLeakPath` にリネーム（key/value 両側を検査）
- email 形式値 (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) を拒否
- error message を `PII key/value: <path>=<email>` 形式に拡張

## database-schema.md 確認
`sync_jobs` 節は既に `_design/sync-jobs-spec.md` 参照で統一済み。L57-59 に pageToken 非該当 / PII 拒否 / owner 表参照を追記。

## test 結果
`mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test` → PASS（exit 0）
