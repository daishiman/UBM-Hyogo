# Phase 4: テスト設計

<!-- validator-required skeleton -->

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| 機能名 | issue-526-ci-actionlint-shellcheck-gate |
| 作成日 | 2026-05-08 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | CI workflow / shell lint gate |
| status | completed |

## 目的

テスト設計として、Issue #526 の actionlint / shellcheck gate を実装済みローカル状態に同期する。

## 実行タスク

- [x] Phase 4 の責務を確認する。
- [x] `.github/workflows/ci.yml` 所有の lint gate と `post-release-observation-reminder.yml` lint 対象境界を維持する。
- [x] Phase 4 の成果物と完了条件を記録する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Index | `index.md` | タスク全体の正本 |
| Artifacts | `artifacts.json` | Phase status / references |
| Previous Phase | `phase-03.md` | 依存 Phase |
| CI workflow | `.github/workflows/ci.yml` | workflow-shell-lint 実装 |
| Reminder workflow | `.github/workflows/post-release-observation-reminder.yml` | actionlint 対象 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 4 specification | `phase-04.md` | テスト設計の記録 |

## 完了条件

- [x] 必須見出しが存在する。
- [x] CI lint gate の所有 workflow が `.github/workflows/ci.yml` に固定されている。
- [x] closed Issue #526 は reopen / close しない。

## 依存 Phase 明示

Phase 1 / Phase 2 / Phase 3

## 統合テスト連携

本タスクは CI workflow と shell lint gate の NON_VISUAL 実装であり、UI や D1 runtime を伴う統合テストは対象外。統合相当の確認は `pnpm observation:lint`、actionlint、shellcheck、shell unit、artifacts parity で代替する。

## Phase実行記録
`[実装区分: 実装仕様書]`

## テストマトリクス

| ID | テスト | コマンド / 確認 | 期待値 |
| --- | --- | --- | --- |
| T-1 | YAML syntax | `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/post-release-observation-reminder.yml")'` | exit 0 |
| T-2 | bash syntax | `bash -n scripts/observation/create-reminder-issue.sh` | exit 0 |
| T-3 | shell unit | `bash scripts/observation/test/test-create-reminder-issue.sh` | exit 0 |
| T-4 | shellcheck | `shellcheck scripts/observation/*.sh` | exit 0 |
| T-5 | actionlint | `actionlint .github/workflows/post-release-observation-reminder.yml` | exit 0 |
| T-6 | secret allowlist grep | `grep -RInE 'secrets\.[A-Z0-9_]+' .github/workflows/post-release-observation-reminder.yml \| grep -v 'secrets.GITHUB_TOKEN'` が出力 0 行 | exit 0 |
| T-7 | CI run | `gh run list --workflow=ci.yml --limit 1` または採用 workflow | latest run success |
| T-8 | path / job gate | PR changing target files triggers lint job | GitHub Actions UI / `gh run view --log` |

## テストファイル

新規テストファイルは原則追加しない。既存 `scripts/observation/test/test-create-reminder-issue.sh` を継続使用する。

shellcheck 対象は初回 gate では `scripts/observation/*.sh` に限定する。`scripts/observation/test/*.sh` は現状 SC2016 が出るため、同時に対象化する場合のみテスト script 側の warning 修正を本実装に含める。デフォルトでは対象化しない。

## 失敗時の扱い

- T-4 が既存 warning で失敗した場合、`scripts/observation/*.sh` の範囲で修正する。
- T-5 が expression / context 警告を出す場合、workflow YAML の該当箇所を修正する。
- T-7 は runtime evidence のため、ローカル実装 cycle では `PENDING_RUNTIME_EVIDENCE` として Phase 11 に残してよい。

## DoD

- T-1 から T-8 が Phase 9 / 11 に再掲されている。
- 新規テスト追加が不要な理由が明記されている。
- shellcheck warning 修正の範囲が `scripts/observation/*.sh` に限定されている。
