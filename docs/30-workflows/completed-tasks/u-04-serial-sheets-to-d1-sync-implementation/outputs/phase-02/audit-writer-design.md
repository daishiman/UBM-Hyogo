# audit-writer-design.md（sync_audit writer 共通基盤と物理対応表）

> 状態: completed-design
> 上位仕様: `../../phase-02.md`
> 関連: `sync-module-design.md` / `d1-contract-trace.md`
> 重要: **新規テーブル追加は U-05 owner**。本タスクでは既存 `sync_job_logs` / `sync_locks` に writer を寄せる対応表を確定する

## 1. 採用方針（DD-01）

03 contract は audit ledger を **論理名 `sync_audit`** で表現する。一方、現行 D1 には UT-09 由来の物理テーブル `sync_job_logs`（migration `0002_sync_logs_locks.sql`）と `sync_locks` が既に存在する。

**Phase 2 の決定**: 新規 `sync_audit` テーブルを追加せず、`sync_job_logs` を audit ledger の物理接続先として採用する。`sync_locks` は mutex の物理接続先として採用する。

理由:
- 二重 ledger を避ける（UT-01 sync-log-schema.md §9 の判断と整合）
- U-05 migration owner にスキーマ追加責務を持ち込まない
- 既存 `runSync` 実装が既に書き込み実績を持っているため、移植コストが低い
- 不足列（trigger='backfill' / `inserted_count` 等）は U-05 で `ALTER TABLE` するか、既存列にマップする（§3 で明示）

## 2. 物理 ↔ 論理 対応表

### 2.1 sync_audit ↔ sync_job_logs

| 03 contract `sync_audit` 列 | 既存 `sync_job_logs` 列 | 対応 | 補足 |
| --- | --- | --- | --- |
| `audit_id` (TEXT PK) | `run_id` (TEXT PK) | 直接マップ | UUID v4、`crypto.randomUUID()` |
| `trigger` (`manual`/`scheduled`/`backfill`) | `trigger_type` (`admin`/`cron`/`backfill`) | 値マップ要 | manual → admin、scheduled → cron、backfill → backfill。**writer 層で正規化**（DD-01 補足）。Phase 12 で正本を `manual`/`scheduled`/`backfill` に揃えるかは U-05 で再検討 |
| `started_at` (TEXT ISO8601) | `started_at` (TEXT ISO8601) | 直接マップ | - |
| `finished_at` | `finished_at` | 直接マップ | - |
| `status` (`running`/`success`/`failed`) | `status` (`running`/`success`/`failed`/`skipped`) | superset | `skipped` は契約には無いが本実装で必要（mutex 取得失敗時、DD-03） |
| `inserted_count` | **不足** | U-05 で `ALTER TABLE ADD COLUMN inserted_count INTEGER NOT NULL DEFAULT 0` を予約 | 暫定: `diff_summary_json` に格納するフォールバックを Phase 5 で実装 |
| `updated_count` | **不足** | 同上 | 同上 |
| `skipped_count` | **不足** | 同上 | 同上 |
| `failed_reason` | `error_reason` | 直接マップ | 既存 1000 文字制限を踏襲 |
| `diff_summary_json` | **不足** | U-05 で `ALTER TABLE ADD COLUMN diff_summary_json TEXT NOT NULL DEFAULT '{}'` を予約 | 暫定: `error_reason` に JSON を埋めない（観測性低下のため Phase 5 で U-05 と同期して列追加）|
| - | `fetched_count` | 既存 | 維持 |
| - | `upserted_count` | 既存 | 維持。`inserted_count + updated_count` の合計として読み替え |
| - | `failed_count` | 既存 | 維持 |
| - | `retry_count` | 既存 | AC-12 backoff の試行回数 |
| - | `duration_ms` | 既存 | finished - started |

**結論**: writer 側で `trigger`（manual ↔ admin）の正規化と `status='skipped'` の追加を行う。不足列（inserted/updated/skipped/diff_summary_json）は U-05 が `ALTER TABLE` で追加するまで `error_reason` ではなく **既存 `upserted_count` / `failed_count` を継続利用**しつつ、Phase 5 では U-05 完了後にフルカラム書き込みへ切替できるよう writer をフラグ駆動にする。

### 2.2 mutex ↔ sync_locks

| 概念 | `sync_locks` 列 | 補足 |
| --- | --- | --- |
| lock id | `id` (TEXT PK, default `sheets-to-d1`) | sync 系は単一 lock、本タスクで `id='sheets-to-d1'` を継続使用 |
| holder | `holder` (TEXT) | `audit_id`（UUID）を holder として渡す |
| acquired_at | `acquired_at` (TEXT) | ISO8601 |
| expires_at | `expires_at` (TEXT) | ttl 既定 10 分（既存 `DEFAULT_LOCK_TTL_MS`）|
| trigger | `trigger_type` (TEXT) | manual/scheduled/backfill |

