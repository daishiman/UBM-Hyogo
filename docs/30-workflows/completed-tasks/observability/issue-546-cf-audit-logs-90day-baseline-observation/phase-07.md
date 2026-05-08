# Phase 7: セキュリティ / read-only 境界

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-546-cf-audit-logs-90day-baseline-observation` |
| Phase | 7 |
| Phase 名 | セキュリティ / read-only 境界 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `spec_created` |

[実装区分: ドキュメントのみ]

## 目的

runtime 観測中に secret、raw audit event、production state を壊さないための境界を固定する。

## 実行タスク

| Task | 内容 | 出力 |
| --- | --- | --- |
| 7-1 | 本 Phase の対象資料と既存実装を確認する | 確認メモ |
| 7-2 | docs-only / NON_VISUAL 境界を維持したまま成果物を更新する | Phase 成果物 |
| 7-3 | 完了条件と後続 Phase への引き渡し条件を確認する | 完了チェック |

## 禁止事項

- `wrangler d1 execute` で `INSERT` / `UPDATE` / `DELETE` / `ALTER` / migration apply を実行しない。
- `gh workflow run cf-audit-log-monitor.yml` は user approval なしで実行しない。
- Issue #546 を reopen / close / edit しない。
- raw `cf_audit_log.raw_json`、full IP、full user agent、token id、actor email を docs / PR / Issue に貼らない。
- GitHub Secrets / Cloudflare Secrets の値を出力しない。

## 許可される操作

| 操作 | 条件 |
| --- | --- |
| `gh run list` | read-only |
| `gh issue list` | read-only |
| D1 `SELECT COUNT/GROUP BY` | raw_json を SELECT しない |
| docs 更新 | runtime evidence の redacted summary のみ |

## 参照資料

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/index.md`
- `.claude/skills/task-specification-creator/references/task-type-decision.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/database-schema-cf-audit-log.md`

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `phase-07.md` | Phase 7 の仕様・検証・引き渡し記録 |

## 統合テスト連携

本タスクは docs-only / NON_VISUAL の runtime observation 仕様であり、新規コード、API、D1 migration を追加しない。コードテストは追加せず、Phase 11 の read-only runtime evidence と Phase 12 の strict 7 files / link / redaction check を検証対象にする。

## 完了条件

- [ ] 取得 evidence に secret や raw audit JSON がない。
- [ ] D1 query は read-only である。
- [ ] Phase 11 に redaction check 結果を記録する。
