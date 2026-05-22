# Phase 6: 失敗ケース

<!-- validator-required skeleton -->

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| 機能名 | issue-526-ci-actionlint-shellcheck-gate |
| 作成日 | 2026-05-08 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | CI workflow / shell lint gate |
| status | completed |

## 目的

失敗ケースとして、Issue #526 の actionlint / shellcheck gate を実装済みローカル状態に同期する。

## 実行タスク

- [x] Phase 6 の責務を確認する。
- [x] `.github/workflows/ci.yml` 所有の lint gate と `post-release-observation-reminder.yml` lint 対象境界を維持する。
- [x] Phase 6 の成果物と完了条件を記録する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Index | `index.md` | タスク全体の正本 |
| Artifacts | `artifacts.json` | Phase status / references |
| Previous Phase | `phase-05.md` | 依存 Phase |
| CI workflow | `.github/workflows/ci.yml` | workflow-shell-lint 実装 |
| Reminder workflow | `.github/workflows/post-release-observation-reminder.yml` | actionlint 対象 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 6 specification | `phase-06.md` | 失敗ケースの記録 |

## 完了条件

- [x] 必須見出しが存在する。
- [x] CI lint gate の所有 workflow が `.github/workflows/ci.yml` に固定されている。
- [x] closed Issue #526 は reopen / close しない。

## 依存 Phase 明示

Phase 5

## 統合テスト連携

本タスクは CI workflow と shell lint gate の NON_VISUAL 実装であり、UI や D1 runtime を伴う統合テストは対象外。統合相当の確認は `pnpm observation:lint`、actionlint、shellcheck、shell unit、artifacts parity で代替する。

## Phase実行記録
`[実装区分: 実装仕様書]`

## 失敗ケース表

| ID | 失敗 | 検出 | 対策 |
| --- | --- | --- | --- |
| F-1 | YAML syntax broken | actionlint / YAML parse | workflow YAML を修正。 |
| F-2 | GitHub Actions context 誤用 | actionlint | `${{ }}` の対象 context を修正。 |
| F-3 | shell quoting bug | shellcheck | 対象行を修正し、disable 時は理由コメントを同じ行に残す。 |
| F-4 | bash syntax broken | `bash -n` | shell script を修正。 |
| F-5 | CI が既存 shell 全体 warning で失敗 | path grep | shellcheck 対象を `scripts/observation/*.sh` に戻す。 |
| F-6 | actionlint download failure | CI log | infrastructure failure として retry。fallback PASS 禁止。 |
| F-7 | schedule runtime が lint failure で止まる | workflow graph | `remind` job に `needs: lint` を付けない。 |
| F-8 | 想定外 secret literal が workflow に混入 | secret allowlist grep | `secrets.GITHUB_TOKEN` 以外の `secrets.*` literal を除去する。 |

## 回帰防止

- `grep -n "needs: lint" .github/workflows/post-release-observation-reminder.yml` が hit しないことを確認する。
- `rg -n "shellcheck scripts/observation/\\*.sh" .github/workflows/ci.yml .github/workflows/post-release-observation-reminder.yml` が hit することを確認する。
- `rg -n "actionlint.*post-release-observation-reminder.yml|post-release-observation-reminder.yml" .github/workflows/ci.yml .github/workflows/post-release-observation-reminder.yml` が hit することを確認する。

## DoD

- F-1 から F-8 の検出方法が Phase 9 に反映されている。
- F-7 の runtime 境界が Phase 2 の設計決定と一致している。
