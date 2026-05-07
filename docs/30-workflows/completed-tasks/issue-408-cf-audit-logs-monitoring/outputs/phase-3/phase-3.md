# Phase 3: アーキテクチャ設計（3-layer + watchdog）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | spec_created |
| 親仕様 | `docs/30-workflows/issue-408-cf-audit-logs-monitoring/index.md` |
| 上流 | `outputs/phase-1/phase-1.md` / `outputs/phase-2/phase-2.md` |

## 目的

Phase 2 で確定したデータモデルを実体化する 3 層構造 (`fetch` → `analyze` → `report`) と、独立 watchdog を設計する。Phase 5 (実装) 開始時にファイル配置・関数シグネチャ・呼び出し順序が一意に決まる詳細度まで落とし込む。

## アーキテクチャ概観 (ASCII component diagram)

```
                       ┌────────────────────────────────────────────────┐
                       │  GitHub Actions (schedule: '0 * * * *')        │
                       │  .github/workflows/cf-audit-log-monitor.yml    │
                       └────────────────────────────────────────────────┘
                                              │
                ┌─────────────────────────────┼─────────────────────────────┐
                ▼                             ▼                             ▼
   ┌─────────────────────┐      ┌─────────────────────────┐      ┌────────────────────┐
   │ fetch.ts            │      │ analyze.ts              │      │ baseline.ts (weekly)│
   │ Cloudflare Audit API│ ───▶ │ D1 query + classify     │ ───▶ │ p99 / allowed_ip set│
   │ → D1 INSERT (idemp.)│      │ → D1 UPDATE severity    │      │ → cf_audit_baseline │
   └─────────────────────┘      │ → GitHub Issue create   │      └────────────────────┘
            │                   └─────────────────────────┘
            ▼                              │
   ┌─────────────────────┐                 ▼
   │ D1: cf_audit_log    │      ┌─────────────────────┐
   │     cf_audit_baseline│ ◀── │ issue-reporter.ts  │
   └─────────────────────┘      │ gh CLI / REST API   │
                                └─────────────────────┘

   ┌──────────────────────────────────────────────────────────┐
   │ WATCHDOG (independent workflow, schedule: '15 * * * *')│
   │ .github/workflows/cf-audit-log-monitor-watchdog.yml      │
   │  - gh run list で cf-audit-log-monitor 直近成功時刻を取得 │
   │  - last_success > 2h なら type:security Issue を起票     │
   └──────────────────────────────────────────────────────────┘
```

## ファイル配置

| パス | 種別 | 責務 | LOC 目安 |
| --- | --- | --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | new | 1h schedule で fetch → analyze → (weekly trigger 時は baseline) を実行 | ~80 |
| `.github/workflows/cf-audit-log-monitor-watchdog.yml` | new | 30 分 schedule で監視 workflow の last success を確認 | ~40 |
| `scripts/cf-audit-log/fetch.ts` | new | Cloudflare Audit Logs API → D1 insert (idempotent) | ~120 |
| `scripts/cf-audit-log/analyze.ts` | new | D1 query → severity 分類 → severity update + Issue 起票 | ~150 |
| `scripts/cf-audit-log/baseline.ts` | new | 7 日学習 (p99 / allowed_ip_set 算出) → cf_audit_baseline insert | ~100 |
| `scripts/cf-audit-log/lib/cloudflare-client.ts` | new | Cloudflare API HTTP client (cursor pagination) | ~80 |
| `scripts/cf-audit-log/lib/d1-client.ts` | new | D1 HTTP API ラッパ (INSERT/UPDATE/SELECT) | ~80 |
| `scripts/cf-audit-log/lib/severity-classifier.ts` | new | Phase 2 ロジックの純関数実装 | ~80 |
| `scripts/cf-audit-log/lib/issue-reporter.ts` | new | GitHub Issue 作成 (gh CLI ラップ) | ~60 |
| `scripts/cf-audit-log/lib/types.ts` | new | `CfAuditEvent` / `CfAuditBaseline` 型 | ~40 |
| `scripts/cf.sh` | edit | サブコマンド `audit-log fetch|analyze|baseline` を追加 | +30 |
| `apps/api/migrations/0014_create_cf_audit_log.sql` | new | Phase 2 DDL を migration 化 | (Phase 2 抜粋) |
| `apps/api/migrations/0014_create_cf_audit_log.sql` | new | TTL purge SQL | ~10 |

## 関数シグネチャ

