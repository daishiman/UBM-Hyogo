# Manual Smoke Log

## 実行環境

- Node 24.15.0 / pnpm 10.33.2 (mise managed)
- vitest + miniflare in-memory D1

## 実行コマンドと結果

| # | コマンド | 結果 |
| --- | --- | --- |
| 1 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS (exit 0) |
| 2 | `mise exec -- pnpm --filter @ubm-hyogo/api lint` | PASS (exit 0) |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/api test -- --run` | 68 files / 407 tests PASS |
| 4 | `sqlite3` local schema replay + `EXPLAIN QUERY PLAN ... request_status='pending'` | PASS (`USING COVERING INDEX idx_admin_notes_pending_requests`) |

## 注記

実際の Cloudflare D1（staging / production）への migration 適用は本タスクの
スコープ外。`outputs/phase-05/migration-runbook.md` に手順を記載済み。
PR マージ後に運用者が staging → production の順で適用する。

## 追加 text evidence

- `outputs/phase-11/sql/explain-pending-index.txt`
- `outputs/phase-11/sql/backfill-status-counts.txt`
