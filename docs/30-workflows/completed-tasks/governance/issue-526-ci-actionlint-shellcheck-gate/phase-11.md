# Phase 11: 手動 / CI 実行確認

<!-- validator-required skeleton -->

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| 機能名 | issue-526-ci-actionlint-shellcheck-gate |
| 作成日 | 2026-05-08 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | CI workflow / shell lint gate |
| status | completed |

## 目的

手動 / CI 実行確認として、Issue #526 の actionlint / shellcheck gate を実装済みローカル状態に同期する。

## 実行タスク

- [x] Phase 11 の責務を確認する。
- [x] `.github/workflows/ci.yml` 所有の lint gate と `post-release-observation-reminder.yml` lint 対象境界を維持する。
- [x] Phase 11 の成果物と完了条件を記録する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Index | `index.md` | タスク全体の正本 |
| Artifacts | `artifacts.json` | Phase status / references |
| Previous Phase | `phase-10.md` | 依存 Phase |
| CI workflow | `.github/workflows/ci.yml` | workflow-shell-lint 実装 |
| Reminder workflow | `.github/workflows/post-release-observation-reminder.yml` | actionlint 対象 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 11 specification | `phase-11.md` | 手動 / CI 実行確認の記録 |

## 完了条件

- [x] 必須見出しが存在する。
- [x] CI lint gate の所有 workflow が `.github/workflows/ci.yml` に固定されている。
- [x] closed Issue #526 は reopen / close しない。

## 依存 Phase 明示

Phase 1 / Phase 2 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10

## 統合テスト連携

本タスクは CI workflow と shell lint gate の NON_VISUAL 実装であり、UI や D1 runtime を伴う統合テストは対象外。統合相当の確認は `pnpm observation:lint`、actionlint、shellcheck、shell unit、artifacts parity で代替する。

## Phase実行記録
`[実装区分: 実装仕様書]`

## NON_VISUAL evidence

本タスクは UI を持たないため、screenshot evidence は不要。代替 evidence は shell / actionlint / GitHub Actions log とする。

## Evidence 保存先

| Evidence | 保存先 |
| --- | --- |
| bash syntax | `outputs/phase-11/evidence/bash-n.log` |
| shell unit | `outputs/phase-11/evidence/observation-test.log` |
| shellcheck | `outputs/phase-11/evidence/shellcheck.log` |
| actionlint | `outputs/phase-11/evidence/actionlint.log` |
| secret allowlist grep | `outputs/phase-11/evidence/secret-allowlist-grep.log` |
| CI run | `outputs/phase-11/evidence/gh-run.log` |

## 実行コマンド

```bash
mkdir -p docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/outputs/phase-11/evidence
bash -n scripts/observation/create-reminder-issue.sh 2>&1 | tee docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/outputs/phase-11/evidence/bash-n.log
bash scripts/observation/test/test-create-reminder-issue.sh 2>&1 | tee docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/outputs/phase-11/evidence/observation-test.log
shellcheck scripts/observation/*.sh scripts/observation/test/*.sh 2>&1 | tee docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/outputs/phase-11/evidence/shellcheck.log
actionlint .github/workflows/post-release-observation-reminder.yml .github/workflows/ci.yml 2>&1 | tee docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/outputs/phase-11/evidence/actionlint.log
unexpected="$(grep -RInE 'secrets\.[A-Z0-9_]+' .github/workflows/post-release-observation-reminder.yml | grep -v 'secrets.GITHUB_TOKEN' || true)"; test -z "$unexpected" 2>&1 | tee docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/outputs/phase-11/evidence/secret-allowlist-grep.log
gh run list --workflow=ci.yml --limit 1 2>&1 | tee docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/outputs/phase-11/evidence/gh-run.log
```

## Runtime 境界

実 PR 作成前の local cycle では GitHub Actions の実 run が存在しない場合がある。その場合は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` とし、local static evidence と runtime CI evidence を混同しない。

## DoD

- local evidence 5 件が保存されている。
- CI run evidence が未取得の場合、pending として明記されている。
- GitHub Issue 作成を含む runtime 副作用を手動で発火していない。
