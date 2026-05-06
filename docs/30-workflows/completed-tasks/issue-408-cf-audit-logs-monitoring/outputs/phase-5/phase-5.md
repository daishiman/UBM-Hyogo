# Phase 5: 実装手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | spec_created |

## 目的

Phase 2-3 で確定した schema / アーキテクチャに基づき、Cloudflare Audit Logs 監視の実装を**最小依存順序**で完了する。本フェーズの完了条件は「`bash scripts/cf.sh audit-log fetch --since ISO --until ISO` が production audit log を D1 に書き込み、`audit-log analyze --window 1h --dry-run` が Phase 4 fixture 全シナリオで期待 severity を返す」こと。

## 実装順序（依存 DAG 順）

| # | 対象 | 依存 |
| --- | --- | --- |
| S1 | D1 migration (`apps/api/migrations/NNNN_create_cf_audit_log.sql`) | なし |
| S2 | `scripts/cf-audit-log/types.ts`（共有型） | なし |
| S3 | `scripts/cf-audit-log/cloudflare-client.ts` | S2 |
| S4 | `scripts/cf-audit-log/d1-client.ts` | S1, S2 |
| S5 | `scripts/cf-audit-log/severity-classifier.ts` | S2 |
| S6 | `scripts/cf-audit-log/issue-reporter.ts` | S2 |
| S7 | `scripts/cf-audit-log/fetch.ts`（CLI entry） | S3, S4 |
| S8 | `scripts/cf-audit-log/analyze.ts`（CLI entry） | S4, S5, S6 |
| S9 | `scripts/cf-audit-log/baseline.ts` | S4 |
| S10 | `scripts/cf.sh` `audit-log` サブコマンド拡張 | S7, S8, S9 |
| S11 | `.github/workflows/cf-audit-log-monitor.yml` | S10 |
| S12 | `.github/workflows/cf-audit-log-monitor-watchdog.yml` | S11 |
| S13 | 1Password / GitHub Secrets 登録 runbook | S11 |

---

### S1: D1 migration

**変更対象**: `apps/api/migrations/0014_create_cf_audit_log.sql`（既存最大番号 `0013` の次。実装時に `ls apps/api/migrations/` で再確認し、衝突時は `+1` する）

**SQL 骨格**:

```sql
-- 0014_create_cf_audit_log.sql
CREATE TABLE IF NOT EXISTS cf_audit_log (
  id              TEXT PRIMARY KEY,            -- Cloudflare event id
  occurred_at     TEXT NOT NULL,               -- ISO8601 UTC
  occurred_at_ms  INTEGER NOT NULL,            -- epoch ms (index 用)
  actor_email     TEXT,
  actor_ip        TEXT,
  actor_ua        TEXT,
  action_type     TEXT NOT NULL,
  action_result   TEXT NOT NULL,               -- success / failure
  result_code     INTEGER,
  resource_type   TEXT,
  resource_id     TEXT,
  raw_json        TEXT NOT NULL,               -- 元 event JSON
  ingested_at_ms  INTEGER NOT NULL,
  severity        TEXT,                        -- HIGH/MEDIUM/LOW/null
  issue_number    INTEGER                      -- 起票済 Issue 番号
);

CREATE INDEX IF NOT EXISTS idx_cf_audit_log_occurred ON cf_audit_log(occurred_at_ms);
CREATE INDEX IF NOT EXISTS idx_cf_audit_log_actor    ON cf_audit_log(actor_email, occurred_at_ms);
CREATE INDEX IF NOT EXISTS idx_cf_audit_log_severity ON cf_audit_log(severity, occurred_at_ms);

CREATE TABLE IF NOT EXISTS cf_audit_baseline (
  key         TEXT PRIMARY KEY,                -- e.g. "success_per_hour_p95"
  value_num   REAL NOT NULL,
  computed_at TEXT NOT NULL,
  window_days INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cf_audit_finding_dedupe (
  finding_hash TEXT PRIMARY KEY,
  issue_number INTEGER NOT NULL,
  created_at_ms INTEGER NOT NULL
);
```

**TTL purge** は同じ migration 末尾に `DELETE` 文ではなく、analyze.ts 末尾で `DELETE FROM cf_audit_log WHERE occurred_at_ms < ?` を 30 日 cutoff で実行する（schedule 駆動）。

