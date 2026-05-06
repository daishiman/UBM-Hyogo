# Phase 2: データモデル設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | spec_created |
| 親仕様 | `docs/30-workflows/issue-408-cf-audit-logs-monitoring/index.md` |

## 目的

Cloudflare Audit Logs を保管する D1 schema (`cf_audit_log` / `cf_audit_baseline`) と、HIGH / MEDIUM / LOW 重要度判定ロジックを実装可能なレベルまで確定する。Phase 5 の migration / fetcher / analyzer 実装が DDL とロジック仕様だけで自走できる状態にする。

## 変更対象ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/api/migrations/0014_create_cf_audit_log.sql` | new | `cf_audit_log` / `cf_audit_baseline` テーブル DDL + index |
| `apps/api/migrations/0014_create_cf_audit_log.sql` | new | 30 日 TTL purge SQL (scheduled job 用) |
| `outputs/phase-2/schema-ddl.sql` | new (本 Phase 成果物) | Phase 5 が import する DDL 抜粋 |
| `outputs/phase-2/severity-rules.md` | new (本 Phase 成果物) | TypeScript 擬似コード正本 |

## DDL: `cf_audit_log`

```sql
-- apps/api/migrations/0014_create_cf_audit_log.sql
CREATE TABLE IF NOT EXISTS cf_audit_log (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id          TEXT    NOT NULL UNIQUE,         -- Cloudflare audit event id (idempotency key)
  actor_email       TEXT,                            -- Cloudflare account user email (Token actor は null になる場合あり)
  actor_ip          TEXT,                            -- IPv4 / IPv6 文字列
  actor_user_agent  TEXT,                            -- Token 経由の場合 wrangler/<ver> 等
  action            TEXT    NOT NULL,                -- e.g. "user.api_token.use", "worker.script.put"
  resource_type     TEXT,                            -- e.g. "worker_script", "d1_database"
  resource_id       TEXT,
  outcome           TEXT    NOT NULL,                -- "success" | "failure"
  metadata_json     TEXT,                            -- 元イベント JSON (重要 field 抜粋)
  event_timestamp   INTEGER NOT NULL,                -- unix epoch (秒)
  ingested_at_ms    INTEGER NOT NULL,
  severity          TEXT,                            -- "HIGH" | "MEDIUM" | "LOW" | NULL (未分類)
  CHECK (outcome IN ('success', 'failure')),
  CHECK (severity IS NULL OR severity IN ('HIGH', 'MEDIUM', 'LOW'))
);

CREATE INDEX IF NOT EXISTS idx_cf_audit_log_event_ts   ON cf_audit_log(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cf_audit_log_outcome    ON cf_audit_log(outcome, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cf_audit_log_severity   ON cf_audit_log(severity) WHERE severity IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cf_audit_log_actor_ip   ON cf_audit_log(actor_ip, event_timestamp DESC);
```

## DDL: `cf_audit_baseline`

```sql
CREATE TABLE IF NOT EXISTS cf_audit_baseline (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  window_start                INTEGER NOT NULL,    -- unix epoch (秒) 学習開始
  window_end                  INTEGER NOT NULL,    -- unix epoch (秒) 学習終了 (start + 7d)
  hourly_call_count_p99       INTEGER NOT NULL,    -- 1h あたり call 数の 99%tile (success+failure 合計)
  hourly_failure_count_p99    INTEGER NOT NULL,    -- 1h あたり failure (403) p99
  allowed_ip_set_json         TEXT    NOT NULL,    -- JSON array of CIDR/IP (GHA meta + 学習期間に出現した IP)
  allowed_action_set_json     TEXT    NOT NULL,    -- JSON array (学習期間に出現した action 文字列)
  business_hours_jst_start    INTEGER NOT NULL DEFAULT 9,    -- 09:00 JST
  business_hours_jst_end      INTEGER NOT NULL DEFAULT 19,   -- 19:00 JST
  rotation_window_json        TEXT,                -- 学習対象外区間 (rotation 期間)
  created_at                  INTEGER NOT NULL DEFAULT (unixepoch()),
  is_active                   INTEGER NOT NULL DEFAULT 1,    -- 1=現用 / 0=過去版
  CHECK (window_end > window_start),
  CHECK (is_active IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_cf_audit_baseline_active ON cf_audit_baseline(is_active, window_end DESC);
```

