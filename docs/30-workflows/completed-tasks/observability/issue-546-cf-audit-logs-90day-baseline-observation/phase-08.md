# Phase 8: エラー処理 / 欠測対応

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-546-cf-audit-logs-90day-baseline-observation` |
| Phase | 8 |
| Phase 名 | エラー処理 / 欠測対応 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `spec_created` |

[実装区分: ドキュメントのみ]

## 目的

90 日観測で認証不足、データ欠損、label 不足、run history 上限に遭遇した場合の扱いを固定する。

## 実行タスク

| Task | 内容 | 出力 |
| --- | --- | --- |
| 8-1 | 本 Phase の対象資料と既存実装を確認する | 確認メモ |
| 8-2 | docs-only / NON_VISUAL 境界を維持したまま成果物を更新する | Phase 成果物 |
| 8-3 | 完了条件と後続 Phase への引き渡し条件を確認する | 完了チェック |

## エラー分類

| code | 条件 | 扱い |
| --- | --- | --- |
| `blocked_auth_required` | `gh` / Cloudflare auth が不足 | `PENDING_RUNTIME_EVIDENCE` として停止 |
| `insufficient_window` | 最古 run / D1 event が 90 日未満 | Gate-A FAIL、継続観測 |
| `watchdog_gap_detected` | 2h 超 heartbeat gap または watchdog issue | Gate-A FAIL |
| `manual_classification_required` | cf-audit issue に false-positive/confirmed label がない | Gate-B を `PENDING_RUNTIME_EVIDENCE` として保留 |
| `schema_column_missing` | `classifier_used` がない | classifierCounts.unknown に集約 |

## リカバリ

- 認証不足は user approval 後に再実行する。
- 90 日未満は日付を明記し、再判定予定日を `gate-decision.md` に書く。
- label 不足は issue 一覧を出し、人間の分類待ちとして記録する。自動で label は付けない。
- Gate-B は `alert_issue_count = 0` の場合に FPR 0% として PASS とする。alert が 1 件以上あり label が不足する場合だけ `PENDING_RUNTIME_EVIDENCE` とする。

## 参照資料

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/index.md`
- `.claude/skills/task-specification-creator/references/task-type-decision.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/database-schema-cf-audit-log.md`

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `phase-08.md` | Phase 8 の仕様・検証・引き渡し記録 |

## 統合テスト連携

本タスクは docs-only / NON_VISUAL の runtime observation 仕様であり、新規コード、API、D1 migration を追加しない。コードテストは追加せず、Phase 11 の read-only runtime evidence と Phase 12 の strict 7 files / link / redaction check を検証対象にする。

## 完了条件

- [ ] すべての欠測が上記 code のいずれかで分類されている。
- [ ] Gate を PASS と書けない状態は `PENDING_RUNTIME_EVIDENCE` として扱う。
