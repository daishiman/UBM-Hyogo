# Phase 2 Output: ギャップ分析・判定（gap-analysis-and-verdict）

> 本ファイルは本 workflow の **正本成果物**。最終判定の確定はここで行い、Phase 5 verdict-runbook がこれを承継する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-sync-audit-tables-necessity-judgement-001 |
| Phase | 2 / 13 |
| 判定対象 | `sync_audit_logs` / `sync_audit_outbox` の新設要否 |
| 実測基準コミット | origin/dev `f6faeb005`（2026-05-31 時点） |

## 1. 現行 ledger 棚卸し（実測）

### 1.1 `sync_jobs`（`apps/api/migrations/0003_auth_support.sql`）

| カラム | 型 | 役割 |
| --- | --- | --- |
| `job_id` | TEXT PK | job 識別子（`crypto.randomUUID()`） |
| `job_type` | TEXT NOT NULL | `schema_sync` / `response_sync` |
| `started_at` | TEXT NOT NULL | 実行開始 ISO8601 |
| `finished_at` | TEXT | 実行終了 ISO8601 |
| `status` | TEXT NOT NULL DEFAULT 'running' | `running` → `succeeded` / `failed`（一方向。`apps/api/src/repository/syncJobs.ts` の `ALLOWED_TRANSITIONS` で強制） |
| `error_json` | TEXT | 失敗詳細（`fail()` が JSON 書き込み） |
| `metrics_json` | TEXT NOT NULL DEFAULT '{}' | 件数・差分・cursor 等の構造化 JSON |

- lifecycle: `start` → `succeed(metrics)` / `fail(error)`。`succeed` は `assertNoPii(metrics)` で PII を遮断。
- 参照: `findLatest(jobType)` / `listRecent(limit)` で admin UI から内部参照（公開 endpoint なし）。

### 1.2 `sync_job_logs` + `sync_locks`（`apps/api/migrations/0002_sync_logs_locks.sql`）

| `sync_job_logs` カラム | 役割 |
| --- | --- |
| `run_id`（UNIQUE） | run 識別子 |
| `trigger_type` | cron / admin / backfill |
| `status` | running / success / failed / skipped |
| `started_at` / `finished_at` | 実行時刻 |
| `fetched_count` / `upserted_count` / `failed_count` / `retry_count` | **行レベルに近いカウント集計** |
| `duration_ms` | 実行時間 |
| `error_reason` | 失敗理由 |

- index: `idx_sync_job_logs_started` / `idx_sync_job_logs_status` で時系列・状態検索可能。
- `sync_locks`: TTL 付き二重実行防止ロック（`acquired_at` / `expires_at` / `holder` / `trigger_type`）。

### 1.3 `metrics_json` zod schema（`apps/api/src/jobs/_shared/sync-jobs-schema.ts`）

構造化キー（`metricsJsonBaseSchema`）: `cursor` / `processed` / `processed_count` / `writes` / `write_count` / `error_count` / `skipped` / `writeCapHit` / `reason` / `lock_acquired_at`。`response_sync` / `schema_sync` ごとに `safeExtend`。`superRefine` + `assertNoPii` で `PII_FORBIDDEN_KEYS`（email / name / stable keys 等）を遮断。

→ **実行ごと詳細は既に zod で構造化・検証済み**（自由形式 TEXT ではない）。

### 1.4 outbox 前例（`apps/api/migrations/0014_notification_outbox.sql`）

- `notification_outbox` / `notification_ledger` が実在。通知の at-least-once 配送が **真に必要だったため** outbox を新設した実績。
- 含意: 本リポジトリは「outbox を一律で作らない」のではなく「at-least-once 配送が必須の領域にのみ実需ベースで新設する」運用が確立している。sync audit にその実需が観測されるかが判定の分岐点。

## 2. ギャップ表（UT-21 audit 観点 × 現行 ledger）

| 観点 | 現行カバー | カバー手段 | 根拠 |
| --- | --- | --- | --- |
| O-1 実行ごと詳細ログ | ◯ | `sync_jobs.metrics_json`（zod 構造化）+ `sync_job_logs`（fetched/upserted/failed/retry/duration/error_reason） | job 単位 + run 単位の二層で実行詳細を保持。自由形式でなく検証済み構造 |
| O-2 audit 書込失敗 retry（outbox） | ◯ | `sync_jobs` 自体の D1 書込失敗は D1 retry / `SQLITE_BUSY` backoff（03a/03b MIG-03）で吸収。失敗は `error_json` / `error_reason` に記録 | sync は冪等（`forms.responses.list` + cursor 再開）。job 行が落ちても次回 run が cursor から再開するため best-effort outbox 不要 |
| O-3 後追い清書（flush） | ◯（不要） | O-2 が不要なため flush 対象が存在しない | outbox を持たない以上 flush 工程自体が不要 |
| O-4 行単位差分追跡 | △（集計で代替） | `metrics_json` の `processed` / `writes` / `error_count` + `sync_job_logs` の count 列 | 行単位 audit row は持たないが、Forms sync は冪等 upsert のため「どの行が変わったか」より「何件処理/失敗したか」で運用上充足。行単位差分は MVP 監査要件に含まれない |

