# Phase 11: NON_VISUAL evidence + Gate 判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-581-cf-audit-90day-reobservation-reminder` |
| Phase | 11 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |

[実装区分: ドキュメントのみ]

## 目的

Phase 6/7 で取得した evidence を集約し、Gate-A/B/C 判定を `gate-decision.md` に記録する。本タスクはコード変更を伴わないため screenshot は不要。`NON_VISUAL` 代替 evidence として JSON / Markdown を採用する。

## strict file list

`outputs/phase-11/` に以下を全件配置する（順不同で 15 ファイル）:

| # | file | 種別 | 取得元 phase |
| --- | --- | --- | --- |
| 1 | `main.md` | NON_VISUAL evidence summary | この Phase |
| 2 | `manual-smoke-log.md` | コマンド実行ログ | Phase 6/7/9 |
| 3 | `link-checklist.md` | link 有効性 | Phase 9 |
| 4 | `redaction-check.md` | leak 0 件記録 | Phase 9 |
| 5 | `precondition-check.md` | P-1〜P-6 判定 | Phase 5 |
| 6 | `gh-run-list-cf-audit-log-monitor.json` | monitor history | Phase 6 |
| 7 | `gh-run-list-watchdog.json` | watchdog lifecycle marker（Issue #518 HOLD で削除済み） | Phase 6 |
| 8 | `gate-a-aggregation.md` | Gate-A 集計 | Phase 6 |
| 9 | `gh-issues-cf-audit.json` | alert issue evidence | Phase 7 |
| 10 | `d1-cf-audit-90day-summary.json` | D1 集計 / PENDING | Phase 7 |
| 11 | `baseline-90day-thresholds.json` | baseline thresholds / PENDING | Phase 7 |
| 12 | `tuning-cost-summary.md` | 月別 minutes table | Phase 7 |
| 13 | `tuning-cost-issues.json` | tuning issue evidence | Phase 7 |
| 14 | `final-review.md` | R-1〜R-7 判定 | Phase 10 |
| 15 | `gate-decision.md` | Gate-A/B/C 最終判定と decision | この Phase |

## P-1 早期終了時の最小 evidence

2026-08-05 より前に実行した場合は runtime 再観測を開始しない。この場合は strict file list 全件ではなく、以下を配置して `OBSERVATION_CONTINUE` とする:

- `precondition-check.md`
- `main.md`
- `manual-smoke-log.md`
- `gate-decision.md`

P-2 以降の runtime 条件が未充足でも、API / D1 / issue evidence が取得可能な場合は strict file list を通常どおり作成し、Gate-A/B/C の FAIL / PENDING として記録する。

## gate-decision.md フォーマット

```markdown
# Gate Decision: Issue #581 (Re-observation of Issue #546)

Status: <`THRESHOLD_CONTINUE` | `BASELINE_RECALIBRATION` | `ML_COMPARISON_READY` | `OBSERVATION_CONTINUE`>

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Gate-A 90 day continuity | <PASS / FAIL> | `gh-run-list-*.json` + `gate-a-aggregation.md` | <要約> |
| Gate-B FPR <= 5% | <PASS / FAIL / PENDING> | `gh-issues-cf-audit.json` + `d1-cf-audit-90day-summary.json` + `baseline-90day-thresholds.json` | <要約> |
| Gate-C tuning cost >= 4h/month | <PASS / FAIL / PENDING> | `tuning-cost-summary.md` + `tuning-cost-issues.json` | <要約> |

Decision: <next state>

Issue handling: Issue #581 / #546 は CLOSED のまま。PR / commit message は `Refs #581` `Refs #546` のみを使う。
```

## decision matrix

| Gate-A | Gate-B | Gate-C | decision |
| --- | --- | --- | --- |
| PASS | PASS | PASS | `ml_comparison_ready` |
| PASS | PASS | FAIL | `threshold_continue`（人手 tuning コスト過大、ML 移行は急がない） |
| PASS | FAIL | * | `baseline_recalibration` |
| PASS | PENDING | * | `observation_continue`（D1 readiness 待ち） |
| FAIL | * | * | `observation_continue` |

## 成果物

`outputs/phase-11/` 配下の strict file list 全件。

## 完了条件

- [ ] 通常 runtime path では strict file list 15 ファイル全件存在
- [ ] P-1 早期終了 path では `precondition-check.md` / `main.md` / `manual-smoke-log.md` / `gate-decision.md` の 4 ファイルのみで PASS とし、runtime strict 15 ファイルを要求しない
- [ ] `gate-decision.md` の Status が decision matrix と整合
- [ ] Issue handling 記述が CLOSED 維持を明記

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`
- `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`
- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/phase-11.md`
