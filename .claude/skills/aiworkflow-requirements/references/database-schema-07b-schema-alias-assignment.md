# Database Schema: 07b Schema Alias Assignment

> Parent: [database-schema.md](database-schema.md)
> Task: `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/`
> Status: Phase 1-12 completed / Phase 13 pending_user_approval

07b は 03a / 03b が投入した未解決 schema 差分を、管理者承認後に stableKey へ確定する API workflow である。UI ではなく `apps/api` 内の workflow として実装し、schema 変更の書き込み境界を `/admin/schema/*` に固定する。

## 07b Table Responsibilities

| 対象 | 07b の責務 |
| --- | --- |
| `schema_questions` | `question_id` の最新 `revision_id` 行を取得し、同一 `revision_id` 内の stableKey collision を pre-check してから `stable_key` を更新する |
| `schema_diff_queue` | `diff_id` 指定時のみ、対象 diff の存在と `question_id` 一致を確認し、apply 後に `status='resolved'` へ遷移する |
| `response_fields` | `stable_key='__extra__:<questionId>'` の extra row を新 stableKey へ batch back-fill する。削除済み member の current response は対象外 |
| `audit_log` | apply mode のみ `schema_diff.alias_assigned` を追記する。dry-run / idempotent re-apply では追記しない |

## Current D1 Delta Absorption

実 DB には `response_fields.questionId` / `response_fields.is_deleted` カラムはない。07b は extra field の中間表現 `__extra__:<questionId>` と、`member_identities` + `deleted_members` の join によって仕様上の question 単位 back-fill / 削除 skip を実現する。

`schema_questions(revision_id, stable_key)` の物理 UNIQUE index は現状未導入で、07b は workflow pre-check で collision を `422` にする。race condition の二段防御としての migration は後続候補に分離する。

## Fixed Runtime Values

| 値 | 正本 |
| --- | --- |
| back-fill batch size | `BACKFILL_BATCH_SIZE = 100` |
| CPU budget | `BACKFILL_CPU_BUDGET_MS = 25000` |
| extra field selector | `response_fields.stable_key='__extra__:<questionId>'` |
| queue status | `queued -> resolved` |
| audit action | `schema_diff.alias_assigned` |
| collision mapping | HTTP 422 |

## Follow-up Boundary

`UT-07B-schema-alias-hardening-001` に以下を分離する。

- `schema_questions(revision_id, stable_key)` 物理 UNIQUE index migration
- 10,000 行級 back-fill の wrangler 実機計測
- `backfill_cpu_budget_exhausted` retryable HTTP contract
- apply と back-fill の cron 分割設計
