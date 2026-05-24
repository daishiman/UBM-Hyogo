# Phase 12 output: system spec update summary

[実装区分: 実装仕様書]

本タスクは `spec_created`（runtime_pending）であるが、same-wave sync の対象である正本 spec ファイルは本改善サイクルで実編集済みである。Runtime evidence だけが user-gated pending であり、仕様同期は `docs/00-getting-started-manual/specs/11-admin-management.md` / `01-api-schema.md` に反映済みとして記録する。

## Step 1-A: 完了タスク記録 + LOGS.md×2 + topic-map

| 対象 | before → after | 状態 |
| --- | --- | --- |
| 完了タスクセクション（workflow ledger） | エントリなし → Issue #836 schema-alias-recompute-trigger を `spec_created` で追記（テスト結果サマリー + 成果物テーブル形式） | spec_created |
| `docs/30-workflows/LOGS.md` | エントリなし → `2026-05-23: docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger/ spec workflow 作成（CLOSED Issue #836 を最新コード最適化で再起動）` 1 行追加 | spec_created |
| skill `LOGS.md`（task-specification-creator） | エントリなし → 同 close-out sync を 1 行追記 | spec_created |
| topic-map（aiworkflow-requirements index） | recompute 操作エントリなし → `schema_alias.recompute` / reverse-backfill / recompute job エントリ追加（`generate-index.js` 再生成） | spec_created |

## Step 1-B: 実装状況テーブル更新

| 機能 | before | after |
| --- | --- | --- |
| schema alias recompute（reverse-backfill） | 未記載 | `spec_created`（`completed` ではない。local implementation complete・runtime evidence pending） |

> 実装完了時に `complete-phase.js` で `spec_created` → `completed` へ更新する（同波）。

## Step 1-C: 関連タスクテーブル更新

| 関連タスク | before status | after status（current facts） |
| --- | --- | --- |
| issue-778-schema-alias-rollback-undo（親） | completed | completed（変更なし。recompute の起点） |
| serial-05-step-03-followup-005-schema-alias-recompute-trigger（原典） | pending | `consumed_via_issue_836_recompute_trigger_spec`（fold-state sync。実装 close-out と同波で追記） |
| serial-05-step-03-followup-006-schema-alias-bulk-rollback | pending | pending（残置。本タスク前提外） |
| serial-05-step-03-followup-007-schema-alias-rollback-notification | pending | pending（残置。本タスク前提外） |

## Step 2: システム仕様更新（新規インターフェース追加あり）

recompute endpoint 2 本 + 型（`RecomputeResult` / `RecomputeStatusResult` / `SchemaAliasRecomputeFailure`）の新規追加があるため Step 2 は**必要**。実 spec 編集は Phase 05 実装と同波で行う（AC-13）。

### docs/00-getting-started-manual/specs/11-admin-management.md

`/admin/schema` セクションに「recompute（rollback 後の再集計）」サブセクションを追記する計画:

| 追記項目 | 内容 |
| --- | --- |
| 権限 | admin（resolve / rollback と同等） |
| 実行契機 | rollback 後に admin が SchemaDiffPanel の「再集計実行」ボタン押下時のみ。rollback 直後の自動実行はしない（AC-5） |
| status バッジ | `pending` / `running` / `completed` / `failed`。`submitting` 中のみボタン disable。server `running` は cursor 継続のため「再集計を続行」操作を許可（AC-6 / AC-8） |
| idempotency | `(alias_id, stable_key, trigger_key)` UNIQUE で同一 trigger の再実行を吸収。`response_fields` 二重変動なし（AC-2） |
| audit 記録項目 | `action='schema_alias.recompute'`、`after_json = { jobId, affectedCount, processedCount, updatedCount, deletedCollisionCount, relatedRollbackAuditId, triggerKey, reason }`（AC-3） |
| 不変条件 | D1 直接修正禁止。再集計は必ず API + 監査ログを通る。reverse-backfill は backfill の対称操作 |

before → after: 「再集計実行は本タスク外（運用フォロー）」warning 記述のみ → 実 recompute 操作仕様（権限・契機・status・idempotency・audit）追記。

### docs/00-getting-started-manual/specs/01-api-schema.md

admin endpoint 一覧に recompute 2 本を追記する計画:

| endpoint | request | response | error |
| --- | --- | --- | --- |
| `POST /admin/schema/aliases/:aliasId/recompute` | `{ reason? }`（`triggerKey` は server-side derivation） | `RecomputeResult`（`jobId` / `status` / `affectedCount` / `processedCount` / `updatedCount` / `deletedCollisionCount` / `recomputeAuditId` / `relatedRollbackAuditId`） | 400 `bad_request` / 404 `not_found` / 409 `not_rolled_back` / 500 `batch_failed` |
| `GET /admin/schema/aliases/:aliasId/recompute` | path param `aliasId` | `RecomputeStatusResult \| null` | — |

before → after: recompute endpoint 記載なし → path / request / response shape / error 体系を追記（`outputs/phase-02/api-contract.md` 参照）。

## 影響を受けるが本タスクで変更しない仕様

| 仕様 | 理由 |
| --- | --- |
| `08-free-database.md` | `schema_alias_recompute_jobs` 追加は D1 一般原則の範囲内のため正本側追記不要 |
| `13-mvp-auth.md` | admin role 構造に変更なし |
| `02-auth.md` | 影響なし |

## workflow-local 同期 vs global skill sync の分離

- workflow-local 同期: `docs/30-workflows/completed-tasks/issue-836-schema-alias-recompute-trigger/` 全 phase + outputs + `artifacts.json` / `outputs/artifacts.json` parity
- global skill sync: `task-specification-creator` / `aiworkflow-requirements` の LOGS.md × 2 + topic-map 再生成（`generate-index.js`）
