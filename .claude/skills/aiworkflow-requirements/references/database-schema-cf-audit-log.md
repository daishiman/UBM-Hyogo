# Database Schema — Cloudflare Audit Logs (Issue #408)

`database-schema.md` の付録。`cf_audit_log` / `cf_audit_baseline` / `cf_audit_finding_dedupe` の 3 テーブルは「Cloudflare Account-level Audit Logs を D1 に取り込み severity 判定 + GitHub Issue 起票する監視 pipeline」専用ストアであり、`apps/api/` runtime からは参照しない。

> **2026-05-07 状態**: Issue #518 で自動監視は `HOLD / manual-check-only` に縮退済み。schema / scripts / D1 row は保持し rollback しないが、書込は hourly schedule ではなく `workflow_dispatch` 手動 run および local 実行（`pnpm exec tsx scripts/cf-audit-log/fetch.ts` 等）からのみ発生する。詳細は `references/observability-monitoring.md` §9 / `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` を参照。

根拠: `apps/api/migrations/0014_create_cf_audit_log.sql` / `scripts/cf-audit-log/d1-client.ts` / `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/outputs/phase-12/implementation-guide.md` / `docs/30-workflows/completed-tasks/issue-518-cf-audit-logs-monitoring-hold/outputs/phase-12/implementation-guide.md`。

---

## Cloudflare Audit Logs (Issue #408) — read-only 監視ストア

### 用途と書込境界

| 区分 | 主体 | 操作 |
|------|------|------|
| 書込 | `scripts/cf-audit-log/`（HOLD 中は `workflow_dispatch` の手動 run / local 実行のみ。Issue #408 設計の hourly schedule は #518 で停止） | INSERT / DELETE のみ |
| 読込 | 同上 (baseline 計算 / classifier / dedupe) | SELECT |
| 参照禁止 | `apps/api/` runtime / `apps/web/` | 一切のアクセスを行わない |

監視 pipeline 専用のため Hono ルートを生やさない。Workers binding で D1 を晒さず、`wrangler d1 execute --remote --json` を `scripts/cf-audit-log/d1-client.ts` の WranglerD1 実装経由で叩く。HOLD 中の書込は週次手動確認 runbook（`docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md`）の経路 A/B からのみ発生する。

### DDL

```sql
-- Issue #408 / migrations/0014_create_cf_audit_log.sql

CREATE TABLE IF NOT EXISTS cf_audit_log (
  id              TEXT PRIMARY KEY,        -- Cloudflare 採番の audit event id
  occurred_at     TEXT NOT NULL,           -- ISO8601 (CF API 値)
  occurred_at_ms  INTEGER NOT NULL,        -- epoch ms (index 用)
  actor_email     TEXT,
  actor_ip        TEXT,
  actor_ua        TEXT,
  action_type     TEXT NOT NULL,
  action_result   TEXT NOT NULL,
  result_code     INTEGER,
  resource_type   TEXT,
  resource_id     TEXT,
  raw_json        TEXT NOT NULL,           -- CF API レスポンス原文 (再分類用)
  ingested_at_ms  INTEGER NOT NULL,
  severity        TEXT,                    -- classifier 出力 (info/warn/critical)
  issue_number    INTEGER                  -- 起票済み GitHub Issue 番号 (なければ NULL)
);

CREATE INDEX IF NOT EXISTS idx_cf_audit_log_occurred ON cf_audit_log(occurred_at_ms);
CREATE INDEX IF NOT EXISTS idx_cf_audit_log_actor    ON cf_audit_log(actor_email, occurred_at_ms);
CREATE INDEX IF NOT EXISTS idx_cf_audit_log_severity ON cf_audit_log(severity, occurred_at_ms);

CREATE TABLE IF NOT EXISTS cf_audit_baseline (
  key         TEXT PRIMARY KEY,            -- baseline 識別子 (例: "actor_set", "action_type:zone.update")
  value_num   REAL NOT NULL,               -- 平均 / 件数 / しきい値
  computed_at TEXT NOT NULL,
  window_days INTEGER NOT NULL             -- baseline 計算ウィンドウ
);

CREATE TABLE IF NOT EXISTS cf_audit_finding_dedupe (
  finding_hash  TEXT PRIMARY KEY,          -- (severity + signature) のハッシュ
  issue_number  INTEGER NOT NULL,
  created_at_ms INTEGER NOT NULL
);
```

