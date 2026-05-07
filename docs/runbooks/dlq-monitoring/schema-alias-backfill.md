# schema alias back-fill DLQ 監視 runbook

> Refs: GitHub Issue #502 / 親タスク UT-07B-FU-01-schema-alias-backfill-queue-cron-split / 仕様書 `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/`

UT-07B-FU-01 で導入した Cloudflare Queue / DLQ binding と D1 `schema_diff_queue` テーブルの failure 永続化列を **単一ビュー**で観測するための運用 runbook。集計 SQL は **read-only**（`SELECT` のみ・`INSERT` / `UPDATE` / `DELETE` / `DROP` / `ALTER` を含まない）。

---

## 1. 監視対象

| 環境 | Queue 名 | DLQ 名 | binding 変数 |
| --- | --- | --- | --- |
| production | `schema-alias-backfill` | `schema-alias-backfill-dlq` | `SCHEMA_ALIAS_BACKFILL_QUEUE` |
| staging | `schema-alias-backfill-staging` | `schema-alias-backfill-staging-dlq` | `SCHEMA_ALIAS_BACKFILL_QUEUE` |

| D1 table | migration | 監視対象列 |
| --- | --- | --- |
| `schema_diff_queue` | `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` | `retry_count` / `failed_items_json` / `last_error`（**SELECT 禁止**）/ `last_processed_at` / `backfill_status`（`exhausted` を監視） |

> `last_error` は OAuth エラー本文や Forms API の生レスポンス文言が混入し得るため、**集計 SQL では SELECT しない**。root cause 分類が必要な場合のみ、ユーザー明示承認のうえ別操作で確認する。

---

## 2. Cloudflare dash 観測手順（AC-1）

1. 認証確認: `bash scripts/cf.sh whoami`（`wrangler` 直接呼び出し禁止）
2. Cloudflare dash > Workers & Pages > Queues > 該当 queue（prod=`schema-alias-backfill` / staging=`schema-alias-backfill-staging`）を選択
3. Metrics タブで **Messages produced / consumed / dead-lettered / retries** を 24h / 7d レンジで確認
4. DLQ（`schema-alias-backfill-dlq` / staging 版）を選択し dead-letter messages の滞留有無を確認
5. dash 上で異常を検知したら §4 のしきい値判定へ進む

> Workers Analytics / Queue Metrics が Workers Paid feature 限定で参照不可の場合は §3 の D1 集計 SQL のみで運用フォールバック可能（永続 evidence は `schema_diff_queue` 側に揃うため AC-1〜AC-4 は維持される）。

dash で確認できないがコマンドラインで Queue を一覧したい場合のフォールバック:

```bash
bash scripts/cf.sh queues list
```

---

## 3. D1 集計 SQL 3 種（AC-2 / AC-7 read-only）

すべて `bash scripts/cf.sh d1 execute` 経由で実行する。`wrangler d1 execute` を直接呼ばない。

### 3.1 SQL #1 — DLQ 投入相当（`failed_items_json IS NOT NULL`）

```sql
SELECT COUNT(*) AS dlq_pending,
       MIN(last_processed_at) AS oldest_failed_at,
       MAX(last_processed_at) AS newest_failed_at
  FROM schema_diff_queue
 WHERE failed_items_json IS NOT NULL;
```

実行例（staging）:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT COUNT(*) AS dlq_pending, MIN(last_processed_at) AS oldest_failed_at, MAX(last_processed_at) AS newest_failed_at FROM schema_diff_queue WHERE failed_items_json IS NOT NULL;"
```

### 3.2 SQL #2 — retry 過剰（`retry_count >= 3`）

```sql
SELECT diff_id, retry_count, last_processed_at
  FROM schema_diff_queue
 WHERE retry_count >= 3
 ORDER BY retry_count DESC, last_processed_at DESC
 LIMIT 50;
```

実行例（staging）:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT diff_id, retry_count, last_processed_at FROM schema_diff_queue WHERE retry_count >= 3 ORDER BY retry_count DESC, last_processed_at DESC LIMIT 50;"
```

