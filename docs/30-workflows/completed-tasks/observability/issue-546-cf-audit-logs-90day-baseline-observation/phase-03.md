# Phase 3: 観測設計 / Gate 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-546-cf-audit-logs-90day-baseline-observation` |
| Phase | 3 |
| Phase 名 | 観測設計 / Gate 設計 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `spec_created` |

[実装区分: ドキュメントのみ]

## 目的

90 日 runtime observation の設計書として、データソース、Gate 判定、成果物構造を確定する。

## 実行タスク

| Task | 内容 | 出力 |
| --- | --- | --- |
| 3-1 | 本 Phase の対象資料と既存実装を確認する | 確認メモ |
| 3-2 | docs-only / NON_VISUAL 境界を維持したまま成果物を更新する | Phase 成果物 |
| 3-3 | 完了条件と後続 Phase への引き渡し条件を確認する | 完了チェック |

## 設計

### データソース

| データ | 取得方法 | 保存先 |
| --- | --- | --- |
| monitor run history | `gh api --paginate repos/daishiman/UBM-Hyogo/actions/workflows/cf-audit-log-monitor.yml/runs` | `outputs/phase-11/gh-run-list-cf-audit-log-monitor.json` |
| watchdog run history | `gh run list --workflow=cf-audit-log-monitor-watchdog.yml` | `outputs/phase-11/gh-run-list-watchdog.json` |
| cf-audit issues | `gh issue list --label cf-audit --state all` | `outputs/phase-11/gh-issues-cf-audit.json` |
| D1 summary | `wrangler d1 execute ... SELECT ...` | `outputs/phase-11/d1-cf-audit-90day-summary.json` |
| tuning cost | issue / runbook / manual observation log の月別集計 | `outputs/phase-11/tuning-cost-summary.md` |
| Gate decision | 上記を手動集計し記録 | `outputs/phase-11/gate-decision.md` |

### Gate 判定

```text
Gate-A = 90 days continuous hourly monitor runs AND no unresolved watchdog stale issue
Gate-B = alert_issue_count = 0 ? PASS : false_positive_count / alert_issue_count <= 0.05
Gate-C = monthly_tuning_minutes >= 240
```

`gh run list --limit 500` は hourly 90 日の約 2160 run に不足するため使用しない。Gate-A は `gh api --paginate` の取得結果を `jq -s '.'` で JSON 配列化し、90 日 window を切り出して判定する。Gate-B は alert 0 件でも D1 readiness と baseline threshold evidence が取得できた場合だけ FPR 0% として PASS とし、D1 unreadiness / confirmed label 欠測 / baseline 欠測は `PENDING_RUNTIME_EVIDENCE` にする。

### 出力構造

```text
outputs/
  phase-11/
    gh-run-list-cf-audit-log-monitor.json
    gh-run-list-watchdog.json
    gh-issues-cf-audit.json
    d1-cf-audit-90day-summary.json
    tuning-cost-summary.md
    redaction-check.md
    gate-decision.md
    main.md
    manual-smoke-log.md
    link-checklist.md
  phase-12/
    main.md
    implementation-guide.md
    system-spec-update-summary.md
    documentation-changelog.md
    unassigned-task-detection.md
    skill-feedback-report.md
    phase12-task-spec-compliance-check.md
```

## 参照資料

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/index.md`
- `.claude/skills/task-specification-creator/references/task-type-decision.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/database-schema-cf-audit-log.md`

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `phase-03.md` | Phase 3 の仕様・検証・引き渡し記録 |

## 統合テスト連携

本タスクは docs-only / NON_VISUAL の runtime observation 仕様であり、新規コード、API、D1 migration を追加しない。コードテストは追加せず、Phase 11 の read-only runtime evidence と Phase 12 の strict 7 files / link / redaction check を検証対象にする。

## 完了条件

- [ ] Gate-A/B/C の数式が本 Phase に明記されている。
- [ ] 各入力データの取得コマンドと保存先が一意に決まっている。
- [ ] 90 日未満の場合の扱いが「継続観測」で固定されている。