### `lib/types.ts`

```ts
export interface CfAuditEvent {
  eventId: string;
  actorEmail: string | null;
  actorIp: string | null;
  actorUserAgent: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  outcome: "success" | "failure";
  metadata: unknown;
  eventTimestamp: number; // unix epoch (秒)
}

export interface CfAuditBaseline {
  id: number;
  window_start: number;
  window_end: number;
  hourly_call_count_p99: number;
  hourly_failure_count_p99: number;
  allowed_ip_set_json: string;
  allowed_action_set_json: string;
  business_hours_jst_start: number;
  business_hours_jst_end: number;
  rotation_window_json: string | null;
  is_active: 0 | 1;
}
```

### `lib/cloudflare-client.ts`

```ts
export interface FetchAuditLogsParams {
  accountId: string;
  apiToken: string;
  since: Date;          // event_timestamp >= since
  until: Date;          // event_timestamp <  until
  perPage?: number;     // default 1000 (Cloudflare 上限)
}

export async function* fetchAuditLogs(
  params: FetchAuditLogsParams,
): AsyncGenerator<CfAuditEvent, void, void>;
```

`cursor` ベースページネーションを内部で隠蔽し、呼び出し側はイベントを iterate するだけ。

### `lib/d1-client.ts`

```ts
export interface D1Client {
  insertEvent(e: CfAuditEvent): Promise<{ inserted: boolean }>;  // event_id 衝突時 false
  updateSeverity(eventId: string, severity: Severity): Promise<void>;
  selectEventsForHour(hourStart: number): Promise<CfAuditEvent[]>;
  selectActiveBaseline(): Promise<CfAuditBaseline | null>;
  insertBaseline(b: Omit<CfAuditBaseline, "id" | "is_active">): Promise<number>;
  deactivatePreviousBaselines(): Promise<void>;
  purgeOlderThan(unix: number): Promise<{ deleted: number }>;
}

export function createD1Client(opts: {
  accountId: string;
  databaseId: string;
  apiToken: string;
}): D1Client;
```

### `lib/severity-classifier.ts`

```ts
export type Severity = "HIGH" | "MEDIUM" | "LOW" | null;

export interface ClassifyContext {
  baseline: CfAuditBaseline | null;
  hourBucketFailureCount: number;
  rotationWindows: Array<{ start: number; end: number }>;
  ghaMetaIpRanges: string[];
}

export function classify(event: CfAuditEvent, ctx: ClassifyContext): Severity;
export function isIpInAnyCidr(ip: string | null, ranges: string[]): boolean;
export function toJstHour(unixSec: number): number; // 0-23
```

### `lib/issue-reporter.ts`

```ts
export interface IssueDraft {
  severity: Exclude<Severity, null>;
  event: CfAuditEvent;
  context: { baselineId: number; hourBucketFailureCount: number };
}

export async function reportToGitHubIssue(draft: IssueDraft, opts: {
  repo: string;        // "daishiman/UBM-Hyogo"
  ghToken: string;     // GITHUB_TOKEN (workflow scope)
}): Promise<{ issueUrl: string; issueNumber: number }>;
```

label マッピング:

| severity | labels |
| --- | --- |
| HIGH | `priority:high`, `type:security`, `area:cloudflare` |
| MEDIUM | `priority:medium`, `type:security`, `area:cloudflare` |
| LOW | `priority:low`, `type:security`, `area:cloudflare` |

### Entry points

```ts
// scripts/cf-audit-log/fetch.ts
export async function main(args: {
  since: Date; until: Date;
}): Promise<{ inserted: number; skipped: number }>;

// scripts/cf-audit-log/analyze.ts
export async function main(args: {
  hourStart: Date;
}): Promise<{ classified: number; issuesCreated: number }>;

// scripts/cf-audit-log/baseline.ts
export async function main(args: {
  windowStart: Date; windowEnd: Date;
}): Promise<{ baselineId: number }>;
```

## シーケンス: 1 時間ティック