## TTL purge

```sql
-- apps/api/migrations/0014_create_cf_audit_log.sql
-- 監視 workflow 末尾で毎時 1 回呼び出す。30 日経過行を削除。
DELETE FROM cf_audit_log
WHERE event_timestamp < (unixepoch() - 30 * 24 * 60 * 60);
```

`cf_audit_baseline` は履歴として保持 (`is_active=0` で世代管理) — purge 対象外。

## 重要度判定ロジック (TypeScript 擬似コード)

```ts
// scripts/cf-audit-log/lib/severity-classifier.ts
import type { CfAuditEvent, CfAuditBaseline } from "./types";

export type Severity = "HIGH" | "MEDIUM" | "LOW" | null;

export interface ClassifyContext {
  baseline: CfAuditBaseline | null;       // 7 日学習未完了なら null → 全イベント未分類で記録のみ
  hourBucketStartUnix: number;            // 当該 1h window の開始
  hourBucketFailureCount: number;         // 当該 1h window 内で同 actor の outcome=failure 件数
  rotationWindows: Array<{ start: number; end: number }>;
  ghaMetaIpRanges: string[];              // https://api.github.com/meta の actions[]
}

export function classify(event: CfAuditEvent, ctx: ClassifyContext): Severity {
  // 学習期間中 (baseline 不在) は alerting 抑止
  if (ctx.baseline === null) return null;

  // rotation window 中は LOW/HIGH 抑止
  const inRotation = ctx.rotationWindows.some(
    (w) => event.eventTimestamp >= w.start && event.eventTimestamp <= w.end
  );

  // === HIGH: 漏洩疑い (success かつ allowed_ip 外) ===
  if (event.outcome === "success" && !inRotation) {
    const allowedIps = JSON.parse(ctx.baseline.allowed_ip_set_json) as string[];
    const allowed = isIpInAnyCidr(event.actorIp, allowedIps)
      || isIpInAnyCidr(event.actorIp, ctx.ghaMetaIpRanges);
    if (!allowed) return "HIGH";
  }

  // === MEDIUM: 1h failure が p99 × 1.5 超 (ブルートフォース疑い) ===
  if (event.outcome === "failure") {
    const threshold = Math.ceil(ctx.baseline.hourly_failure_count_p99 * 1.5);
    if (ctx.hourBucketFailureCount > threshold) return "MEDIUM";
  }

  // === LOW: business hours JST 09:00-19:00 外の Token 利用 (rotation 除外) ===
  if (!inRotation) {
    const jstHour = toJstHour(event.eventTimestamp);
    const { business_hours_jst_start: s, business_hours_jst_end: e } = ctx.baseline;
    if (jstHour < s || jstHour >= e) return "LOW";
  }

  return null;
}
```

### 判定ルールサマリ

| Severity | 条件 | Issue label | 例外 |
| --- | --- | --- | --- |
| HIGH | `outcome=success` AND `actor_ip` ∉ (`allowed_ip_set` ∪ `gha_meta_ip_ranges`) | `priority:high` / `type:security` | rotation window 内は抑止 |
| MEDIUM | 1h window 内 `outcome=failure` 件数 > `hourly_failure_count_p99 × 1.5` | `priority:medium` / `type:security` | baseline 未学習時は抑止 |
| LOW | 業務時間 (JST 09:00-19:00) 外の Token 利用 | `priority:low` / `type:security` | rotation window 内は抑止 |
| null | 学習期間中 / どの条件も該当しない | (Issue 起票なし) | record のみ |

### 判定の依存ソース

