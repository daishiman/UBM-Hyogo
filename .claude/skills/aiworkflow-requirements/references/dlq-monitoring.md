---
name: dlq-monitoring
description: schema alias back-fill Queue / DLQ 監視の正本リファレンス。Cloudflare Queue / DLQ binding 名、D1 schema_diff_queue の監視対象列、異常しきい値、runbook link を逆引き可能に集約する（Issue #502 / UT-07B-FU-01-FOLLOWUP）。
type: reference
---

# DLQ 監視 — schema alias back-fill 正本リファレンス

> 対象タスク: UT-07B-FU-01-FOLLOWUP DLQ monitoring dashboard（Issue #502 / formalized 2026-05-07）
>
> Trigger キーワード: DLQ / dead-letter / schema-alias-backfill / schema_diff_queue / retry_count / failed_items_json / exhausted / Cloudflare Queue 監視 / SCHEMA_ALIAS_BACKFILL_QUEUE

---

## 1. Queue / DLQ binding（`apps/api/wrangler.toml` の正本）

| 環境 | Queue 名 | DLQ 名 | binding 変数 |
| --- | --- | --- | --- |
| production | `schema-alias-backfill` | `schema-alias-backfill-dlq` | `SCHEMA_ALIAS_BACKFILL_QUEUE` |
| staging | `schema-alias-backfill-staging` | `schema-alias-backfill-staging-dlq` | `SCHEMA_ALIAS_BACKFILL_QUEUE` |

---

## 2. 観測対象 D1 列（`schema_diff_queue` / migration `0014_schema_diff_queue_dedupe_failure.sql`）

| 列 | 用途 | 集計 SQL での扱い |
| --- | --- | --- |
| `retry_count` | リトライ回数 | SQL #2 のしきい値判定（`>= 3`） |
| `failed_items_json` | 失敗 batch の JSON 永続化 | SQL #1 の DLQ 投入相当判定（`IS NOT NULL`） |
| `last_error` | 最新エラー文字列 | **SELECT 禁止**（OAuth エラー本文混入リスク）。要約のみ runbook / references に記録 |
| `last_processed_at` | 最終処理時刻 | SQL #1 / #3 で滞留時間算出 |
| `backfill_status` | `pending` / `processing` / `done` / `exhausted` | SQL #3 の `exhausted` 滞留 24h 判定 |

---

## 3. 異常しきい値

- DLQ 投入件数 ≥ 1（`failed_items_json IS NOT NULL` の COUNT）
- `retry_count` ≥ 3（1 件以上検出）
- `backfill_status='exhausted'` 滞留 ≥ 24h（`julianday('now') - julianday(last_processed_at) >= 1.0`）

初期値は保守的固定。30 日 / 60 日 / 90 日の再観測で skill changelog に見直し記録を残す。

---

## 4. runbook link（1-hop）

- `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` — 監視 runbook 本体（6 章構造: 監視対象 / dash 手順 / 集計 SQL 3 種 / しきい値 / エスカレーション / しきい値見直し基準）

---

## 5. 実行ラッパー（`wrangler` 直接禁止）

- 認証確認: `bash scripts/cf.sh whoami`
- D1 集計: `bash scripts/cf.sh d1 execute <db> --env <env> --command "<SQL>"`
- Queue 一覧（フォールバック）: `bash scripts/cf.sh queues list`

---

## 6. エスカレーション

しきい値超過を検知した場合の段階:

1. 軽微: 運用者が手動で再投入 / 観測のみで終結
2. 中度: 別 unassigned task を起票（`docs/30-workflows/unassigned-task/` 直下）
3. 重度: rollback 検討 + Issue 起票 + リポジトリ admin 通知

Pager / Slack / PagerDuty 連携は本 topic scope 外。導入時は別 unassigned task として起票する。

---

## 7. 関連 topic

- `references/observability-monitoring.md` — UBM-Hyogo 全体の monitoring / alert 設計
- `references/deployment-cloudflare-opennext-workers.md` — Cloudflare Workers / Queues 配置
- `references/deployment-secrets-management.md` — `scripts/cf.sh` ラッパーと 1Password 経由 token 注入

---

## 8. 出典

- 起票元仕様: `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md`
- 親タスク source spec: `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-schema-alias-backfill-queue-cron-split.md`
- formalized 仕様書: `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/`
- GitHub Issue: #502（CLOSED 維持 / `Refs #502`）
