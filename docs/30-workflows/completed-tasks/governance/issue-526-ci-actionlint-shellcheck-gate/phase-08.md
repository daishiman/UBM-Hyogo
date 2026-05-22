# Phase 8: リファクタリング

<!-- validator-required skeleton -->

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| 機能名 | issue-526-ci-actionlint-shellcheck-gate |
| 作成日 | 2026-05-08 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | CI workflow / shell lint gate |
| status | completed |

## 目的

リファクタリングとして、Issue #526 の actionlint / shellcheck gate を実装済みローカル状態に同期する。

## 実行タスク

- [x] Phase 8 の責務を確認する。
- [x] `.github/workflows/ci.yml` 所有の lint gate と `post-release-observation-reminder.yml` lint 対象境界を維持する。
- [x] Phase 8 の成果物と完了条件を記録する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Index | `index.md` | タスク全体の正本 |
| Artifacts | `artifacts.json` | Phase status / references |
| Previous Phase | `phase-07.md` | 依存 Phase |
| CI workflow | `.github/workflows/ci.yml` | workflow-shell-lint 実装 |
| Reminder workflow | `.github/workflows/post-release-observation-reminder.yml` | actionlint 対象 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 8 specification | `phase-08.md` | リファクタリングの記録 |

## 完了条件

- [x] 必須見出しが存在する。
- [x] CI lint gate の所有 workflow が `.github/workflows/ci.yml` に固定されている。
- [x] closed Issue #526 は reopen / close しない。

## 依存 Phase 明示

Phase 1 / Phase 2 / Phase 5 / Phase 6 / Phase 7

## 統合テスト連携

本タスクは CI workflow と shell lint gate の NON_VISUAL 実装であり、UI や D1 runtime を伴う統合テストは対象外。統合相当の確認は `pnpm observation:lint`、actionlint、shellcheck、shell unit、artifacts parity で代替する。

## Phase実行記録
`[実装区分: 実装仕様書]`

## 方針

本タスクのリファクタリングは、lint gate 追加に伴う最小整理に限定する。shell script の構造変更、helper 分割、汎用 lint workflow 化は行わない。

## 許可される整理

| 対象 | 許可 |
| --- | --- |
| workflow step name | 意味が明確になる命名へ調整可。 |
| shellcheck warning | `scripts/observation/*.sh` 内の quoting / unused warning 修正可。 |
| package script | `observation:lint` 追加可。 |

## 禁止される整理

- `scripts/observation/create-reminder-issue.sh` の関数分割や別ファイル化。
- `.github/workflows/*.yml` 全体を対象にする汎用 gate 化。
- `scripts/**/*.sh` 全体の shellcheck 修正。

## DoD

- diff が lint gate と必要最小限の warning 修正に閉じている。
- Phase 9 の品質ゲートを再実行できる。
