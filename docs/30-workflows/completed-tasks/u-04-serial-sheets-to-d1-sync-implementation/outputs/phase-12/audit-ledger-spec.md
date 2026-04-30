# u-04 Audit Ledger Spec — sync_job_logs を audit ledger として使う対応表

## 採用テーブル

UT-01 設計の論理名 `sync_log` ではなく、既存物理テーブル **`sync_job_logs`** を audit ledger として採用する（u-04 Phase 2 Decision）。
`sync_locks` を mutex 用テーブルとして併用する。

## スキーマ対応表

| 論理（u-04 設計 / data-contract.md） | 物理（sync_job_logs） | 型 | 備考 |
| --- | --- | --- | --- |
| `id` | `id` | TEXT (uuid) | PK |
| `trigger` | `trigger` | TEXT CHECK in (`manual`,`scheduled`,`backfill`) | sync 起動経路 |
| `status` | `status` | TEXT CHECK in (`running`,`success`,`failed`,`skipped`) | running は mutex 中 |
| `fetched` | `fetched` | INTEGER | Sheets から取得した行数 |
| `upserted` | `upserted` | INTEGER | D1 へ upsert した行数 |
| `failed` | `failed` | INTEGER | mapping skip / upsert error 数 |
| `retry_count` | `retry_count` | INTEGER | fetchWithBackoff の retry 回数（0..3） |
| `started_at` | `started_at` | TEXT (ISO 8601) | NOT NULL |
| `finished_at` | `finished_at` | TEXT or NULL | running 中は NULL |
| `error_class` | `error_class` | TEXT or NULL | rate_limited / sheets_unauthorized / mutex_held / mapping_unmapped / unknown |
| `error_reason` | `error_reason` | TEXT or NULL | redact 済み（PII マスク後） |

## sync_locks（mutex）対応

| 論理 | 物理 | 型 | 備考 |
| --- | --- | --- | --- |
| `name` | `name` | TEXT PK | 固定値 `'sync'` |
| `acquired_at` | `acquired_at` | TEXT (ISO) | NOT NULL |
| `expires_at` | `expires_at` | TEXT (ISO) | 既定 acquired_at + 30 min |
| `holder_audit_id` | `holder_audit_id` | TEXT | sync_job_logs.id への ref |

`acquireSyncLock` は `expires_at < now()` の場合は強制取得（自動 expiry）。

## Audit ledger を生成する書き込み単位

| 関数 | 書き込み |
| --- | --- |
| `startRun(deps, trigger)` | sync_job_logs に row INSERT (status=`running`, started_at=now), sync_locks に lock 取得 |
| `finalizeRun(deps, id, summary, status)` | sync_job_logs を UPDATE (status=final, finished_at=now, fetched/upserted/failed/retry_count, error_*), sync_locks DELETE |
| `withSyncMutex(deps, trigger, fn)` | startRun → fn() → finalizeRun を try/catch で囲む |

## redact ルール（error_reason）

| 種別 | パターン | 置換 |
| --- | --- | --- |
| email | `[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}` | `[REDACTED_EMAIL]` |
| phone | 連続数字 8 桁以上 | `[REDACTED_NUMBER]` |
| token-like | `Bearer [A-Za-z0-9._-]+` | `Bearer [REDACTED]` |

実装: `apps/api/src/sync/audit.ts redact()`。テスト: `audit.test.ts > redact`.

## 監査クエリレシピ（`outputs/phase-10/sync-audit-recipes.md` 互換）

| ID | クエリ | 用途 |
| --- | --- | --- |
| R-01 | `SELECT * FROM sync_job_logs WHERE status='success' ORDER BY id DESC LIMIT 1` | 直近成功 |
| R-02 | `SELECT * FROM sync_job_logs WHERE status='failed' AND started_at >= datetime('now','-1 day')` | 24h 失敗一覧 |
| R-03 | `SELECT * FROM sync_job_logs WHERE status='running' AND started_at < datetime('now','-30 minute')` | 残留 running |
| R-04 | `SELECT AVG((julianday(finished_at)-julianday(started_at))*86400000) FROM sync_job_logs WHERE status='success' ORDER BY id DESC LIMIT 100` | 平均実行 ms |
| R-05 | `SELECT date(started_at) d, SUM(fetched) f, SUM(upserted) u FROM sync_job_logs WHERE started_at >= datetime('now','-7 day') GROUP BY d` | 7 日推移 |
| R-06 | mutex 強制解放（runbook §5 参照） | F-02 一次対応 |

## 不変条件適合

- 不変条件 #4 admin 列分離: audit ledger は `member_status.publish_state` 等を一切参照しない（write も read も）。
- 不変条件 #5 D1 アクセス境界: ledger writer は `apps/api/src/sync/audit.ts` に閉じる。apps/web からの参照は `GET /admin/sync/audit` 経由のみ（Bearer 認証）。
