# Implementation Guide: Issue #546 Cloudflare Audit Logs 90 Day Observation

## Part 1: 中学生レベルの説明

なぜ必要かを先に説明します。毎日学校の見回り記録をつけていても、たまたま一日だけ静かだったのか、本当に問題が少ないのかは、長い期間を見ないと分かりません。90 日分を見るのは、短い期間の偶然で判断しないためです。何をするかというと、3 か月分の記録を集めて、注意の出し方を続けるか調整するかを決めます。

たとえば図書館で本の返し忘れを調べるとき、今日だけの記録では「いつも忘れ物が多い本棚」は分かりません。3 か月分の貸し出し表を並べると、どの棚で問題が起きやすいか、注意の出し方が強すぎるかが見えてきます。このタスクも同じで、Cloudflare の記録を長めに集め、今の注意の出し方を続けるか、調整するかを決めます。

### 今回作ったもの

| 作ったもの | やさしい説明 |
| --- | --- |
| Phase 1〜10 の記録 | 計画、調査、確認を順番に終えた控え |
| Phase 11 の記録 | 実際に取れた運用記録。今回は 90 日分に足りず、失敗が続いていることが分かった |
| Gate-A/B/C の判定表 | 今は「観測を続ける」と決める表 |
| Phase 12 の確認ファイル | 必要な説明と正本同期がそろったことを示す控え |

### 2026-05-08 の結論

| 見たもの | 結果 |
| --- | --- |
| Gate-A | 失敗。記録は 2026-05-06 から 2026-05-07 までの 32 件だけで、すべて失敗だった |
| Gate-B | 保留。D1 の表 `cf_audit_log` が production 側で見つからなかった |
| Gate-C | 保留。月ごとの調整時間ログがまだない |

結論は `observation_continue`。つまり、今は機械学習へ進めず、まず監視が安定して90日分たまるまで観測を続ける。

### 専門用語セルフチェック

| 用語 | 日常語の言い換え |
| --- | --- |
| runtime evidence | 実際に動かした証拠 |
| Gate | 次へ進むか決める関門 |
| false positive | 本当は問題ではないのに問題と言ってしまうこと |
| D1 | 記録をしまう表のような場所 |
| workflow | 決まった時間に動く作業手順 |

## Part 2: 技術者レベルの説明

### TypeScript 型定義

```ts
type GateResult = "PASS" | "FAIL" | "PENDING";

interface GateDecision {
  gateA: GateResult;
  gateB: GateResult;
  gateC: GateResult;
  decision:
    | "threshold_continue"
    | "baseline_recalibration"
    | "ml_comparison_ready"
    | "observation_continue";
}

interface AuditObservationSummary {
  windowDays: 90;
  totalEvents: number;
  alertIssueCount: number;
  falsePositiveCount: number;
  monthlyTuningMinutes: number;
}
```

### CLIシグネチャ

```bash
gh api --paginate repos/daishiman/UBM-Hyogo/actions/workflows/cf-audit-log-monitor.yml/runs
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --remote --json --command "<SELECT only>"
```

### 使用例

```bash
gh api --paginate \
  repos/daishiman/UBM-Hyogo/actions/workflows/cf-audit-log-monitor.yml/runs \
  --jq '.workflow_runs[] | {databaseId:.id,status,conclusion,createdAt:.created_at,updatedAt:.updated_at,headSha:.head_sha,event,url:.html_url}' \
  | jq -s '.' \
  > docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-11/gh-run-list-cf-audit-log-monitor.json
```

### エラーハンドリング

| Error | Handling |
| --- | --- |
| `blocked_auth_required` | Stop and record `PENDING_RUNTIME_EVIDENCE`. |
| `insufficient_window` | Gate-A FAIL and continue observation. |
| `manual_classification_required` | Gate-B stays `PENDING_RUNTIME_EVIDENCE`. |
| `schema_column_missing` | Aggregate classifier as `unknown`; do not patch code in this task. |
| `runtime_schema_missing` | Gate-B stays pending when production D1 returns `no such table: cf_audit_log`. |
| `local_toolchain_mismatch` | Record baseline helper failure separately; do not patch code in this docs-only observation task. |

### エッジケース

| Case | Rule |
| --- | --- |
| `alert_issue_count = 0` | Gate-B can PASS because FPR is 0% only when D1/runtime readiness is not blocked. |
| GitHub run count exceeds 500 | Use `gh api --paginate`; `gh run list --limit 500` is not acceptable for Gate-A. |
| Runtime evidence unavailable | Keep docs-only spec state and record `PENDING_RUNTIME_EVIDENCE`. |
| 90 day window unavailable | Gate-A FAIL and decision stays `observation_continue`. |

### 設定項目と定数一覧

| Name | Value |
| --- | --- |
| Observation window | 90 days |
| Gate-A heartbeat gap | 2 hours |
| Gate-B FPR threshold | 5% |
| Gate-C tuning cost threshold | 240 minutes per month |
| Issue reference | `Refs #546` only |

### テスト構成

| Check | Command |
| --- | --- |
| Workflow structure | `node .claude/skills/task-specification-creator/scripts/verify-all-specs.js --workflow docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation --json` |
| Phase outputs | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation` |
| Guide shape | `node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation` |
