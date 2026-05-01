# Documentation Changelog

| 日付 | 変更 | 影響範囲 |
| --- | --- | --- |
| 2026-05-01 | tag_assignment_queue Repository を idempotency / retry / DLQ 用途に拡張 | apps/api/src/repository/tagQueue.ts |
| 2026-05-01 | migration 0009 で idempotency_key UNIQUE / attempt_count / last_error / next_visible_at / dlq_at 列追加 | D1 schema (tag_assignment_queue) |
| 2026-05-01 | TagQueueStatus に dlq 状態を追加 | repository 型 / 状態遷移 |
| 2026-05-01 | retry/DLQ policy 確定: max=3, backoff=30s/60s/120s | workflow runtime（将来の retry tick） |
| 2026-05-01 | memberTags.ts read-only を type-level test で固定 | apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts |
| 2026-05-01 | spec-extraction-map で `assignTagsToMember` を allow list 例外として明示 | 02a 既存実装の意味付け |