| ソース | 取得方法 | 反映先 |
| --- | --- | --- |
| GitHub Actions runner IP | `curl -s https://api.github.com/meta \| jq -r '.actions'` を毎日 1 回 fetch | `ghaMetaIpRanges` (analyze.ts in-memory cache) |
| business hours | 定数 (`cf_audit_baseline.business_hours_jst_start/end`) | baseline 行 |
| rotation window | DERIV-03 runbook が記録する `rotation_window_json` (baseline 行更新) | `ctx.rotationWindows` |
| allowed IP set | 7 日学習期間中に出現した actor_ip の unique set + GHA meta range | `cf_audit_baseline.allowed_ip_set_json` |
| p99 閾値 | 学習期間 168 時間バケットから `nearest-rank` 法で算出 | `hourly_call_count_p99` / `hourly_failure_count_p99` |

## 入出力契約

| I/O | 内容 |
| --- | --- |
| Input (fetch) | Cloudflare Audit Logs API JSON (`/accounts/:id/audit_logs`) |
| Storage | D1 `cf_audit_log` (insert; `event_id` UNIQUE で idempotent) |
| Input (analyze) | `cf_audit_log` 直近 1h + `cf_audit_baseline.is_active=1` 行 + GHA meta cache |
| Output (analyze) | `cf_audit_log.severity` 更新 + GitHub Issue 起票 |
| Input (baseline) | `cf_audit_log` 直近 7 日 |
| Output (baseline) | `cf_audit_baseline` 新行 insert + 旧行 `is_active=0` |

## テスト方針

| 観点 | 手段 | Phase |
| --- | --- | --- |
| schema 適用可否 | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env staging` | 5 |
| `event_id` UNIQUE 制約による idempotency | 同一 event を 2 回 insert し 2 回目が constraint error で握りつぶされる挙動を unit test 化 | 6 |
| severity classifier 純関数テスト | `severity-classifier.test.ts` で HIGH/MEDIUM/LOW/null それぞれ 1 ケース最低限 | 6 |
| baseline 計算 (p99 nearest-rank) | 168 サンプルの fixture で期待値検証 | 6 |
| TTL purge | 31 日前 timestamp の row を 1 件 insert → purge → count=0 | 8 |
| index ヒット | `EXPLAIN QUERY PLAN` で `idx_cf_audit_log_event_ts` 利用確認 | 9 |

## 実行コマンド (Phase 5 で実行する想定)

```bash
# migration 生成 (sequence 番号は当該リポジトリ既存 migration の最大値+1)
NEXT_SEQ=$(ls apps/api/migrations | sort | tail -1 | cut -d_ -f1)
NEW_SEQ=$(printf "%04d" $((10#$NEXT_SEQ + 1)))

cp outputs/phase-2/schema-ddl.sql \
  apps/api/migrations/${NEW_SEQ}_create_cf_audit_log.sql

# staging 適用
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env staging

# 適用確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env staging \
  --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'cf_audit%'"
```

## DoD（完了条件）

- [ ] `cf_audit_log` の全 column / CHECK 制約 / index が DDL に定義されている
- [ ] `cf_audit_baseline` の rotation_window_json / business_hours field が含まれる
- [ ] severity 判定 3 ルール (HIGH/MEDIUM/LOW) が TypeScript 擬似コードで明示
- [ ] HIGH/MEDIUM/LOW それぞれ Issue label マッピングが記載
- [ ] `outputs/phase-2/schema-ddl.sql` (DDL 抜粋ファイル) が成果物として生成
- [ ] `outputs/phase-2/severity-rules.md` (判定ロジック詳細) が成果物として生成
- [ ] migration sequence 番号採番ルールが Phase 5 から参照可能

## 成果物

- `outputs/phase-2/phase-2.md` (本書)
- `outputs/phase-2/schema-ddl.sql` (`cf_audit_log` + `cf_audit_baseline` + index DDL)
- `outputs/phase-2/severity-rules.md` (判定ロジック詳細・依存ソース表)

## 参照

- 親仕様: `docs/30-workflows/issue-408-cf-audit-logs-monitoring/index.md`
- Cloudflare Audit Logs API schema: https://developers.cloudflare.com/api/operations/audit-logs-list-user-s-audit-logs
- D1 SQL 互換性: https://developers.cloudflare.com/d1/build-with-d1/sql-statements/