```
Time   Actor                  Action
─────  ────────────────────  ─────────────────────────────────────────────────
T+0s   GitHub Actions cron   workflow trigger (schedule '0 * * * *')
T+1s   workflow runner       checkout + pnpm install (cache hit)
T+5s   fetch.ts              CF API GET /accounts/:id/audit_logs?since=T-1h
                              cursor ループ (1〜N pages)
T+8s   fetch.ts              D1 INSERT OR IGNORE per event (event_id UNIQUE)
                              → {inserted: M, skipped: K}
T+9s   analyze.ts            D1 SELECT events for [T-1h, T] window
T+10s  analyze.ts            D1 SELECT cf_audit_baseline WHERE is_active=1
T+11s  analyze.ts            GHA meta cache load (24h TTL)
T+12s  analyze.ts            classify() per event, group by hour-bucket
T+13s  analyze.ts            for each non-null severity:
                                D1 UPDATE severity
                                issue-reporter.reportToGitHubIssue()
T+25s  analyze.ts            D1 DELETE TTL purge (>30d)
T+26s  workflow              upload artifact (analyze summary JSON)
T+27s  workflow              exit 0
─────  weekly Sunday 00:00 ──────────────────────────────────────────────
T+0s   GitHub Actions cron   workflow trigger (workflow_dispatch or weekly job)
T+1s   baseline.ts           D1 SELECT events for last 7d
T+5s   baseline.ts           p99 算出 / unique IP set / unique action set
T+6s   baseline.ts           D1 UPDATE prior baseline → is_active=0
                              D1 INSERT new baseline → is_active=1
```

## Workflow YAML 骨格

```yaml
# .github/workflows/cf-audit-log-monitor.yml
name: cf-audit-log-monitor
on:
  schedule:
    - cron: '0 * * * *'
  workflow_dispatch:
permissions:
  issues: write
  contents: read
concurrency:
  group: cf-audit-log-monitor
  cancel-in-progress: false
jobs:
  monitor:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - name: Fetch audit logs
        env:
          CF_AUDIT_TOKEN_PROD: ${{ secrets.CF_AUDIT_TOKEN_PROD }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
          D1_DATABASE_ID: ${{ vars.D1_DATABASE_ID_PROD }}
        run: pnpm tsx scripts/cf-audit-log/fetch.ts --since=-1h --until=now
      - name: Analyze and alert
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CF_AUDIT_TOKEN_PROD: ${{ secrets.CF_AUDIT_TOKEN_PROD }}
        run: pnpm tsx scripts/cf-audit-log/analyze.ts --hour=last
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: cf-audit-summary-${{ github.run_id }}
          path: outputs/cf-audit-summary.json
```

```yaml
# .github/workflows/cf-audit-log-monitor-watchdog.yml
name: cf-audit-log-monitor-watchdog
on:
  schedule:
    - cron: '15 * * * *'
permissions:
  issues: write
  actions: read
jobs:
  watchdog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check last success
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          LAST=$(gh run list --workflow cf-audit-log-monitor.yml \
            --status success --limit 1 --json updatedAt -q '.[0].updatedAt')
          NOW=$(date -u +%s)
          LAST_S=$(date -u -d "$LAST" +%s)
          DIFF=$(( NOW - LAST_S ))
          if [ "$DIFF" -gt 7200 ]; then
            gh issue create \
              --title "[watchdog] cf-audit-log-monitor stalled (last success ${DIFF}s ago)" \
              --label "priority:high,type:security,area:cloudflare" \
              --body "Last success: ${LAST}. Investigate workflow failures."
          fi
```

## `scripts/cf.sh` 拡張

```sh
# 追加サブコマンド
bash scripts/cf.sh audit-log fetch    --since=-1h --until=now
bash scripts/cf.sh audit-log analyze  --hour=last
bash scripts/cf.sh audit-log baseline --window=7d
```

実装方針: 既存 `scripts/cf.sh` の dispatcher に `audit-log)` ケースを追加し、内部で `mise exec -- pnpm tsx scripts/cf-audit-log/<sub>.ts "$@"` を呼ぶ。op run / esbuild / Node 24 保証は既存 wrapper をそのまま継承。

## Failure mode 分析

