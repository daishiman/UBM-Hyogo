# Phase 5 — 実装 (scripts / workflow / runbook)

## 目的

Phase 2/3 の設計に基づき、PR-A の差分一式を実装する。

## 実装手順

### 5-1. `post-switch-monitor.ts` の拡張

対象: `scripts/cf-audit-log/observation/post-switch-monitor.ts`

```ts
type Args = {
  aggregate: boolean;
  window: number;
  recoveryMode: boolean;
  since?: string;
  input: string;
  out: string;
  expectedSnapshots: number;
  requireNonSkeleton: boolean;
};

function parseArgs(argv: string[]): Args { /* yargs / minimist 等 */ }

function resolveOutPath(args: Args): string {
  if (args.out) return args.out;
  return args.recoveryMode
    ? "outputs/phase-11/evidence/hourly-run-7day-summary-recovery.json"
    : "outputs/phase-11/evidence/hourly-run-7day-summary.json";
}

function validate(args: Args): void {
  if (args.recoveryMode && !args.since) {
    console.error("since is required in recovery-mode");
    process.exit(2);
  }
}

function buildResult(snapshots, args): Result {
  return {
    mode: args.recoveryMode ? "recovery" : "normal",
    since: args.since,
    /* ... 親 #586 と同 schema、Phase 3 のフィールド ... */
  };
}
```

副作用: 標準出力に summary 表、`--out` path に JSON 書き出し。

### 5-2. `recovery-rootcause-helper.ts` の新規追加

対象: `scripts/cf-audit-log/observation/recovery-rootcause-helper.ts`

```ts
async function main(): Promise<void> {
  const since = parseSinceFromArgv();
  const runs = await fetchHourlyRuns(since); // gh api 経由
  const missing = detectMissingHours(runs);
  const candidate = classifyRootCause(missing); // 4 分類
  const md = renderMarkdown({ since, missing, candidate });
  await fs.writeFile("outputs/phase-11/evidence/recovery-rootcause.md", md);
}
```

入力: `--since <ISO8601>`
出力: `outputs/phase-11/evidence/recovery-rootcause.md` (Phase 3 schema)
副作用: read-only (gh api fetch のみ、production runtime には影響なし)

### 5-3. `.github/workflows/cf-audit-log-7day-summary.yml` 編集

```yaml
on:
  schedule:
    - cron: "0 1 */7 * *"
  workflow_dispatch:
    inputs:
      recovery_mode:
        description: "Run as recovery (2nd cycle) aggregation"
        type: boolean
        default: false
      since:
        description: "Recovery D'+0 ISO8601 UTC (required when recovery_mode=true)"
        type: string
        default: ""

jobs:
  aggregate:
    steps:
      - name: Validate inputs
        if: ${{ inputs.recovery_mode == true && inputs.since == '' }}
        run: |
          echo "::error::since is required when recovery_mode=true"
          exit 1
      - name: Aggregate
        run: |
          ARGS="--aggregate --window 168 --expected-snapshots 168 --require-non-skeleton --input ./hourly-snapshots"
          if [[ "${{ inputs.recovery_mode }}" == "true" ]]; then
            ARGS="--aggregate --window 168 --expected-snapshots 168 --require-non-skeleton --input ./hourly-snapshots-recovery --recovery-mode --since '${{ inputs.since }}'"
          fi
          mise exec -- pnpm tsx scripts/cf-audit-log/observation/post-switch-monitor.ts $ARGS
```

### 5-4. `15-infrastructure-runbook.md` 追記

対象: `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

追記内容（新規セクション）:
- `### CF Audit Log post-switch recovery (2 周目 7 日観測)`
- D'+0 定義: root cause 修正 PR merge 後、最初に成功する hourly schedule の `created_at` を D'+0 とする
- `retention-days: 8` 固定の理由 + 検証コマンド
- 最大 2 周制限 (Gate-MAX-CYCLE-2)
- recovery window 中の code freeze 規約 (`.github/workflows/cf-audit-log-*.yml` / `scripts/cf-audit-log/**` への新規 PR 凍結)

### 5-5. (条件付き) `cf-audit-log-monitor.yml` の root cause 修正

Phase 1 で `production-code` と分類された場合のみ実施。修正内容は Phase 1 の `recovery-rootcause.md` に従う。

## 完了条件

- [ ] 5-1〜5-4 が dirty diff として存在する
- [ ] 5-5 は分類に応じて実施 or 未実施 (未実施なら `recovery-rootcause.md` に `classification != production-code` の根拠が記載)
