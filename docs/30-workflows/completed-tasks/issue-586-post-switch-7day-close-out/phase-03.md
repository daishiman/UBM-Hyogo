# Phase 3: 設計（hourly artifact upload / 7day summary job / SSOT 昇格）

## 目的

production switch 後の 7 日 hourly evidence 収集と `pass_runtime_synced` 昇格を成立させるため、(1) hourly workflow 改修、(2) 7day summary scheduled workflow、(3) aggregation 出力 schema、(4) SSOT 4 ファイル昇格契約、(5) forward-safe rollback の 5 系統を確定する。Phase 4-13 の入力となる設計図を提供する。

## 設計

### 1. hourly workflow 改修フロー

```
.github/workflows/cf-audit-log-monitor.yml
└─ jobs.monitor
    ├─ env:                                           ← production env block で vars.CF_AUDIT_CLASSIFIER 参照
    │     CF_AUDIT_CLASSIFIER: ${{ vars.CF_AUDIT_CLASSIFIER }}
    │     ML_MODEL_PATH: ${{ secrets.CF_AUDIT_ML_MODEL_PATH_PROD }}
    ├─ steps:
    │   1. checkout
    │   2. mise + pnpm install
    │   3. analyze.ts (hourly run)                    ← 既存
    │   4. post-step: secret-leakage-grep.ts --exit-on-detect    ← 新規挿入（hourly fail 化）
    │   5. post-step: fallback-rate-alert.ts --threshold 0.05 --consecutive-hours 3 ← 新規挿入（Issue 起票のみ）
    │   6. post-step: actions/upload-artifact@v4      ← 新規挿入（retention-days: 8）
    │      with:
    │        name: hourly-snapshot-${{ github.run_id }}
    │        path: outputs/cf-audit-log/hourly/*.json
    │        retention-days: 8
```

### 2. 7day summary workflow

```
.github/workflows/cf-audit-log-7day-summary.yml（新規）
on:
  schedule:
    - cron: '0 1 */7 * *'   # UTC 7 日 1 回
  workflow_dispatch:
jobs:
  summarize:
    runs-on: ubuntu-latest
    steps:
      1. checkout
      2. mise + pnpm install
      3. gh api cross-run artifact zip download (hourly-snapshot-*, last 7 days)
      4. mise exec -- pnpm tsx scripts/cf-audit-log/observation/post-switch-monitor.ts \
           --aggregate --input <download-dir> \
           --out outputs/phase-11/evidence/hourly-run-7day-summary.json
      5. generate outputs/phase-11/evidence/hourly-run-7day.md
         （run URL 一覧 + 集計サマリ + leakage grep 7 日連続 clean 確認）
      6. peter-evans/create-pull-request@v6
         branch: chore/issue-586-7day-evidence-${YYYYMMDD}
         base: dev
         title: "chore(cf-audit-log): 7-day evidence (Refs #549, Refs #586)"
```

> 直 push は `dev` / `main` どちらも禁止のため必ず PR 起票。

### 3. aggregation 出力 schema（`hourly-run-7day-summary.json`）

```typescript
type SevenDaySummary = {
  windowHours: 168;
  expectedSnapshots: 168;
  actualSnapshots: number;        // < 168 の場合 pass_runtime_synced 昇格不可
  fallbackRateMean: number;       // ≤ 0.05 が許容
  fallbackRateMax: number;
  issuesOpenedTotal: number;      // baseline 比較対象
  p95LatencyMedianMs: number;
  leakageHits: number;            // 0 が許容
  thresholdSnapshots: number;     // classifier_used = 'threshold' の hourly 数
  mlSnapshots: number;            // classifier_used = 'ml' の hourly 数
  generatedAt: string;            // ISO 8601
  windowStart: string;
  windowEnd: string;
  parentIssueRef: 549;
  selfIssueRef: 586;
};
```

### 4. SSOT 4 ファイル昇格契約

| 同期先 | 追記内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | `pass_runtime_synced` 状態定義 + canonical evidence path（`outputs/phase-11/evidence/hourly-run-7day-summary.json` 等）+ 4 観測軸の閾値 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 親 #549 entry の `state` を `implemented-local` → `pass_runtime_synced`（D+7 close-out コミットで実反映）|
| `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-13.md` | legacy stub `## Canonical Status` 配下の「`spec_created`; do not treat as completed evidence.」を「`pass_runtime_synced`; close-out evidence at outputs/phase-11/evidence/hourly-run-7day-summary.json」に書き換え |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | post-switch 7 日観測手順 + evidence canonical path + `pass_runtime_synced` 昇格ステップを追記 |

### 5. forward-safe rollback 設計

| 障害 | 検知 | 対処 step |
| --- | --- | --- |
| ml 切替後の誤検知率上昇 | hourly run の Issue 起票数 baseline 1.5 倍超 | `gh variable set CF_AUDIT_CLASSIFIER --env production --body "threshold"` 1 行 + 任意で hourly post-step を `if: false` 化する revert PR |
| fallback rate alert 連続発火 | `fallback-rate-alert.ts` が Issue 起票（自動）| 同上の env 戻し |
| leakage positive | hourly run fail（`--exit-on-detect`） | 即時 env 戻し + Issue 削除 + token revoke runbook |
| 7day summary job 自体の bug | scheduled run fail | summary workflow を `disabled` に切替 + revert PR。hourly run には影響なし |

D1 schema は触らない（forward-safe）。`apps/api/migrations/` 配下に diff を作らないことが本タスクの不変条件。

## artifacts.json metadata

```json
{
  "designed_at": "phase-03",
  "workflow_files_added": [".github/workflows/cf-audit-log-7day-summary.yml"],
  "workflow_files_edited": [".github/workflows/cf-audit-log-monitor.yml"],
  "ssot_files_edited": 4,
  "rollback_steps": 1,
  "d1_schema_change": false
}
```

## 完了条件

- [ ] hourly workflow 改修の 3 つの post-step 挿入位置と引数を確定
- [ ] 7day summary workflow の cron / workflow_dispatch / download-artifact / aggregation / PR 起票の 6 step を確定
- [ ] aggregation 出力 schema を TypeScript 型で確定（`expectedSnapshots: 168` 必須化を明記）
- [ ] SSOT 4 ファイルの追記 anchor を確定
- [ ] forward-safe rollback 表（4 行）を確定

## 出力

- `outputs/phase-03/main.md`

## 参照資料

- `index.md`
- `phase-02.md`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-03.md`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |
