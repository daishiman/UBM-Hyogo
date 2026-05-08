# Phase 12: 正本同期 / ガイド / compliance

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-546-cf-audit-logs-90day-baseline-observation` |
| Phase | 12 |
| Phase 名 | 正本同期 / ガイド / compliance |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `spec_created` |

[実装区分: ドキュメントのみ]

## 目的

Phase 11 の観測結果を aiworkflow-requirements と関連ドキュメントへ同期する手順を固定する。

## 実行タスク

| Task | 内容 | 出力 |
| --- | --- | --- |
| 12-1 | 本 Phase の対象資料と既存実装を確認する | 確認メモ |
| 12-2 | docs-only / NON_VISUAL 境界を維持したまま成果物を更新する | Phase 成果物 |
| 12-3 | 完了条件と後続 Phase への引き渡し条件を確認する | 完了チェック |

## 必須成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 実施サマリ |
| `outputs/phase-12/implementation-guide.md` | 90 日観測手順ガイド |
| `outputs/phase-12/documentation-changelog.md` | 更新履歴 |
| `outputs/phase-12/unassigned-task-detection.md` | Gate 結果に応じた未タスク。0 件でも作成 |
| `outputs/phase-12/skill-feedback-report.md` | skill feedback。改善なしでも作成 |
| `outputs/phase-12/system-spec-update-summary.md` | 正本同期サマリ |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | CONST_004/005 と Phase 12 strict 7 files compliance |

## 正本同期対象

| 対象 | 同期内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | Gate-A/B/C 結果、threshold 継続/ML comparison 判定 |
| `.claude/skills/aiworkflow-requirements/references/database-schema-cf-audit-log.md` | 90 日観測で参照した read-only query と retention 境界 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Issue #546 workflow state |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow inventory への追加または状態更新 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | cf-audit baseline 観測導線 |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | runtime 観測結果と次アクション |

## 未タスク分岐

- Gate-A FAIL + Issue #546 CLOSED: 再観測日を記録し、Issue #546 workflow を `PENDING_RUNTIME_EVIDENCE` 継続。次回 90 日再観測を失わないため、`docs/30-workflows/unassigned-task/issue-546-cf-audit-logs-90day-reobservation-reminder-001.md` を formalize 済み。
- Gate-B FAIL または Gate-C PASS: ML comparison / baseline recalibration の後続 task を `docs/30-workflows/unassigned-task/` に起票。
- Gate-A/B/C すべて判定不能: auth/runtime evidence pending として未タスクを作らず、blocked reason を記録。

## 参照資料

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/index.md`
- `.claude/skills/task-specification-creator/references/task-type-decision.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/database-schema-cf-audit-log.md`

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-12/` strict 7 files | Phase 12 の仕様・検証・引き渡し記録 |

## 統合テスト連携

本タスクは docs-only / NON_VISUAL の runtime observation 仕様であり、新規コード、API、D1 migration を追加しない。コードテストは追加せず、Phase 11 の read-only runtime evidence と Phase 12 の strict 7 files / link / redaction check を検証対象にする。

## 完了条件

- [x] 7 必須成果物が存在する。
- [x] docs-only 判定が compliance check に記録されている。
- [x] Issue #546 が CLOSED のままであることを記録する。
