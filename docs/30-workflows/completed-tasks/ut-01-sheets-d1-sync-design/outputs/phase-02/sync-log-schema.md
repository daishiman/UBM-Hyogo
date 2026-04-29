# Phase 2 成果物: sync_log 論理スキーマ

> **ステータス**: completed-design
> 本ファイルを `sync_log` 論理スキーマの正本とする。
> 仕様本体は `../../phase-02.md` を参照。
> **注意**: 本ファイルは **論理設計のみ**。物理 DDL の発行・マイグレーションは UT-04 / UT-09 が担う。
> **既存実装整合メモ**: 現行 worktree には `apps/api/migrations/0002_sync_logs_locks.sql` と `apps/api/src/jobs/sync-sheets-to-d1.ts` が存在し、物理名は `sync_job_logs` / `sync_locks`、状態値は `running|success|failed|skipped`、手動 trigger は `admin` で実装されている。本論理設計を物理実装へ適用する場合は、下記「9. 既存実装との対応表」を必ず起点にする。

## 1. テーブル概要

`sync_log` は Sheets→D1 同期ジョブの実行履歴・状態・失敗原因を追跡するテーブル。
冪等性確保（`processed_offset` による再開）、二重実行防止（active lock 相当の一意性）、監査証跡（failed 30 日保持）の 3 役を担う。

## 2. カラム定義

| # | カラム | 型 | NULL | 既定 | 説明 |
| --- | --- | --- | --- | --- | --- |
| 1 | `id` | TEXT (UUID) | NOT NULL | - | ジョブ ID（PK） |
| 2 | `trigger_type` | TEXT | NOT NULL | - | `manual` / `cron` / `backfill` |
| 3 | `status` | TEXT | NOT NULL | `pending` | `pending` / `in_progress` / `completed` / `failed` |
| 4 | `started_at` | INTEGER (epoch ms) | NOT NULL | - | 開始時刻 |
| 5 | `finished_at` | INTEGER | NULL | - | 完了時刻 |
| 6 | `processed_offset` | INTEGER | NOT NULL | 0 | 書き込み完了済みオフセット（行 or chunk index） |
| 7 | `total_rows` | INTEGER | NULL | - | 取得行数 |
| 8 | `error_code` | TEXT | NULL | - | `quota_exhausted` / `sqlite_busy` / `mapping_error` / `auth_error` / `5xx` 等 |
| 9 | `error_message` | TEXT | NULL | - | スタックトレース要約（先頭 1000 文字） |
| 10 | `retry_count` | INTEGER | NOT NULL | 0 | リトライ実施回数 |
| 11 | `created_at` | INTEGER (epoch ms) | NOT NULL | - | レコード作成時刻 |
| 12 | `idempotency_key` | TEXT | NOT NULL | - | `trigger_type + target_range + full flag + started bucket` から生成する実行単位キー |
| 13 | `lock_expires_at` | INTEGER | NULL | - | active lock の stale 判定時刻 |

## 3. 状態遷移

```
pending ──> in_progress ──> completed
                │
                └─> failed (retry_count < 3 で in_progress に戻る場合あり)
```

| 遷移 | 条件 | 副作用 |
| --- | --- | --- |
| pending → in_progress | ジョブ開始時 | started_at セット |
| in_progress → completed | 全行書込成功 | finished_at セット |
| in_progress → failed | リトライ上限到達 / 致命エラー | finished_at セット、error_code/message 記録 |
| failed → in_progress | retry_count++ で再開 | 再開時刻で started_at 上書きしない（保持）|

## 4. 索引候補

| 索引 | カラム | 用途 |
| --- | --- | --- |
| PK | `id` | 主キー |
| IDX_status_started | `(status, started_at DESC)` | 実行中 job / 最新 job 取得 |
| IDX_started | `started_at DESC` | 監視ダッシュボード（UT-08）の最新ジョブ取得 |
| IDX_status_failed | `status` WHERE `status='failed'` | failed 30 日保持判定 |
| UQ_active_lock | active job 相当 | `in_progress` の同時存在を 1 件に制限する論理要件。物理実現は UT-04 で D1 対応可否に合わせる |
| UQ_idempotency_key | `idempotency_key` | 同一実行単位の重複開始を防ぐ |