### 3.3 SQL #3 — exhausted 滞留 24h 超（`backfill_status='exhausted'` AND 24h 以上経過）

```sql
SELECT diff_id, backfill_status, retry_count, last_processed_at,
       CAST((julianday('now') - julianday(last_processed_at)) * 24 AS INTEGER) AS stalled_hours
  FROM schema_diff_queue
 WHERE backfill_status = 'exhausted'
   AND last_processed_at IS NOT NULL
   AND julianday('now') - julianday(last_processed_at) >= 1.0
 ORDER BY last_processed_at ASC
 LIMIT 50;
```

実行例（staging）:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT diff_id, backfill_status, retry_count, last_processed_at, CAST((julianday('now') - julianday(last_processed_at)) * 24 AS INTEGER) AS stalled_hours FROM schema_diff_queue WHERE backfill_status='exhausted' AND last_processed_at IS NOT NULL AND julianday('now') - julianday(last_processed_at) >= 1.0 ORDER BY last_processed_at ASC LIMIT 50;"
```

> production 実行はユーザー明示承認のうえ `--env production` / DB 名 `ubm-hyogo-db-prod` に置換する。

---

## 4. 異常しきい値（AC-3）

| しきい値 | 条件 | 次アクション |
| --- | --- | --- |
| DLQ ≥ 1 | SQL #1 の `dlq_pending` ≥ 1 | dash で DLQ 内容を確認 → §5 エスカレーション |
| retry ≥ 3 | SQL #2 が 1 件以上返る | redacted evidence を確認し root cause 分類（`last_error` 原文は転記しない） → §5 エスカレーション |
| exhausted 24h | SQL #3 が 1 件以上返る | Cron 起動状況を確認 → §5 エスカレーション |
| いずれも 0 | 異常なし | dash 観測ログのみ記録して終了 |

---

## 5. エスカレーション分岐（AC-4）

| 重大度 | 例 | アクション |
| --- | --- | --- |
| 軽微 | 一時的な再 enqueue で復旧見込み（network blip 等） | 運用者が手動で再投入 / 観測のみで終結 |
| 中度 | schema drift / Forms API 5xx 連続 | 別 unassigned task を `docs/30-workflows/unassigned-task/` に起票し、Issue を新規作成 |
| 重度 | CPU budget 永続超過 / D1 制約違反 / DLQ 蓄積継続 | rollback 検討 + Issue 起票 + リポジトリ admin 通知 |

> Pager / Slack / PagerDuty 等の通知基盤連携は本 runbook scope 外。導入が必要になった時点で別 unassigned task として起票する。

---

## 6. しきい値見直し基準

初期値（DLQ ≥ 1 / retry ≥ 3 / exhausted 24h）は **保守的に固定**。staging / production 観測値と乖離が判明したら、**30 日 / 60 日 / 90 日**の再観測タイミングで `.claude/skills/aiworkflow-requirements/changelog/` に見直し記録を残す。

`julianday('now') - julianday(...) >= 1.0` の SQLite 関数は D1 で動作するが、staging に十分な fixture がない場合は結果 0 件となり「異常なし / 動作不能」を区別できない。観測サンプル件数を併記し、サンプル 0 件時は親タスク Phase 6 の異常系 Case 2（synthetic insert 検証）にフォールバックする。

---

## 7. 関連リソース

- `apps/api/wrangler.toml` — Queue / DLQ binding 定義（read-only 参照）
- `apps/api/src/repository/schemaDiffQueue.ts` — `retry_count` / `failed_items_json` 永続化点
- `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` — `schema_diff_queue` schema
- `scripts/cf.sh` — Cloudflare CLI ラッパー（`wrangler` 直接実行禁止 / op + esbuild 解決込み）
- `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md` — skill 逆引き topic
- 起票元仕様: `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md`
- 親タスク source spec: `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-schema-alias-backfill-queue-cron-split.md`