| 障害 | 検知経路 | 対処 | 設計上の保証 |
| --- | --- | --- | --- |
| Cloudflare API down (5xx) | `fetch.ts` exit 非 0 | 当該 1h はスキップ、次回再 fetch (since= 前回成功時刻) | `cursor` でなく `since/until` 指定により再実行で取りこぼしなし |
| Cloudflare API rate limit (429) | HTTP 429 | exponential backoff (1s → 2s → 4s, max 3 retries) | 1h あたり数百 event 想定で rate limit には届かない設計 |
| D1 quota exceeded (10GB free) | `d1-client.insertEvent` error | watchdog 経由で alert + 30 日 TTL purge を 7 日に短縮 | 1h × 30d × 数 KB で 10GB 余裕 (約 10MB) |
| GitHub Issue API rate limit | `issue-reporter` 失敗 | 同一 severity の重複 Issue は 1h 内 1 件に集約 (event_id をタイトルに含めず actor_ip + hour 単位で dedupe) | abuse rate limit (1000/h) に対し 1h で最大数件想定 |
| 監視 Token 失効 | `fetch.ts` 401 | watchdog が last success 経過時間で検知 → 別経路 alert | watchdog は監視 workflow と独立して動作 |
| watchdog 自身の停止 | (検知不可) | week 1 回 manual `gh run list --workflow watchdog` 確認を runbook 化 | (構造的限界) |
| GHA meta API down | analyze.ts のキャッシュ fallback | 24h cache (`outputs/phase-9/gha-meta-cache.json`) で動作 | cache hit 優先 |
| baseline 学習未完了 | `selectActiveBaseline` → null | severity=null で記録のみ、Issue 起票なし | 7 日経過時点で baseline.ts 初回実行 |
| rotation window と HIGH 衝突 | `inRotation` チェック | severity 抑止 (record のみ) | DERIV-03 連携で `rotation_window_json` を baseline に書き込む運用 |

## 入出力契約

| Component | Input | Output |
| --- | --- | --- |
| fetch.ts | `--since`, `--until`, env: `CF_AUDIT_TOKEN_PROD` / `CLOUDFLARE_ACCOUNT_ID` / `D1_DATABASE_ID` | D1 `cf_audit_log` insert + stdout JSON `{inserted, skipped}` |
| analyze.ts | `--hour`, env: `GITHUB_TOKEN` / D1 接続 | D1 severity update + Issues + `outputs/cf-audit-summary.json` |
| baseline.ts | `--window`, D1 接続 | D1 `cf_audit_baseline` insert |
| watchdog | `gh run list` 出力 | (検知時のみ) Issue 1 件 |

## テスト方針

| 層 | テスト | Phase |
| --- | --- | --- |
| `severity-classifier.ts` | 純関数 unit test (HIGH/MEDIUM/LOW/null × rotation 内外) | 6 |
| `cloudflare-client.ts` | cursor pagination のモック (3 page) | 6 |
| `d1-client.ts` | event_id 重複時 `inserted=false` 返却 | 6 |
| `issue-reporter.ts` | label マッピング | 6 |
| 全体 e2e | dummy event を fetch → analyze → Issue 起票まで通す (staging D1) | 8 |
| watchdog | workflow を意図的に skip させ 2h 経過後の Issue 起票 | 8 / 11 |

## 実行コマンド (ローカル動作確認)

```bash
# fetch のみ手動実行 (staging)
mise exec -- pnpm tsx scripts/cf-audit-log/fetch.ts --since=-1h --until=now

# analyze 単独実行 (DB に既に event がある前提)
mise exec -- pnpm tsx scripts/cf-audit-log/analyze.ts --hour=last --dry-run

# baseline 学習 (7 日)
bash scripts/cf.sh audit-log baseline --window=7d
```

## DoD（完了条件）

- [ ] ASCII component diagram が 3 層 + watchdog を明示
- [ ] 全 11 ファイルの責務 / LOC 目安が一覧化
- [ ] `lib/*` 5 モジュールの関数シグネチャが TypeScript で記述
- [ ] 1h tick の sequence が 27 秒の時間軸で記述
- [ ] watchdog YAML 骨格が `gh run list` の `last success` 経過時間検知ロジックを含む
- [ ] failure mode 9 種それぞれに検知経路 / 対処 / 設計保証 が記述
- [ ] `scripts/cf.sh audit-log <sub>` の dispatcher 追加方針が明記
- [ ] `outputs/phase-3/architecture-diagram.md` / `file-layout.md` が成果物として生成

## 成果物

- `outputs/phase-3/phase-3.md` (本書)
- `outputs/phase-3/architecture-diagram.md` (ASCII diagram + sequence の独立ファイル)
- `outputs/phase-3/file-layout.md` (ファイル配置・LOC 目安・責務一覧)

## 参照

- 親仕様: `docs/30-workflows/issue-408-cf-audit-logs-monitoring/index.md`
- Phase 2: `outputs/phase-2/phase-2.md`
- GitHub Actions schedule: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule
- Cloudflare Audit Logs API: https://developers.cloudflare.com/api/operations/audit-logs-list-user-s-audit-logs
