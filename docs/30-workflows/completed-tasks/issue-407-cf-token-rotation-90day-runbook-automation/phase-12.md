# Phase 12: ドキュメント更新 — issue-407-cf-token-rotation-90day-runbook-automation

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-407-cf-token-rotation-90day-runbook-automation |
| phase | 12 / 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態語彙 | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |

## 目的

Phase 5 で実体化した runbook / log / workflow / 検証スクリプトを、aiworkflow-requirements 正本と task-specification-creator の Phase 12 strict outputs に同期する。

## 必須 6 タスク

| Task | 成果物 | 判定 |
| --- | --- | --- |
| Task 1 実装ガイド | `outputs/phase-12/implementation-guide.md` | PASS |
| Task 2 システム仕様更新 | `outputs/phase-12/system-spec-update-summary.md` | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| Task 3 更新履歴 | `outputs/phase-12/documentation-changelog.md` | PASS |
| Task 4 未タスク検出 | `outputs/phase-12/unassigned-task-detection.md` | PASS |
| Task 5 skill feedback | `outputs/phase-12/skill-feedback-report.md` | PASS |
| Task 6 compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` | PASS |

## Step 2 判定

新規 API endpoint / TypeScript interface / D1 schema は追加しない。ただし GitHub Actions workflow と operations runbook は運用正本になるため、`deployment-secrets-management.md`、`quick-reference.md`、`resource-map.md`、`task-workflow-active.md` へ same-wave sync する。

## outputs/artifacts parity

`outputs/artifacts.json` は root `artifacts.json` と同期済みである。Phase 1-12 は completed / completed boundary、Phase 13 は `blocked_until_user_approval` とし、runtime production rotation は user-gated として分離する。

## 実行タスク

- [x] Phase 12 strict 7 files を作成し、Phase 11 evidence 参照を `implementation-guide.md` に反映する
- [x] aiworkflow-requirements の正本仕様、SKILL 履歴、generated indexes を same-wave sync する
- [x] unassigned source task を `consumed_by_issue_407` として更新する
- [x] root / outputs `artifacts.json` parity を同期する

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## 成果物/実行手順

1. `outputs/phase-12/implementation-guide.md` に中学生向け説明、技術者向け実装一覧、Phase 11 evidence 参照を書く。
2. `outputs/phase-12/system-spec-update-summary.md` に same-wave sync 対象を列挙する。
3. `outputs/phase-12/phase12-task-spec-compliance-check.md` に Phase 11 boundary と artifacts parity を記録する。
4. `pnpm indexes:rebuild` で `topic-map.md` / `keywords.json` を再生成する。

## 完了条件

- [x] Phase 12 strict 7 files が存在する
- [x] aiworkflow-requirements 正本索引が same-wave sync されている
- [x] 実 production rotation は runtime pending として明示されている
- [x] commit / push / PR は実行していない
