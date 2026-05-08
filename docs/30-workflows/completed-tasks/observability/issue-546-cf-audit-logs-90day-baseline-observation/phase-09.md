# Phase 9: 検証計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-546-cf-audit-logs-90day-baseline-observation` |
| Phase | 9 |
| Phase 名 | 検証計画 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `spec_created` |

[実装区分: ドキュメントのみ]

## 目的

仕様書と runtime evidence の検証方法を固定する。

## 実行タスク

| Task | 内容 | 出力 |
| --- | --- | --- |
| 9-1 | 本 Phase の対象資料と既存実装を確認する | 確認メモ |
| 9-2 | docs-only / NON_VISUAL 境界を維持したまま成果物を更新する | Phase 成果物 |
| 9-3 | 完了条件と後続 Phase への引き渡し条件を確認する | 完了チェック |

## 検証項目

| 項目 | コマンド / 方法 | 期待値 |
| --- | --- | --- |
| 13 Phase 存在 | `ls docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/phase-*.md | wc -l` | `13` |
| docs-only 根拠 | `rg -n "実装区分: ドキュメントのみ|判定根拠" docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation` | index と各 Phase に存在 |
| read-only 境界 | `rg -n "INSERT|UPDATE|DELETE|ALTER" docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation` | 禁止事項または説明文のみ |
| closed issue | `gh issue view 546 --json state` | `CLOSED` |
| workflow path | `test -f .github/workflows/cf-audit-log-monitor.yml` | exit 0 |

## テスト方針

コードテストは追加しない。対象はドキュメント構造、コマンドの read-only 性、runtime evidence の redaction 確認である。

## 参照資料

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/index.md`
- `.claude/skills/task-specification-creator/references/task-type-decision.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/database-schema-cf-audit-log.md`

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `phase-09.md` | Phase 9 の仕様・検証・引き渡し記録 |

## 統合テスト連携

本タスクは docs-only / NON_VISUAL の runtime observation 仕様であり、新規コード、API、D1 migration を追加しない。コードテストは追加せず、Phase 11 の read-only runtime evidence と Phase 12 の strict 7 files / link / redaction check を検証対象にする。

## 完了条件

- [ ] 13 Phase が存在する。
- [ ] `Refs #546` ルールが Phase 13 にある。
- [ ] runtime evidence の PASS/FAIL 判定が Gate-A/B/C に基づく。
