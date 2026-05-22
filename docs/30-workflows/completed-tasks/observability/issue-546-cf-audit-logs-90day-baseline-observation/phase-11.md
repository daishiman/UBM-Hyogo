# Phase 11: runtime evidence 取得

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-546-cf-audit-logs-90day-baseline-observation` |
| Phase | 11 |
| Phase 名 | runtime evidence 取得 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `spec_created` |

[実装区分: ドキュメントのみ]

## 目的

NON_VISUAL runtime evidence を取得し、Gate-A/B/C 判定を行う。

## 実行タスク

| Task | 内容 | 出力 |
| --- | --- | --- |
| 11-1 | 本 Phase の対象資料と既存実装を確認する | 確認メモ |
| 11-2 | docs-only / NON_VISUAL 境界を維持したまま成果物を更新する | Phase 成果物 |
| 11-3 | 完了条件と後続 Phase への引き渡し条件を確認する | 完了チェック |

## Evidence ファイル

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/gh-run-list-cf-audit-log-monitor.json` | monitor run history |
| `outputs/phase-11/gh-run-list-watchdog.json` | watchdog run history |
| `outputs/phase-11/gh-issues-cf-audit.json` | cf-audit issue list |
| `outputs/phase-11/d1-cf-audit-90day-summary.json` | D1 summary |
| `outputs/phase-11/tuning-cost-summary.md` | Gate-C monthly tuning cost summary |
| `outputs/phase-11/redaction-check.md` | raw_json / secret 非混入確認 |
| `outputs/phase-11/gate-decision.md` | Gate-A/B/C 判定 |
| `outputs/phase-11/main.md` | docs-only / NON_VISUAL 縮約サマリ |
| `outputs/phase-11/manual-smoke-log.md` | read-only command execution log |
| `outputs/phase-11/link-checklist.md` | evidence link checklist |

## `gate-decision.md` テンプレート

```markdown
# Gate Decision: Issue #546

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Gate-A 90 day continuity | PASS/FAIL/PENDING | gh-run-list... | |
| Gate-B FPR <= 5% | PASS/FAIL/PENDING | gh-issues... + d1 summary | |
| Gate-C tuning cost >= 4h/month | PASS/FAIL/PENDING | tuning-cost-summary.md | |

Decision: threshold_continue / baseline_recalibration / ml_comparison_ready / observation_continue
Issue handling: Issue #546 remains CLOSED. Use Refs #546 only.
```

Gate-B は alert 0 件でも D1 readiness と baseline threshold evidence が取得済みの場合だけ FPR 0% として PASS にする。D1 unreadiness、baseline 欠測、または alert があるのに confirmed / false-positive label が足りない場合は `PENDING_RUNTIME_EVIDENCE` とし、推測分類で PASS にしない。

## 参照資料

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/index.md`
- `.claude/skills/task-specification-creator/references/task-type-decision.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/database-schema-cf-audit-log.md`

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-11/main.md`, `manual-smoke-log.md`, `link-checklist.md` | Phase 11 の仕様・検証・引き渡し記録 |

## 統合テスト連携

本タスクは docs-only / NON_VISUAL の runtime observation 仕様であり、新規コード、API、D1 migration を追加しない。コードテストは追加せず、Phase 11 の read-only runtime evidence と Phase 12 の strict 7 files / link / redaction check を検証対象にする。

## 完了条件

- [x] Evidence ファイルが実体として存在する。
- [x] PASS と書く場合は fresh runtime evidence path を併記する。本 cycle は Gate-A FAIL / Gate-B-C pending のため runtime PASS は該当なし。
- [x] 90 日未満または補助 evidence 欠測は `PENDING_RUNTIME_EVIDENCE` として記録する。
