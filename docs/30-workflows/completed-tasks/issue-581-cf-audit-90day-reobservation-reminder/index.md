# Issue #581 CF Audit Logs 90 Day Re-observation Reminder

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | `issue-581-cf-audit-90day-reobservation-reminder` |
| Issue | #581（CLOSED 維持） |
| 親 Issue | #546 → #515 |
| 状態 | `spec_created` |
| workflow_state | `spec_created` |
| runtime decision state | `observation_continue` |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |
| 実装区分 | ドキュメント / 正本仕様同期のみ |
| created_date | 2026-05-09 |
| earliest_execution_date | 2026-08-05 以降、または `cf-audit-log-monitor.yml` の最初の successful hourly run から 90 日後のいずれか遅い方 |
| closed issue handling | Issue #581 / #546 は CLOSED のまま維持。PR / commit message は `Refs #581` `Refs #546` のみを使う |

## 実装区分判定根拠（CONST_004）

本タスクの目的は **既存 GitHub Actions / D1 / Issue evidence の read-only 集計と Gate 再判定** であり、目的達成にアプリコード変更を要さない。今回の仕様作成 cycle では、task-specification-creator / aiworkflow-requirements 準拠のために workflow 仕様書、artifact 台帳、aiworkflow-requirements 正本索引を同一 wave で更新する。

- 変更対象なし: コード（`apps/*`, `packages/*`, `scripts/*`）、workflow YAML、D1 schema / migration、Cloudflare Secrets は変更しない。
- 変更対象あり: 本 workflow 仕様書、`artifacts.json`、`outputs/phase-12/*`、aiworkflow-requirements の references / indexes / changelog / LOGS。
- runtime 実行時成果物は `outputs/phase-11/*.json|md` と `outputs/phase-12/*.md`。
- 「動作を変える」「機能を追加する」「修正する」要素は無く、純粋な運用観測である。

よって CONST_004 例外条件「純粋にドキュメント・調査・合意形成で完結」に合致し、`docs-only` として作成する。ただし正本仕様への反映は Phase 13 後へ延期せず、仕様作成 cycle 内で実ファイルに反映する。

## 目的

Issue #546 の 2026-05-08 観測サイクルで `Gate-A FAIL / Gate-B PENDING / Gate-C PENDING / observation_continue` となった結果を、十分な runtime evidence が蓄積したタイミングで再判定し、`threshold_continue` / `baseline_recalibration` / `ml_comparison_ready` / `observation_continue` のいずれかを fresh evidence ベースで決定する。

## Gate 定義（Issue #546 と整合）

| Gate | 判定 | 入力 | 出力 |
| --- | --- | --- | --- |
| Gate-A 90 day continuity | 90 日連続 successful hourly run / watchdog gap なしなら PASS | `gh api --paginate` による monitor / watchdog run history | `outputs/phase-11/gh-run-list-cf-audit-log-monitor.json` `gh-run-list-watchdog.json` |
| Gate-B FPR <= 5% | false positive rate ≤ 5% なら PASS | alert Issue evidence + D1 aggregate + baseline thresholds | `outputs/phase-11/gh-issues-cf-audit.json` `d1-cf-audit-90day-summary.json` `baseline-90day-thresholds.json` |
| Gate-C tuning cost ≥ 4h/month | owner-authored monthly tuning minutes ≥ 240 なら PASS | tuning cost log / Issue evidence | `outputs/phase-11/tuning-cost-summary.md` `tuning-cost-issues.json` |

## 不変条件

1. Issue #581 / #546 を reopen / close 操作しない。
2. `cf-audit-log-monitor.yml` / watchdog YAML、D1 schema、Cloudflare Secrets、production migration を変更しない。
3. D1 アクセスは `bash scripts/cf.sh d1 execute ... --remote --json` の **read-only `SELECT` のみ**。
4. GitHub Actions の 90 日 hourly run は `gh run list --limit 500` 上限を超えるため、必ず `gh api --paginate ... | jq -s '.'` で **JSON array** として保存する（JSON Lines 不可）。
5. D1 unreadiness（`no such table: cf_audit_log` など）の状態で alert 0 件を **`Gate-B PASS` と判定しない**。`PENDING_RUNTIME_EVIDENCE` marker で固定する。
6. `branch_protection` / Cloudflare deploy / workflow dispatch を一切実行しない。
7. CONST_002: commit / push / PR はユーザー明示承認後のみ。

