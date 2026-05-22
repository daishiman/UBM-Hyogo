# Phase 7: カバレッジ確認

<!-- validator-required skeleton -->

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| 機能名 | issue-526-ci-actionlint-shellcheck-gate |
| 作成日 | 2026-05-08 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | CI workflow / shell lint gate |
| status | completed |

## 目的

カバレッジ確認として、Issue #526 の actionlint / shellcheck gate を実装済みローカル状態に同期する。

## 実行タスク

- [x] Phase 7 の責務を確認する。
- [x] `.github/workflows/ci.yml` 所有の lint gate と `post-release-observation-reminder.yml` lint 対象境界を維持する。
- [x] Phase 7 の成果物と完了条件を記録する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Index | `index.md` | タスク全体の正本 |
| Artifacts | `artifacts.json` | Phase status / references |
| Previous Phase | `phase-06.md` | 依存 Phase |
| CI workflow | `.github/workflows/ci.yml` | workflow-shell-lint 実装 |
| Reminder workflow | `.github/workflows/post-release-observation-reminder.yml` | actionlint 対象 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 7 specification | `phase-07.md` | カバレッジ確認の記録 |

## 完了条件

- [x] 必須見出しが存在する。
- [x] CI lint gate の所有 workflow が `.github/workflows/ci.yml` に固定されている。
- [x] closed Issue #526 は reopen / close しない。

## 依存 Phase 明示

Phase 5 / Phase 6

## 統合テスト連携

本タスクは CI workflow と shell lint gate の NON_VISUAL 実装であり、UI や D1 runtime を伴う統合テストは対象外。統合相当の確認は `pnpm observation:lint`、actionlint、shellcheck、shell unit、artifacts parity で代替する。

## Phase実行記録
`[実装区分: 実装仕様書]`

## AC カバレッジ

| AC | カバーするテスト | 失敗ケース |
| --- | --- | --- |
| AC-1 | T-5, T-6, T-7 | F-1, F-2 |
| AC-2 | T-4, T-6, T-7 | F-3, F-4 |
| AC-3 | path grep, T-7 | F-5 |
| AC-4 | T-1, T-2, T-3, T-4, T-5 | F-1-F-4 |
| AC-5 | CI run failure review | F-1-F-6 |
| AC-6 | Phase 12 checks | documentation drift |

## 100% 条件

- すべての AC に少なくとも 1 つの local command と 1 つの CI / review evidence が紐づく。
- runtime CI evidence が未取得の場合は Phase 11 に `PENDING_RUNTIME_EVIDENCE` として明示し、local static evidence を PASS 境界にする。

## DoD

- AC 6/6 がテストまたはレビュー evidence に接続されている。
- 未取得 runtime evidence を local PASS と混同していない。
