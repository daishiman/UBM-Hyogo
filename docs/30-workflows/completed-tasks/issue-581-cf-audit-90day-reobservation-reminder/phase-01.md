# Phase 1: 要件定義 / 実装区分判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-581-cf-audit-90day-reobservation-reminder` |
| Phase | 1 |
| Phase 名 | 要件定義 / 実装区分判定 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `spec_created` |

[実装区分: ドキュメントのみ]

## 目的

Issue #581 reminder の目的・スコープ・実装区分を確定し、コード変更なしで Gate-A/B/C を再判定できる根拠を固定する。

## 実行タスク

| Task | 内容 | 出力 |
| --- | --- | --- |
| 1-1 | Issue #581 / #546 / #515 の本文と Phase 11/12 evidence を read-only で参照する | 要件メモ |
| 1-2 | CONST_004 に基づき実装区分を判定する | docs-only 判定 |
| 1-3 | 開始前提条件（日付・successful run・D1 readiness）の充足を確認する | 前提条件チェックリスト |
| 1-4 | 前提未充足時の取り扱い（`observation_continue` 再延期）を決定する | 早期終了パス定義 |

## 確定要件

- Issue #581 / #546 は CLOSED のまま維持する。
- 観測対象は `cf-audit-log-monitor.yml` / watchdog の 90 日 hourly run、D1 `cf_audit_log` / `cf_audit_baseline`、`cf-audit` ラベル issue、tuning minutes log。
- 成果物は runtime evidence、Gate 判定、正本同期サマリのみ。コード・YAML・schema・secrets は変更しない。
- 実行者は read-only コマンドのみを使用する。

## 入力・出力・副作用

| 種別 | 内容 |
| --- | --- |
| 入力 | GitHub Actions run history、cf-audit labels/issues、D1 read-only query result、tuning cost log |
| 出力 | `outputs/phase-11/*`, `outputs/phase-12/*` |
| 副作用 | なし。Issue reopen、workflow dispatch、D1 mutation、commit、push は user approval なしで禁止 |

## 早期終了パス

開始前提条件のいずれかが未充足の場合、Phase 1 で以下を記録して `observation_continue` のまま終了する:

1. `outputs/phase-11/precondition-check.md` に未充足項目と次回再評価日を記録
2. `outputs/phase-12/system-spec-update-summary.md` に「再延期」を記録
3. Phase 2 以降は実行しない

## 完了条件

- [ ] `index.md` に docs-only 判定根拠が記載されている
- [ ] Gate-A/B/C 定義が `index.md` と本 Phase で一致する
- [ ] 前提条件チェック手順が定義されている
- [ ] 早期終了パスが定義されている

## 参照資料

- `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase1.md`
- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/phase-01.md`