## スコープ

### 含む
- monitor / watchdog の 90 日 hourly window の successful run / failure / gap 集計
- D1 `cf_audit_log` / `cf_audit_baseline` の read-only 集計と baseline thresholds 取得
- `cf-audit` ラベル issue と false-positive ラベル照合
- monthly tuning minutes の owner-authored evidence 確認
- Gate-A/B/C 再判定と正本（`task-workflow-active` / aiworkflow-requirements）への同期記録

### 含まない
- production D1 migration apply、Cloudflare secret 登録、workflow dispatch
- Issue reopen/close、commit / push / PR
- ML model training、production ML switch 本体
- `cf_audit_log` テーブル不在の修正本体（別タスクへ委譲）
- monitor が現在 failure 状態である根本原因の修正（別タスクへ委譲）

## 開始前提条件（DoD 入口）

| 条件 | 検証方法 |
| --- | --- |
| 現在日付 ≥ 2026-08-05 | `date -u +%F` |
| `cf-audit-log-monitor.yml` の 90 日観測窓が評価可能 | `gh api --paginate` で取得した history を Gate-A 入力にする。90 日連続 successful run が不成立でも Phase 11 で Gate-A FAIL として記録する |
| D1 `cf_audit_log` テーブルが存在する **または** `PENDING_RUNTIME_EVIDENCE` を Gate-B 判定として明示する用意がある | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --remote --json --command "SELECT name FROM sqlite_master WHERE type='table' AND name='cf_audit_log';"` |

> **注**: 2026-05-09 時点では上記前提を満たさない（最新 monitor run はすべて failure、D1 `cf_audit_log` 不在）。本仕様書は「前提充足後に実行する手順書」として作成し、Phase 1 の前提条件チェックで未充足なら `observation_continue` のまま再延期する。

## Phase 構成

| Phase | 名称 | 出力 |
| --- | --- | --- |
| 1 | 要件定義 / 実装区分判定 | `phase-01.md` |
| 2 | 設計：Gate 入力境界と evidence schema | `phase-02.md` |
| 3 | 計画：read-only コマンド実行手順 | `phase-03.md` |
| 4 | テスト戦略（read-only verification） | `phase-04.md` |
| 5 | 実行準備（前提条件 gate） | `phase-05.md` |
| 6 | evidence 取得（Gate-A） | `phase-06.md` |
| 7 | evidence 取得（Gate-B/C） | `phase-07.md` |
| 8 | リファクタ N/A 判定 | `phase-08.md` |
| 9 | 品質保証（schema / redaction） | `phase-09.md` |
| 10 | 最終レビュー | `phase-10.md` |
| 11 | NON_VISUAL evidence + Gate 判定 | `phase-11.md` + `outputs/phase-11/*` |
| 12 | 正本同期 / 未タスク検出 | `phase-12.md` + `outputs/phase-12/*` |
| 13 | user approval / closed issue handling | `phase-13.md` |

## 仕様作成 cycle の同期状態（2026-05-09）

本 workflow は 2026-08-05 以後の runtime 再観測手順書であり、Phase 11 の runtime evidence は未実行である。一方、仕様作成としての準拠成果物は以下を同一 wave で実体化済み:

- `artifacts.json` と `outputs/artifacts.json`
- `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-546-cf-audit-logs-90day-baseline-observation-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-546-cf-audit-logs-90day-baseline-observation-2026-05.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`

## 参照ドキュメント

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/`
- `docs/30-workflows/unassigned-task/issue-546-cf-audit-logs-90day-reobservation-reminder-001.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-546-cf-audit-logs-90day-baseline-observation-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-546-cf-audit-logs-90day-baseline-observation-2026-05.md`
- `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md`
