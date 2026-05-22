# Phase 1: 要件定義 / 実装区分判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-546-cf-audit-logs-90day-baseline-observation` |
| Phase | 1 |
| Phase 名 | 要件定義 / 実装区分判定 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `spec_created` |

[実装区分: ドキュメントのみ]

## 目的

Issue #546 の目的と実装区分を確定し、90 日 baseline runtime 観測をコード変更なしで達成できる根拠を固定する。

## 実行タスク

| Task | 内容 | 出力 |
| --- | --- | --- |
| 1-1 | Issue #546 の本文、親 Issue #515、親 spec を読む | 要件メモ |
| 1-2 | CONST_004 に基づき実装区分を判定する | docs-only 判定 |
| 1-3 | Gate-A/B/C と scope in/out を確定する | Gate 表 |

## 確定要件

- Issue #546 は CLOSED のまま維持する。
- 観測対象は `cf-audit-log-monitor.yml` の 90 日 hourly run と D1 `cf_audit_log` / `cf_audit_baseline`。
- 成果物は runtime evidence、Gate 判定、正本同期サマリであり、コード変更は行わない。
- 後続実行者は read-only コマンドのみ実行する。

## 入力・出力・副作用

| 種別 | 内容 |
| --- | --- |
| 入力 | GitHub Actions run history、cf-audit labels/issues、D1 read-only query result |
| 出力 | `outputs/phase-11/*`, `outputs/phase-12/*` |
| 副作用 | なし。Issue reopen、workflow dispatch、D1 mutation、commit、push は user approval なしで禁止 |

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `phase-01.md` | Phase 1 の仕様・検証・引き渡し記録 |

## 統合テスト連携

本タスクは docs-only / NON_VISUAL の runtime observation 仕様であり、新規コード、API、D1 migration を追加しない。コードテストは追加せず、Phase 11 の read-only runtime evidence と Phase 12 の strict 7 files / link / redaction check を検証対象にする。

## 完了条件

- [ ] `index.md` に docs-only 判定根拠がある。
- [ ] Gate-A/B/C の定義が `index.md` と本 Phase で一致する。
- [ ] 実装不要の根拠が「既存コードで観測可能」として明示されている。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/index.md`
- `docs/30-workflows/completed-tasks/issue-515-90day-baseline-observation.md`
- `.claude/skills/task-specification-creator/references/task-type-decision.md`