**実行コマンド**:

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
```

**確認**: `migrations list` の結果に `0014_create_cf_audit_log` が `applied` で表示。

---

### S2: types.ts

**変更対象**: `scripts/cf-audit-log/types.ts`

```ts
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AuditLogEvent {
  id: string;
  when: string;          // ISO8601
  actor: { email?: string; ip?: string; user_agent?: string };
  action: { type: string; result: 'success' | 'failure'; result_code?: number };
  resource?: { type?: string; id?: string };
}

export interface Baseline {
  successPerHourP95: number;
  failurePerHourP95: number;
  offHoursRatio: number;
  computedAt: string;
  windowDays: number;
}

export interface Finding {
  severity: Severity;
  reason: string;
  event: AuditLogEvent;
  dedupeKey: string;     // sha256
  titlePrefix: string;
  labels: string[];
}
```

---

### S3: cloudflare-client.ts

**変更対象**: `scripts/cf-audit-log/cloudflare-client.ts`

**関数シグネチャ**:

```ts
export async function* fetchAuditLogs(opts: {
  accountId: string;
  token: string;
  since: Date;
  until: Date;
  perPage?: number;     // default 1000
  fetchFn?: typeof fetch; // 注入可能（test 用）
}): AsyncIterable<AuditLogEvent> {
  const fetchImpl = opts.fetchFn ?? fetch;
  const base = `https://api.cloudflare.com/client/v4/accounts/${opts.accountId}/audit_logs`;
  let cursor: string | null = null;
  do {
    const url = new URL(base);
    url.searchParams.set('since', opts.since.toISOString());
    url.searchParams.set('until', opts.until.toISOString());
    url.searchParams.set('per_page', String(opts.perPage ?? 1000));
    if (cursor) url.searchParams.set('cursor', cursor);

    const res = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${opts.token}` },
    });
    if (!res.ok) throw new Error(`CF audit_logs ${res.status} ${await res.text()}`);
    const json = (await res.json()) as {
      result: AuditLogEvent[];
      result_info?: { cursor?: string | null };
    };
    for (const ev of json.result) yield ev;
    cursor = json.result_info?.cursor ?? null;
  } while (cursor);
}
```

**入力**: accountId, token (Bearer), since/until (Date)
**出力**: AsyncIterable<AuditLogEvent>
**副作用**: HTTP GET（page 数分）
**確認**: unit test で `fetchFn` mock 注入し、cursor が 2 ページ → 全件 yield されることを確認。

---

### S4: d1-client.ts

**変更対象**: `scripts/cf-audit-log/d1-client.ts`

**関数シグネチャ**:

```ts
export interface D1Like {
  prepare(sql: string): { bind(...args: unknown[]): { run(): Promise<unknown>; all<T>(): Promise<{ results: T[] }> } };
}

export async function insertEvents(db: D1Like, events: AuditLogEvent[]): Promise<{ inserted: number; skipped: number }>;
export async function recentEventsInWindow(db: D1Like, sinceMs: number, untilMs: number): Promise<AuditLogEvent[]>;
export async function purgeOlderThan(db: D1Like, cutoffMs: number): Promise<{ deleted: number }>;
export async function loadBaseline(db: D1Like): Promise<Baseline | null>;
export async function saveBaseline(db: D1Like, b: Baseline): Promise<void>;
export async function isAlreadyReported(db: D1Like, dedupeKey: string): Promise<number | null>;
export async function recordReported(db: D1Like, dedupeKey: string, issueNumber: number): Promise<void>;
```

**実装メモ**:
- `insertEvents` は `INSERT OR IGNORE`（id PK で dedupe）
- 本番では `wrangler d1 execute` 経由で REST 呼び出しのため、ローカル CLI script 用に `--remote` フラグで `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "..."` を内部呼び出しするラッパーを別途用意する

---

### S5: severity-classifier.ts

**変更対象**: `scripts/cf-audit-log/severity-classifier.ts`

**関数シグネチャ**:

```ts
export interface ClassifierContext {
  githubIpRanges: string[];     // CIDR list, from api.github.com/meta
  businessHoursJst: { start: number; end: number }; // [9, 22]
  recentFailuresInHour: number; // 同 actor の 1h 内 403 件数
  rotationWindowMs: { start: number; end: number } | null;
}

export function classify(
  event: AuditLogEvent,
  baseline: Baseline | null,
  ctx: ClassifierContext,
): { severity: Severity; reason: string } | null {
  // baseline 未学習 (null) → null（learning 中）
  if (!baseline) return null;

  // rotation 期間中の event は対象外
  if (ctx.rotationWindowMs) {
    const t = Date.parse(event.when);
    if (t >= ctx.rotationWindowMs.start && t <= ctx.rotationWindowMs.end) return null;
  }

  // HIGH: success かつ GitHub IP range 外
  if (event.action.result === 'success' && event.actor.ip
      && !isInCidrList(event.actor.ip, ctx.githubIpRanges)) {
    return { severity: 'HIGH', reason: `foreign-ip success from ${event.actor.ip}` };
  }

  // MEDIUM: 403 burst（baseline p95 の 5x 超）
  if (event.action.result === 'failure' && event.action.result_code === 403
      && ctx.recentFailuresInHour >= Math.max(5, baseline.failurePerHourP95 * 5)) {
    return { severity: 'MEDIUM', reason: `403 burst ${ctx.recentFailuresInHour}/h` };
  }

  // LOW: 業務時間外 success
  if (event.action.result === 'success') {
    const jstHour = (new Date(event.when).getUTCHours() + 9) % 24;
    if (jstHour < ctx.businessHoursJst.start || jstHour >= ctx.businessHoursJst.end) {
      return { severity: 'LOW', reason: `off-hours success at JST ${jstHour}:00` };
    }
  }
  return null;
}

function isInCidrList(ip: string, cidrs: string[]): boolean { /* 既存 ip-cidr lib or 自前 */ }
```

**入力**: AuditLogEvent / Baseline / Context
**出力**: `{ severity, reason } | null`
**副作用**: なし（純関数）
**確認**: Phase 6 で TC-01〜TC-07 全網羅。

---

### S6: issue-reporter.ts

**変更対象**: `scripts/cf-audit-log/issue-reporter.ts`

**関数シグネチャ**:

```ts
import type { Octokit } from '@octokit/rest';

export async function reportFinding(
  finding: Finding,
  deps: {
    octokit: Pick<Octokit, 'rest'>;
    owner: string;
    repo: string;
    isAlreadyReported: (key: string) => Promise<number | null>;
    recordReported: (key: string, issueNumber: number) => Promise<void>;
    dryRun?: boolean;
  },
): Promise<{ issueNumber: number; deduped: boolean }> {
  const existing = await deps.isAlreadyReported(finding.dedupeKey);
  if (existing) return { issueNumber: existing, deduped: true };

  const title = `${finding.titlePrefix}${finding.event.actor.email ?? 'unknown'}@${finding.event.when}`;
  const body  = renderBody(finding); // event JSON + reason + runbook link

  if (deps.dryRun) {
    process.stdout.write(`[DRY-RUN] would create issue: ${title} labels=${finding.labels.join(',')} hash=${finding.dedupeKey}\n`);
    return { issueNumber: -1, deduped: false };
  }
  const res = await deps.octokit.rest.issues.create({
    owner: deps.owner, repo: deps.repo, title, body, labels: finding.labels,
  });
  await deps.recordReported(finding.dedupeKey, res.data.number);
  return { issueNumber: res.data.number, deduped: false };
}
```

**dedupe 仕様**: `finding.dedupeKey = sha256(severity + actor.email + bucket(event.when))`。bucket は HIGH/LOW=日, MEDIUM=時。

---

### S7: fetch.ts

**変更対象**: `scripts/cf-audit-log/fetch.ts`

**関数シグネチャ**:

```ts
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2)); // --since --until [--account]
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const token     = process.env.CF_AUDIT_TOKEN_PROD!;
  const db        = await openD1();
  let total = 0;
  for await (const ev of fetchAuditLogs({ accountId, token, since: new Date(args.since), until: new Date(args.until) })) {
    await insertEvents(db, [ev]);
    total++;
  }
  process.stdout.write(JSON.stringify({ ok: true, total }) + '\n');
}
main().catch((e) => { console.error(e); process.exit(1); });
```

**入力**: `--since ISO --until ISO`
**出力**: stdout に JSON `{ok, total}`、終了コード 0/1
**副作用**: D1 INSERT、HTTP GET

---

### S8: analyze.ts

**変更対象**: `scripts/cf-audit-log/analyze.ts`

**関数シグネチャ**:

```ts
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  // --window 1h | --fixture path | --dry-run
  const db = args.fixture ? openFakeD1FromFixture(args.fixture) : await openD1();
  const baseline = await loadBaseline(db);
  const events = await recentEventsInWindow(db, untilMs - parseDuration(args.window), untilMs);
  const githubCidrs = await loadGithubIpRanges(); // cached file
  const findings: Finding[] = [];
  for (const ev of events) {
    const recent403 = await count403FromActor(db, ev.actor.email, untilMs - 3600_000, untilMs);
    const r = classify(ev, baseline, { githubIpRanges: githubCidrs, businessHoursJst: {start: 9, end: 22}, recentFailuresInHour: recent403, rotationWindowMs: loadRotationWindow() });
    if (r) findings.push(toFinding(ev, r));
  }
  for (const f of findings) {
    await reportFinding(f, { octokit, owner, repo, isAlreadyReported: k => isAlreadyReported(db, k), recordReported: (k,n) => recordReported(db,k,n), dryRun: args.dryRun });
  }
  await purgeOlderThan(db, untilMs - 30 * 86_400_000);
  process.stdout.write(JSON.stringify({ ok: true, findings: findings.length }) + '\n');
}
```

---

### S9: baseline.ts

**変更対象**: `scripts/cf-audit-log/baseline.ts`

**関数シグネチャ**:

```ts
export async function computeBaseline(db: D1Like, days: number): Promise<Baseline> {
  const untilMs = Date.now();
  const sinceMs = untilMs - days * 86_400_000;
  const events = await recentEventsInWindow(db, sinceMs, untilMs);
  // hourly bucket → success/failure 件数 → trimmed p95
  return {
    successPerHourP95: trimmedP95(hourlyCounts(events, 'success')),
    failurePerHourP95: trimmedP95(hourlyCounts(events, 'failure')),
    offHoursRatio: offHoursRatio(events),
    computedAt: new Date().toISOString(),
    windowDays: days,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2)); // --days 7
  const b = await computeBaseline(await openD1(), Number(args.days ?? 7));
  await saveBaseline(await openD1(), b);
  process.stdout.write(JSON.stringify(b) + '\n');
}
```

---

### S10: cf.sh 拡張

**変更対象**: `scripts/cf.sh`

**追加サブコマンド**:

```bash
# scripts/cf.sh 末尾の case 文に audit-log を追加
audit-log)
  shift
  sub="$1"; shift
  case "$sub" in
    fetch)
      mise exec -- op run --env-file=.env -- pnpm tsx scripts/cf-audit-log/fetch.ts "$@"
      ;;
    analyze)
      mise exec -- op run --env-file=.env -- pnpm tsx scripts/cf-audit-log/analyze.ts "$@"
      ;;
    baseline)
      mise exec -- op run --env-file=.env -- pnpm tsx scripts/cf-audit-log/baseline.ts "$@"
      ;;
    *) echo "unknown audit-log subcommand: $sub" >&2; exit 2 ;;
  esac
  ;;
```

**実行例**:

```bash
bash scripts/cf.sh audit-log fetch --since 2026-05-06T00:00:00Z --until 2026-05-06T01:00:00Z
bash scripts/cf.sh audit-log analyze --window 1h
bash scripts/cf.sh audit-log baseline --days 7
```

---

### S11: cf-audit-log-monitor.yml

**変更対象**: `.github/workflows/cf-audit-log-monitor.yml`

```yaml
name: cf-audit-log-monitor
on:
  schedule:
    - cron: '0 * * * *'   # hourly
  workflow_dispatch:
permissions:
  contents: read
  issues: write
concurrency:
  group: cf-audit-log-monitor
  cancel-in-progress: false
jobs:
  fetch-and-analyze:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2
      - run: pnpm install --frozen-lockfile
      - name: Compute window
        id: w
        run: |
          UNTIL=$(date -u +%Y-%m-%dT%H:00:00Z)
          SINCE=$(date -u -d '1 hour ago' +%Y-%m-%dT%H:00:00Z)
          echo "since=$SINCE" >>"$GITHUB_OUTPUT"
          echo "until=$UNTIL" >>"$GITHUB_OUTPUT"
      - name: Fetch audit logs
        env:
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
          CF_AUDIT_TOKEN_PROD:   ${{ secrets.CF_AUDIT_TOKEN_PROD }}
        run: pnpm tsx scripts/cf-audit-log/fetch.ts --since "${{ steps.w.outputs.since }}" --until "${{ steps.w.outputs.until }}"
      - name: Analyze
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: pnpm tsx scripts/cf-audit-log/analyze.ts --window 1h
      - name: Mark success heartbeat
        if: success()
        run: date -u +%s > /tmp/heartbeat && gh api -X PATCH repos/${{ github.repository }}/actions/variables/CF_AUDIT_LAST_SUCCESS_AT -f value=$(cat /tmp/heartbeat)
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

### S12: cf-audit-log-monitor-watchdog.yml

**変更対象**: `.github/workflows/cf-audit-log-monitor-watchdog.yml`

```yaml
name: cf-audit-log-monitor-watchdog
on:
  schedule:
    - cron: '15 * * * *'   # 監視 workflow の 15 分ずらし
  workflow_dispatch:
permissions:
  contents: read
  issues: write
  actions: read
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Verify last success within 2h
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          LAST=$(gh api repos/${{ github.repository }}/actions/variables/CF_AUDIT_LAST_SUCCESS_AT -q .value || echo 0)
          NOW=$(date -u +%s)
          DIFF=$((NOW - LAST))
          if [ "$DIFF" -gt 7200 ]; then
            gh issue create \
              --title "[CF-AUDIT][WATCHDOG] cf-audit-log-monitor stale ${DIFF}s" \
              --body  "Last success heartbeat: ${LAST}. Diff: ${DIFF}s." \
              --label priority:high --label type:reliability
          fi
```

---

### S13: 1Password / GitHub Secrets 登録 runbook

**変更対象**: `outputs/phase-5/secrets-registration.md`（runbook）

| step | 操作 | 確認 |
| --- | --- | --- |
| 1 | Cloudflare Dashboard で `Audit Logs:Read` のみの API Token を発行 | Token 名 `audit-log-reader-prod` |
| 2 | 1Password vault `UBM-Hyogo Production` に Item `CF_AUDIT_TOKEN_PROD` 作成（field: `credential`） | `op item get CF_AUDIT_TOKEN_PROD` |
| 3 | `.env` に `CF_AUDIT_TOKEN_PROD="op://UBM-Hyogo Production/CF_AUDIT_TOKEN_PROD/credential"` を追記 | `op run` で展開可能 |
| 4 | GitHub Secret `CF_AUDIT_TOKEN_PROD` を実値で登録 | `gh secret list` |
| 5 | GitHub Variable `CF_AUDIT_LAST_SUCCESS_AT` を `0` で初期化 | `gh variable list` |
| 6 | `bash scripts/cf.sh whoami`（audit token 用に切替）で 200 を確認 | success |

---

## 全体実行コマンド

```bash
# typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# migration
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production

# 動作確認 (本番 1h sample)
bash scripts/cf.sh audit-log fetch --since 2026-05-06T00:00:00Z --until 2026-05-06T01:00:00Z
bash scripts/cf.sh audit-log analyze --window 1h --dry-run

# baseline 学習トリガー
bash scripts/cf.sh audit-log baseline --days 7
```

## 成果物

- `outputs/phase-5/phase-5.md`（本ファイル）
- `outputs/phase-5/implementation-steps.md`（S1-S13 の checklist 版）
- `outputs/phase-5/code-skeletons.md`（S2-S9 のコード骨格抜粋）
- `outputs/phase-5/secrets-registration.md`（S13 runbook）

## DoD（完了条件）

- [ ] S1-S13 全て完了し各「確認方法」が green
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` green
- [ ] `bash scripts/cf.sh audit-log fetch --since ... --until ...` で production audit log を D1 に書き込み成功
- [ ] `bash scripts/cf.sh audit-log analyze --fixture <F2> --dry-run` で `[DRY-RUN] would create issue: [CF-AUDIT][HIGH] ...` が出力
- [ ] `cf-audit-log-monitor.yml` の手動 dispatch が success
- [ ] `cf-audit-log-monitor-watchdog.yml` の手動 dispatch が success（heartbeat 直後なら起票なし）
- [ ] migration 0014 が production に applied
- [ ] dedupe で TC-06（同一 finding 2 連続実行）が Issue 1 件のみ起票