凡例: ◯=現行で充足 / △=集計値で代替（行単位の生 row は持たないが運用要件は満たす） / ✕=未カバー（**該当なし**）。

## 3. 判定基準 4.3 の適用

| # | 条件 | 該当? | 根拠 |
| --- | --- | --- | --- |
| 1 | 行単位の差分追跡が運用上の必須要件である | **非該当** | MVP / 仕様（`docs/00-getting-started-manual/specs/`）に行単位 audit の必須要件なし。冪等 upsert + 集計 metrics で運用充足 |
| 2 | `sync_jobs` 自体への書込失敗を別経路で記録する必要がある | **非該当** | D1 retry / backoff で吸収。冪等 sync のため job 行欠落は次 run の cursor 再開で回復。別経路 outbox の実需なし |
| 3 | 外部監査・コンプラで実行履歴を別テーブルに分離する要請がある | **非該当** | 親 close-out 時点で該当インシデント / エスカレーション 0 件。支部会員サイト MVP に外部監査・コンプラ分離要請なし |

→ 3 条件すべて **非該当**。

## 4. 確定判定

> ## 判定: **新設不要（NO NEW TABLE REQUIRED）**
>
> `sync_audit_logs` / `sync_audit_outbox` は新設しない。現行の **`sync_jobs` ledger + `sync_job_logs` 補助台帳 + zod 構造化 `metrics_json`** で UT-21 が要求した audit 観点 O-1〜O-4 を充足する。

- 判定区分: 原典 U02 §5 Phase 3 の 3 分類のうち「**新設不要（既存で十分）**」。
- `sync_jobs` 拡張（カラム追加）も **不要**: `metrics_json` が passthrough zod で任意キー拡張に対応済みのため、将来の追加 metric は DDL 変更なしで吸収できる。

## 5. docs-only 確定（CONST_004 例外）

- 判定が「新設不要」のため、本タスクの成果物は **判定証跡（ドキュメント）のみ** であり、`apps/api/migrations` / `apps/api/src` への変更は一切発生しない。
- よって本タスクは CONST_004 の例外条件「純粋に判定・合意形成で完結し、目的達成にコード変更が不要」に該当する docs-only 仕様書として確定する。
- `git status --short apps packages` が 0 件であることを Phase 11 で実証する。

## 6. 解除条件（将来の再検討トリガ）

以下のいずれかが将来観測された場合に限り、**別タスクの実装仕様書**（マイグレーション + `apps/api` audit writer）として新設を再検討する。本サイクルでは該当ゼロのため起票しない（CONST_005: 今回完了すべき改善の先送りではなく将来条件）。

| 解除トリガ | 受け皿 | 起票時の実装区分 |
| --- | --- | --- |
| T-1: 行単位差分追跡が監査要件として確定（外部監査 / コンプラ） | 新規実装タスク | 実装仕様書（新規テーブル DDL + writer） |
| T-2: `sync_jobs` 書込失敗を別経路で恒久記録する運用インシデントが発生 | 新規実装タスク | 実装仕様書（`sync_audit_outbox` 相当 + flush job） |
| T-3: `metrics_json` の集計では追跡不能な障害が 1 件以上特定され、かつ列拡張で吸収困難 | 新規実装タスク | 実装仕様書 |

## 7. 親 close-out §(d) との整合

- 親 `ut21-forms-sync-conflict-closeout` Phase 2 §(d) は「保留対象 = `sync_audit_logs` / `sync_audit_outbox`」「解除条件 = U02 で不足を 1 件以上特定し列拡張で吸収困難と論証された場合のみ新設」「受け皿 = U02（本タスク）」と設計していた。
- 本判定は U02 として、その解除条件を **満たさない（不足 0 件）** ことを論証し、「保留」を「**新設不要で確定（解除条件は将来トリガ T-1〜T-3 へ移譲）**」へ閉じる。親 §(d) を上書きせず承継する。

## 8. 不変条件 touched

| # | 不変条件 | 本判定での扱い |
| --- | --- | --- |
| #4 | Form schema 外データは admin-managed 分離 | `sync_jobs` / `sync_job_logs` は admin-managed ledger。判定は分離境界を変更しない |
| #5 | D1 直接アクセスは `apps/api` に閉じる | 棚卸し対象はすべて `apps/api` 配下。`apps/web` からの D1 参照を持ち込まない |
