# Phase 6: 失敗系・障害設計レビュー

Phase 5 で実装した `runResponseSync` の失敗経路を全列挙し、実コードのハンドリングと
テスト被覆を突合した。詳細は `failure-cases.md` を参照。

## レビュー観点

1. **検出**: 失敗を検知できるか（throw / 戻り値 / log）
2. **隔離**: 失敗が他の sync を巻き込まないか（lock / job ledger）
3. **再開**: 次回 cron で安全に再実行できるか（cursor / idempotency）
4. **観測**: 何が起きたかが事後に分かるか（`sync_jobs.error_json` / `metrics_json`）

## 結論

- すべての失敗パターンに対し `sync_jobs` が `failed`（または `succeeded` の skipped）として残る
- `sync_locks` は finally で必ず release（ただし TTL 30min も保険として効く）
- cursor は `metrics_json.cursor` に **page 進捗の最終値** を書き戻すため、途中失敗の再開は
  「次回 cron で `readLastCursor()` → 最後に成功した直前の `nextPageToken` から再開」となる
- 重複 enqueue / upsert は DB レベルで idempotent（partial UNIQUE / PK upsert）
- AC-2 / AC-6 / AC-9 / AC-10 はすべて test で再現済み

→ 個別ケースは `failure-cases.md` に表で集約。
