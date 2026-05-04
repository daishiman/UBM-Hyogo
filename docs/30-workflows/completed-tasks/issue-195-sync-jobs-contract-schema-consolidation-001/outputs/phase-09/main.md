# Phase 9 — indexes 再生成 + 検証実行

## indexes:rebuild
`mise exec -- pnpm indexes:rebuild` 完了。`indexes/topic-map.md` に line-number shift（database-schema.md L57-59 追記分）が反映され、idempotent state を確認（2 回連続 rebuild で同一結果）。

## typecheck / lint / test
- `mise exec -- pnpm typecheck` → exit 0
- `mise exec -- pnpm lint` → exit 0
- `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test` → exit 0
