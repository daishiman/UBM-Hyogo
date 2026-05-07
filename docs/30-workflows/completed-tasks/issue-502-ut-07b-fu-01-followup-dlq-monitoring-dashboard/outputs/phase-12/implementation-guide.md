# Implementation Guide — Issue #502 schema alias back-fill DLQ monitoring runbook

> docs-only / NON_VISUAL / `Refs #502`

Screenshot evidence: **N/A**。本タスクは UI / component / route 変更を含まず、Phase 11 は CLI / markdown / grep evidence のみで扱う。`outputs/phase-11/screenshots/` は作成しない。

---

## Part 1 — 中学生レベル（例え話）

### このタスクは何をするの？

UBM 兵庫支部のサイトには「会員データの形（schema）が変わったら、古いデータを新しい形に **自動で書き直す**」という裏側の仕事があります。
この仕事は **行列（Queue）** に並べて少しずつ処理されます。失敗した仕事は **失敗箱（DLQ＝dead-letter queue）** に置いておきます。

「失敗箱に何件たまっているか」「同じ仕事を **何回もやり直し** していないか」「途中で **力尽きて止まっている仕事** がないか」——これらを **1 ページの説明書（runbook）** にまとめて、誰でも同じ手順で確認できるようにするのが今回のタスクです。

### 例え話

- **Queue（行列の自動受付）**: お弁当屋さんに並ぶお客さんの列。順番に処理する。
- **DLQ（失敗箱）**: 注文を取ろうとして失敗したレシートを置く専用の箱。中身が増えてきたら誰かが見にいく。
- **`retry_count`（やり直した回数）**: 同じレシートを何度作り直したかのカウント。
- **`exhausted`（力尽き状態）**: 1 個の注文が大きすぎて時間切れで一旦やめた、という札がついた状態。

### 見るルール

- **失敗箱に 1 件でも入っていたら、まず中身を見にいく**（DLQ ≥ 1）
- **同じ仕事に 3 回続けて失敗していたら、その仕事自体に問題がある可能性を疑う**（retry ≥ 3）
- **中断状態のまま 24 時間動き出さない仕事は、忘れられている可能性が高い**ので確認する（exhausted 24h）

### 専門用語セルフチェック

- Cloudflare Queue（クラウドの行列受付サービス）
- D1（クラウド上の小さなデータベース）
- Workers（クラウド上で動く小さなプログラム）
- dead-letter（処理に失敗したメッセージのこと）

---

## Part 2 — 技術者レベル

### 1. 監視対象の正本値

| 環境 | Queue | DLQ | binding 変数 |
| --- | --- | --- | --- |
| production | `schema-alias-backfill` | `schema-alias-backfill-dlq` | `SCHEMA_ALIAS_BACKFILL_QUEUE` |
| staging | `schema-alias-backfill-staging` | `schema-alias-backfill-staging-dlq` | `SCHEMA_ALIAS_BACKFILL_QUEUE` |

正本: `apps/api/wrangler.toml` の `[[queues.producers]]` / `[[queues.consumers]]` ブロック（環境ごとに 3 セット）。

### 2. D1 schema（`schema_diff_queue` / migration `0014_schema_diff_queue_dedupe_failure.sql`）

監視対象列:

- `retry_count` — リトライ回数
- `failed_items_json` — 失敗 batch の JSON 永続化
- `last_error` — **集計 SQL では SELECT しない**（OAuth エラー本文混入リスク回避）
- `last_processed_at` — 最終処理時刻
- `backfill_status` — `pending` / `processing` / `done` / `exhausted`

### 3. 集計 SQL 3 種（read-only）

| # | 目的 | WHERE 条件 |
| --- | --- | --- |
| #1 | DLQ 投入相当の件数集計 | `failed_items_json IS NOT NULL` |
| #2 | retry 過剰の検出 | `retry_count >= 3` |
| #3 | exhausted 24h 滞留 | `backfill_status='exhausted'` AND `julianday('now') - julianday(last_processed_at) >= 1.0` |

完全形は `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` §3 と
`outputs/phase-11/aggregation.md` §2 を参照。

すべて `SELECT` のみで構成。`INSERT` / `UPDATE` / `DELETE` / `DROP` / `ALTER` を含まない（AC-7）。

### 4. Cloudflare dash 到達経路

1. `bash scripts/cf.sh whoami`（認証確認）
2. dash > Workers & Pages > Queues > 該当 queue
3. Metrics: Messages produced / consumed / dead-lettered / retries（24h / 7d）
4. DLQ を選択し dead-letter 滞留有無を確認

Workers Paid feature 制限で dash 参照不可の場合は `bash scripts/cf.sh queues list` + D1 集計 SQL のみで運用。

### 5. しきい値判定マトリクス

| 指標 | しきい値 | 次アクション |
| --- | --- | --- |
| `dlq_pending` | ≥ 1 | dash で DLQ 内容確認 → エスカレーション分岐 |
| `retry_count >= 3` の件数 | ≥ 1 | redacted evidence で root cause 分類 |
| exhausted 24h 滞留件数 | ≥ 1 | Cron 起動状況確認 |

### 6. Phase 11 staging 数値（テンプレート / 実測転記欄）

| 指標 | staging 値 | 取得日 |
| --- | --- | --- |
| `dlq_pending`（SQL #1） | _実 D1 アクセス時に転記_ | _staging 実行待ち_ |
| `retry_count >= 3` 件数（SQL #2） | _実 D1 アクセス時に転記_ | _staging 実行待ち_ |
| exhausted 24h 件数（SQL #3） | _実 D1 アクセス時に転記_ | _staging 実行待ち_ |

> 本タスクは docs-only / spec formalization が責務範囲。実 D1 接続を伴う SQL 実行はユーザー承認下の手動運用。テンプレートと SQL は read-only であることを `read-only-grep.log` で証跡化済み。`redaction-grep.log` は PII / secret hygiene 用の別証跡。

### 7. ラッパー必須性

- `wrangler` 直接実行は **全面禁止**（CLAUDE.md「Cloudflare 系 CLI 実行ルール」準拠）
- すべて `bash scripts/cf.sh` 経由（op 経由 1Password token 動的注入 / esbuild バージョン整合 / mise exec での Node 24 保証）

### 8. エスカレーション

| 重大度 | 例 | アクション |
| --- | --- | --- |
| 軽微 | 一時的 network blip | 運用者が手動再投入 / 観測のみ終結 |
| 中度 | schema drift / Forms API 5xx 連続 | 別 unassigned task 起票 + Issue 新規作成 |
| 重度 | CPU budget 永続超過 / DB 制約違反 | rollback 検討 + Issue 起票 + admin 通知 |

Pager / Slack / PagerDuty 連携は本 scope 外（必要時は別 unassigned task で起票）。