### INDEX 設計意図

- `idx_cf_audit_log_occurred`: TTL purge (`DELETE WHERE occurred_at_ms < ?`) と時系列窓集計の高速化
- `idx_cf_audit_log_actor`: actor 単位の baseline 比較 / surge 検出
- `idx_cf_audit_log_severity`: classifier 後の severity 別レポート

### 冪等性 / 重複処理

`scripts/cf-audit-log/d1-client.ts` は `INSERT OR IGNORE INTO cf_audit_log (...)` を使う。Cloudflare Audit Logs API は cursor-based pagination (`per_page=1000`) で再 fetch すると同じ `id` が返るため、PK + IGNORE で重複を吸収し中断耐性を確保する。`cf_audit_finding_dedupe` も同様に `INSERT OR IGNORE` で同一 finding の Issue 多重起票を防ぐ。

### TTL 方針 (30 日)

migration には DDL のみを置く。purge は `scripts/cf-audit-log/analyze.ts` の末尾で実行する（Issue #408 設計では毎時 schedule 駆動。Issue #518 HOLD 化以降は手動 run の都度に発火する）:

```ts
// analyze.ts (抜粋)
await purgeOlderThan(db, untilMs - 30 * 86_400_000);
//   -> DELETE FROM cf_audit_log WHERE occurred_at_ms < ?
```

migration trigger / scheduled query を採らない理由は D1 が EVENT トリガ非対応であり、schema migration に lifecycle を混ぜると再適用困難になるため (lessons-learned-issue-408 / L-ISSUE408-006)。

### Token 境界

監視 ingest は `CF_AUDIT_TOKEN_PROD` (`Account: Audit Logs:Read` のみ) を使い、deploy 用 `CLOUDFLARE_API_TOKEN` とは別 secret で管理する。流用禁止 (L-ISSUE408-002 / L-ISSUE408-007)。

### 参照元

- `apps/api/migrations/0014_create_cf_audit_log.sql` (DDL 正本)
- `scripts/cf-audit-log/d1-client.ts` (`insertAuditEvents` / `purgeOlderThan` / `recordFindingDedupe`)
- `scripts/cf-audit-log/analyze.ts` (TTL purge schedule)
- `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/outputs/phase-12/implementation-guide.md`
- `lessons-learned-issue-408-cf-audit-logs-monitoring-2026-05.md` (設計判断の根拠集)

## Issue #546 90 Day Observation Result（2026-05-08）

Issue #546 の read-only runtime observation では、production D1 に対する次の aggregate query を実行した。

```sql
SELECT COUNT(*) AS total
FROM cf_audit_log
WHERE occurred_at_ms >= unixepoch('now','-90 days') * 1000;
```

結果は redacted Cloudflare D1 error `no such table: cf_audit_log` であり、2026-05-08 時点では production D1 側の `cf_audit_log` readiness を確認できなかった。これはアプリ runtime schema 変更を要求するものではなく、Issue #408 の production migration / runtime readiness gate が未完了であることを示す運用 evidence として扱う。

Issue #546 の Gate-B は、この状態では false positive rate PASS として扱わず `PENDING_RUNTIME_EVIDENCE` を維持する。
- `docs/30-workflows/completed-tasks/issue-518-cf-audit-logs-monitoring-hold/outputs/phase-12/implementation-guide.md` (HOLD 縮退仕様)
- `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` (週次手動確認 runbook)
- `lessons-learned-issue-408-cf-audit-logs-monitoring-2026-05.md` (build-out 設計判断)
- `lessons-learned-issue-518-cf-audit-logs-hold-2026-05.md` (HOLD 縮退判断)