mutex 取得は **単文 INSERT**（PK 衝突 = UNIQUE 違反 = 取得失敗）で race を閉じる（DD-02）。SELECT→INSERT 分離は禁止。stale lock（`expires_at < now`）は INSERT 前に DELETE する既存ロジックを継続。

## 3. writer インターフェース

```ts
// apps/api/src/sync/audit.ts（型シグネチャ、実装は Phase 5）

export interface AuditDeps {
  db: D1Database;
  now: () => Date;
  newId: () => string;     // crypto.randomUUID
  ttlMs?: number;          // mutex TTL、既定 10 分
}

export type SyncTrigger = "manual" | "scheduled" | "backfill";
export type AuditStatus = "running" | "success" | "failed" | "skipped";

export interface StartRunInput {
  trigger: SyncTrigger;
  holder?: string; // 既定: 新規 auditId
}

export interface StartRunResult {
  auditId: string;
  acquired: boolean;
  reason?: "another sync is in progress";
}

export interface DiffSummary {
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  fetched: number;
  retryCount: number;
  responseIds?: string[];
}

export interface AuditWriter {
  startRun(input: StartRunInput): Promise<StartRunResult>;
  finishRun(auditId: string, summary: DiffSummary): Promise<void>;
  failRun(auditId: string, reason: string, partial?: Partial<DiffSummary>): Promise<void>;
  skipRun(auditId: string, reason: string): Promise<void>; // mutex 取得失敗時
  listRecent(limit: number): Promise<AuditRow[]>;          // GET /admin/sync/audit
}

export function createAuditWriter(deps: AuditDeps): AuditWriter;
```

## 4. mutex 仕様（AC-7）

```
1. acquire 直前に `DELETE FROM sync_locks WHERE id='sheets-to-d1' AND expires_at < now`（stale 解放）
2. `INSERT INTO sync_locks (id, acquired_at, expires_at, holder, trigger_type) VALUES (?, ?, ?, ?, ?)`
   - PK 衝突 = UNIQUE 違反 → 取得失敗（acquired=false）
   - 成功 → audit row を `INSERT INTO sync_job_logs (run_id=auditId, trigger_type, status='running', started_at)` で生成
3. finishRun / failRun の最後に `DELETE FROM sync_locks WHERE id=? AND holder=?` で release
4. mutex 取得失敗時:
   - `INSERT INTO sync_job_logs (run_id, trigger_type, status='skipped', started_at, finished_at, error_reason='another sync is in progress', duration_ms=0)` で 1 件のみ記録（DD-03）
   - 二重 `running` row は作らない
```

**race condition 検証（TECH-M-01 / Q1）**: D1 はシリアライズ書き込みのため、同時 INSERT で UNIQUE 制約による排他が成立する。Phase 5 / 6 で実 D1 に対し manual + cron 同時起動を再現試験する。

## 5. 例外安全（TECH-M-03 / Q5）

`running` row が finalize されないリスクを `try / finally` で防ぐ:

```ts
const { auditId, acquired } = await audit.startRun({ trigger });
if (!acquired) return { skipped: true };
try {
  // ... sync 本体
  await audit.finishRun(auditId, summary);
} catch (err) {
  await audit.failRun(auditId, redact(err)); // PII 除去
} finally {
  // mutex は finishRun / failRun 内で release
}
```

`redact` は既存 `apps/api/src/jobs/sync-forms-responses.ts` のロジック（email マスク + 500 文字 cap）を再利用。

## 6. GET /admin/sync/audit 仕様

```
Request:  GET /admin/sync/audit?limit=20
Header:   Authorization: Bearer ${SYNC_ADMIN_TOKEN}
Response: 200 { items: AuditRow[] }

AuditRow = {
  auditId, trigger, status, startedAt, finishedAt,
  fetchedCount, upsertedCount, failedCount, retryCount,
  durationMs, errorReason
}
```

- `limit` 既定 20、最大 100。limit > 100 は 400 を返す
- `status` 絞り込みなし（observability 用途のため `status='failed'` フィルタは Phase 09b で metrics 化）
- 認可: `requireSyncAdmin` / `SYNC_ADMIN_TOKEN` Bearer

## 7. observability ハンドオフ

| 項目 | 引き渡し先 |
| --- | --- |
| `sync_job_logs` row 観測（最新 N 件、failed 30 日保持）| 09b cron monitoring |
| metrics 化（success rate、duration p95、retry rate）| 09b / U-02 observability |
| alert 設定（連続 N 回 failed）| 09b release-runbook |
| `inserted_count` / `updated_count` 列追加 | U-05 migration |

## 8. AC trace

| AC | 反映箇所 |
| --- | --- |
| AC-5 | §3 / §4 / §5（全経路で row 生成と finalize）|
| AC-7 | §4（mutex 単文 INSERT）|
| AC-12 | §3 `failRun` + §5 `try/finally` |
| TECH-M-01 | §4（race 検証）|
| TECH-M-03 | §5（try/finally）|
