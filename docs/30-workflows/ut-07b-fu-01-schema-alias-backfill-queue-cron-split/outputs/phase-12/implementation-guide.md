# Implementation Guide

## Part 1: 中学生向け

このタスクは、名簿の書き換えを一度に全部やると授業時間に間に合わないかもしれない、という問題を扱う。

Queue は給食当番ノートのようなもの。配りきれなかった分をノートに書いて、次の当番が続きから配る。Cron は毎日決まった時刻に給食室を見に行く係のようなもの。Queue は「残りが見つかったらすぐ続き」、Cron は「決まった時間に残りを確認」する。

Batch 分割は、クラス全員に一気に配らず、5人ずつ配る方法。1回の授業時間（CPU budget、コンピューターが使える時間）で終わらないなら、何回かに分ける。idempotent（同じ作業を2回しても結果が壊れない）にしておくと、途中で止まっても安心してやり直せる。

もう1つの例えは、図書館の返却棚。返す本が多すぎる日は、棚に置いておけば次の係が続きから片づける。このタスクでは、名簿の古い答えを新しい名前に直す作業を Queue に置き、途中で止まっても次の処理が続けられるようにした。

今回はユーザー指示により、仕様だけで止めず local 実装まで進めた。ただし、staging 環境で本当に大きなデータを流す確認、Cloudflare Queue の作成、本番データベースへの反映、PR 作成はまだ行っていない。

専門用語セルフチェック:

| 用語 | 中学生向けの意味 |
| --- | --- |
| Queue | 残った仕事を書いておく順番待ちノート |
| Cron | 決まった時間に見回りする係 |
| Batch | 仕事を小分けにした1回分 |
| staging | 本番前に試す練習場所 |
| CPU budget | コンピューターが1回に使える時間 |
| idempotent | 同じ作業を2回しても結果が壊れないこと |

## Part 2: 技術者向け

Current state:

| Item | Value |
| --- | --- |
| workflow_state | `spec_created` |
| implementation state | `implemented-local` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| Phase 10 gate | `design-ready` only |
| Phase 11 gate | local implementation GO / runtime evidence pending |

Contract matrix:

| Layer | Canonical term | Values / fields |
| --- | --- | --- |
| Public API | `backfill.status` | `pending` / `running` / `exhausted` / `completed` |
| Internal DB | `backfill_status` | `pending` / `running` / `in_progress` / `completed` / `exhausted` / `failed`; `failed` is exposed as public `exhausted` with `internalStatus` metadata |
| Retry code | `backfill_cpu_budget_exhausted` | retryable continuation, not infrastructure 5xx |
| Batch model | remaining-scan | cursor/offset is not the canonical API contract for this follow-up |
| Migration extension | `dedupe_key`, `failed_items_json`, `retry_count`, `last_error`, `last_processed_at` | aligns with Phase 2 base case |

Gate GO implementation files:

| File | Purpose |
| --- | --- |
| `apps/api/wrangler.toml` | Queue/Cron binding, staging/production parity |
| `apps/api/src/workflows/schemaAliasAssign.ts` | alias confirmation and synchronous compatibility path |
| `apps/api/src/workflows/schemaAliasBackfillBatch.ts` | Queue batch continuation |
| `apps/api/src/workflows/schemaAliasEnqueue.ts` | dedupe reservation and Queue producer send |
| `apps/api/src/index.ts` | Cloudflare Queue consumer shim |
| `apps/api/src/routes/admin/schema.ts` | `confirmed` and `backfill.status` response separation |
| `apps/api/src/repository/schemaDiffQueue.ts` | dedupe, retry, failed item recording, remaining-scan helpers |
| `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` | post-07b extension migration |

Runtime evidence still required:

| Evidence | Required before PASS |
| --- | --- |
| before evidence | 10 staging trials with counts, CPU time, retry count |
| runtime gate decision | GO / NO-GO / staging-deferred with numeric basis |
| after evidence | runtime GO only, proves `backfill.status=completed` convergence |
| redaction | no token, real database id, or member PII |
