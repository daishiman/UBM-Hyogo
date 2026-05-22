# Phase 13: PR / Issue 参照ルール

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-546-cf-audit-logs-90day-baseline-observation` |
| Phase | 13 |
| Phase 名 | PR / Issue 参照ルール |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `spec_created` |

[実装区分: ドキュメントのみ]

## 目的

仕様書作成後の commit / PR / Issue 参照ルールを固定する。ユーザー承認なしに commit、push、PR 作成は行わない。

## 実行タスク

| Task | 内容 | 出力 |
| --- | --- | --- |
| 13-1 | 本 Phase の対象資料と既存実装を確認する | 確認メモ |
| 13-2 | docs-only / NON_VISUAL 境界を維持したまま成果物を更新する | Phase 成果物 |
| 13-3 | 完了条件と後続 Phase への引き渡し条件を確認する | 完了チェック |

## PR ルール

- PR title 例: `docs(issue-546): add cf audit 90day baseline observation spec`
- PR body は `Refs #546` のみ。
- `Closes #546`、`Fixes #546`、`Resolves #546` は禁止。
- Issue #546 は CLOSED のまま維持する。

## 変更サマリに含める内容

| 項目 | 内容 |
| --- | --- |
| 作成ディレクトリ | `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/` |
| 実装区分 | docs-only / NON_VISUAL |
| コード変更 | なし |
| runtime evidence | user approval 後に Phase 11 で取得 |

## 参照資料

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/index.md`
- `.claude/skills/task-specification-creator/references/task-type-decision.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/database-schema-cf-audit-log.md`

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `phase-13.md` | Phase 13 の仕様・検証・引き渡し記録 |

## 統合テスト連携

本タスクは docs-only / NON_VISUAL の runtime observation 仕様であり、新規コード、API、D1 migration を追加しない。コードテストは追加せず、Phase 11 の read-only runtime evidence と Phase 12 の strict 7 files / link / redaction check を検証対象にする。

## 完了条件

- [ ] `git status --short` で本 workflow ディレクトリの追加・変更と、既存の無関係差分を分離して確認する。無関係差分は本タスクの PR 対象に含めない。
- [ ] commit / push / PR はユーザー承認後にのみ実行する。
- [ ] PR 文脈が `Refs #546` に限定されている。
