# Phase 2: 設計 — Gate 入力境界と evidence schema

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-581-cf-audit-90day-reobservation-reminder` |
| Phase | 2 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |

[実装区分: ドキュメントのみ]

## 目的

Gate-A/B/C の入力境界・evidence schema・読み取り経路を Phase 6/7 に渡せる粒度で固定する。

## evidence schema

### Gate-A: monitor / watchdog run history

| ファイル | 形式 | 必須フィールド |
| --- | --- | --- |
| `outputs/phase-11/gh-run-list-cf-audit-log-monitor.json` | JSON array | `databaseId`, `status`, `conclusion`, `createdAt`, `updatedAt`, `headSha`, `event`, `url` |
| `outputs/phase-11/gh-run-list-watchdog.json` | JSON object | `workflow`, `status`, `source`, `gateAUse` |

判定ロジック:

- 90 日 window: `now - 90 days` 以降の run を対象
- `success_count = sum(conclusion == "success")`
- `failure_count = sum(conclusion == "failure")`
- `gap_2h_count`: 連続する 2 run の `createdAt` 差が 2h を超える件数
- PASS 条件: `success_count >= 90*24*0.99` かつ `gap_2h_count == 0` かつ `failure_count <= 90*24*0.01`
- watchdog は Issue #518 HOLD で workflow 削除済みのため run history array ではなく lifecycle marker object を保存する。Gate-A は monitor run history と lifecycle marker の組み合わせで判定し、存在しない watchdog workflow API を叩かない。

### Gate-B: false positive rate

| ファイル | 形式 | 必須フィールド |
| --- | --- | --- |
| `outputs/phase-11/gh-issues-cf-audit.json` | JSON array | `number`, `title`, `state`, `labels[]`, `createdAt`, `closedAt` |
| `outputs/phase-11/d1-cf-audit-90day-summary.json` | JSON object | `total_events`, `anomaly_events`, `query_at`, `window_start`, `window_end` |
| `outputs/phase-11/baseline-90day-thresholds.json` | JSON object | `mean`, `stddev`, `p95`, `p99`, `recalibrated_at` |

判定ロジック:

- `false_positive = sum(label == "false-positive")` / `total_alerts`
- D1 unreadiness の場合は `PENDING_RUNTIME_EVIDENCE` marker を記録し、PASS と判定しない（CONST 不変条件 5）

### Gate-C: tuning cost

| ファイル | 形式 | 必須フィールド |
| --- | --- | --- |
| `outputs/phase-11/tuning-cost-summary.md` | Markdown | 月別 minutes table |
| `outputs/phase-11/tuning-cost-issues.json` | JSON array | issue / comment ベースの owner-authored entries |

判定ロジック: `monthly_minutes >= 240` で PASS。

## 読み取り経路

| 経路 | 用途 | 認可 |
| --- | --- | --- |
| `gh api --paginate` | GitHub Actions run / issue 取得 | read-only token |
| `bash scripts/cf.sh d1 execute ... --remote --json` | D1 read-only `SELECT` | 1Password 経由 op run で動的注入 |
| `gh issue list` | tuning cost issue evidence | read-only token |

## 不変条件（Phase 2 確定）

- 全 evidence は `outputs/phase-11/` に集約。
- JSON Lines 形式での保存禁止。`jq -s '.'` で必ず JSON array に正規化する。
- D1 mutation / migration apply / Cloudflare deploy / workflow dispatch は仕様書外。

## 完了条件

- [ ] Gate-A/B/C ごとに evidence file 名・形式・必須フィールドが定義されている
- [ ] 判定ロジックが数式として記述されている
- [ ] D1 unreadiness 時の `PENDING_RUNTIME_EVIDENCE` 取り扱いが明記されている

## 参照資料

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/phase-02.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-546-cf-audit-logs-90day-baseline-observation-artifact-inventory.md`
