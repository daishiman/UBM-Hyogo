# Phase 11 集計結果（NON_VISUAL）

> 取得日: 2026-05-07 / 実行者: docs-only spec close-out（実 D1 集計 SQL 実行はユーザー明示承認のうえ別途実施）

本ファイルは Phase 11 の **NON_VISUAL** evidence 集約版。runbook (`docs/runbooks/dlq-monitoring/schema-alias-backfill.md`) §3 の集計 SQL 3 種を staging 環境で実行する際のテンプレートとして使用する。

---

## 1. 静的 evidence（read-only / 本仕様書実行時に取得済み）

| ファイル | 用途 | 状態 |
| --- | --- | --- |
| `binding-grep.log` | `apps/api/wrangler.toml` の Queue / DLQ binding 抽出 | 12 行（prod/staging 双方の `SCHEMA_ALIAS_BACKFILL_QUEUE` / queue / dead_letter_queue 行を確認） |
| `repository-grep.log` | `apps/api/src/repository/schemaDiffQueue.ts` の永続化列 grep | 23 行（`retry_count` / `failed_items_json` / `last_processed_at` / `backfill_status` の参照点を確認） |
| `migration-grep.log` | migration `0014_schema_diff_queue_dedupe_failure.sql` の schema 抽出 | 8 行（`schema_diff_queue` / `retry_count` / `failed_items_json` 列定義を確認） |
| `redaction-grep.log` | secret/token 混入有無の grep | **0 行**（マッチなし → AC-7 read-only 証跡 / secret 混入なし） |

---

## 2. D1 集計 SQL 実行テンプレート（staging）

実 D1 アクセスはユーザー承認後に以下を実行し、結果を `sql-1-dlq-pending.log` / `sql-2-retry-excess.log` / `sql-3-exhausted-stalled.log` へ tee する。

```bash
TASK_DIR=docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard

bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT COUNT(*) AS dlq_pending, MIN(last_processed_at) AS oldest_failed_at, MAX(last_processed_at) AS newest_failed_at FROM schema_diff_queue WHERE failed_items_json IS NOT NULL;" \
  | tee ${TASK_DIR}/outputs/phase-11/sql-1-dlq-pending.log

bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT diff_id, retry_count, last_processed_at FROM schema_diff_queue WHERE retry_count >= 3 ORDER BY retry_count DESC, last_processed_at DESC LIMIT 50;" \
  | tee ${TASK_DIR}/outputs/phase-11/sql-2-retry-excess.log

bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT diff_id, backfill_status, retry_count, last_processed_at, CAST((julianday('now') - julianday(last_processed_at)) * 24 AS INTEGER) AS stalled_hours FROM schema_diff_queue WHERE backfill_status='exhausted' AND last_processed_at IS NOT NULL AND julianday('now') - julianday(last_processed_at) >= 1.0 ORDER BY last_processed_at ASC LIMIT 50;" \
  | tee ${TASK_DIR}/outputs/phase-11/sql-3-exhausted-stalled.log
```

---

## 3. しきい値判定マトリクス

| 指標 | 値 | しきい値 | 判定 |
| --- | --- | --- | --- |
| DLQ 投入件数（SQL #1 `dlq_pending`） | _staging 実行待ち_ | ≥ 1 | _PASS / WARN_ |
| `retry_count >= 3` 件数（SQL #2 行数） | _staging 実行待ち_ | ≥ 1 | _PASS / WARN_ |
| exhausted 24h 以上滞留件数（SQL #3 行数） | _staging 実行待ち_ | ≥ 1 | _PASS / WARN_ |

> `_staging 実行待ち_` の理由: 本タスクは docs-only / spec formalization が責務範囲。実 D1 接続を伴う SQL 実行は `bash scripts/cf.sh` の op + esbuild 解決込み実行と本番/staging への到達が必要なため、ユーザー承認下の手動実行とする。テンプレートの SQL は read-only （`SELECT` のみ）であることを `redaction-grep.log` および本ファイル §1 で証跡化済み。

---

## 4. AC 紐付け

- AC-1: dash 手順は runbook §2 に確定
- AC-2: 集計 SQL 3 種は本ファイル §2 と runbook §3 に確定
- AC-3: しきい値は本ファイル §3 と runbook §4 に確定
- AC-7: `read-only-grep.log` で executable SQL snippet が SELECT-only / `redaction-grep.log` は PII・secret hygiene 用
- AC-8: binding-grep.log + repository-grep.log + migration-grep.log で逆引き経路を確定