## 5. 保持期間

| 状態 | 保持期間 | 削除戦略 |
| --- | --- | --- |
| completed | 7 日 | 定期 Cron で `DELETE WHERE status='completed' AND started_at < now-7d` |
| failed | 30 日 | UT-08 監視に必要なため長めに保持 |
| in_progress（取り残し）| 1 時間で stale | Cron で `failed` に強制遷移 + 警告 |

## 6. 二重実行防止（論理要件）

`SELECT COUNT(*) WHERE status='in_progress'` だけでは競合窓が残るため、UT-04 / UT-09 は次の論理要件を満たすこと。

| 要件 | 内容 | 担当 |
| --- | --- | --- |
| active lock | `in_progress` job は同時に 1 件のみ。D1 で partial unique index が使えない場合は lock table または transaction 境界で代替する | UT-04 / UT-09 |
| stale lock 解放 | `lock_expires_at < now` の `in_progress` は開始前に `failed` へ遷移する | UT-09 |
| job idempotency | 同一 `idempotency_key` の二重開始は既存 job を返すか skip する | UT-09 |
| offset monotonicity | `processed_offset` は増加のみ。再試行で成功済み chunk を巻き戻さない | UT-09 |

## 7. UT-04 引き継ぎ事項

- 物理 DDL（CREATE TABLE）の発行
- マイグレーションファイル（`migrations/NNNN_create_sync_log.sql`）の作成
- 索引（IDX_*）の物理生成
- partial unique index（WHERE 句付き）が D1 でサポートされない場合の active lock 代替設計

## 8. UT-09 引き継ぎ事項

- 上記スキーマに従った INSERT / UPDATE 実装
- active lock / stale lock / idempotency_key の実装
- retry_count++ の楽観排他制御
- `processed_offset` ベースの再開ロジック

## 9. 既存実装との対応表（Phase 12 追補）

30 種思考法レビューで、UT-01 の論理設計と既存 UT-09 実装の差分を確認した。現時点ではコード変更せず、後続タスクが誤って `sync_log` を二重作成しないように対応関係を固定する。

| 論理設計（UT-01） | 既存実装（apps/api） | 判定 | 後続対応 |
| --- | --- | --- | --- |
| `sync_log` | `sync_job_logs` + `sync_locks` | 名前差分あり | `sync_log` は概念名、物理実装は既存 2 テーブルを優先候補として扱う |
| `trigger_type=manual` | `trigger_type=admin` | enum 差分あり | `manual` と `admin` の正規化ルールを UT-09 / shared 契約で確定 |
| `status=pending/in_progress/completed/failed` | `running/success/failed/skipped` | enum 差分あり | 状態値の canonical set を UT-09 実装または仕様追補で統一 |
| `processed_offset` | 既存カラムなし | 機能差分あり | offset resume を採用するか、全範囲再取得 + 冪等 upsert 方針へ寄せるかを未タスク化 |
| `idempotency_key` | 既存カラムなし | 機能差分あり | `run_id` / lock holder / target range との関係を UT-09 で再設計 |
| `lock_expires_at` | `sync_locks.expires_at` | 実装済み相当 | `sync_locks` を active lock 実装として扱う |
| retry 最大 3 回 | `DEFAULT_MAX_RETRIES = 5` / `SYNC_MAX_RETRIES` | 値差分あり | 運用値を 3 に寄せるか 5 を正本化するかを UT-09 で決定 |

結論: `sync_log` 13 カラムは「新規テーブル作成指示」ではなく、同期ジョブ監査に必要な概念項目のチェックリストとして扱う。物理実装は既存 `sync_job_logs` / `sync_locks` とのマッピングを優先し、二重 ledger を避ける。
