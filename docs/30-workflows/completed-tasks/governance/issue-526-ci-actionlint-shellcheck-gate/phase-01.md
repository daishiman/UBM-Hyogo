# Phase 1: 要件定義

<!-- validator-required skeleton -->

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| 機能名 | issue-526-ci-actionlint-shellcheck-gate |
| 作成日 | 2026-05-08 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | CI workflow / shell lint gate |
| status | completed |

## 目的

要件定義として、Issue #526 の actionlint / shellcheck gate を実装済みローカル状態に同期する。

## 実行タスク

- [x] Phase 1 の責務を確認する。
- [x] `.github/workflows/ci.yml` 所有の lint gate と `post-release-observation-reminder.yml` lint 対象境界を維持する。
- [x] Phase 1 の成果物と完了条件を記録する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Index | `index.md` | タスク全体の正本 |
| Artifacts | `artifacts.json` | Phase status / references |
| Previous Phase | `phase-01.md` | 依存 Phase |
| CI workflow | `.github/workflows/ci.yml` | workflow-shell-lint 実装 |
| Reminder workflow | `.github/workflows/post-release-observation-reminder.yml` | actionlint 対象 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 1 specification | `phase-01.md` | 要件定義の記録 |

## 完了条件

- [x] 必須見出しが存在する。
- [x] CI lint gate の所有 workflow が `.github/workflows/ci.yml` に固定されている。
- [x] closed Issue #526 は reopen / close しない。

## 依存 Phase 明示

なし

## 統合テスト連携

本タスクは CI workflow と shell lint gate の NON_VISUAL 実装であり、UI や D1 runtime を伴う統合テストは対象外。統合相当の確認は `pnpm observation:lint`、actionlint、shellcheck、shell unit、artifacts parity で代替する。

## Phase実行記録
`[実装区分: 実装仕様書]`

## 目的

Issue #526 の要求を、後続実装者が CI workflow と shell lint gate として実装できる要件に固定する。Issue は closed のまま扱い、実装 PR では `Refs #526, Refs #350` のみ記載する。

## 要件

| ID | 要件 | 詳細 |
| --- | --- | --- |
| R-1 | actionlint gate | `.github/workflows/post-release-observation-reminder.yml` を `actionlint` で検査する。 |
| R-2 | shellcheck gate | `scripts/observation/*.sh` を `shellcheck` で検査する。 |
| R-3 | 初回スコープ限定 | repo 全体の shellcheck 修正を含めない。 |
| R-4 | runtime 副作用維持 | reminder Issue 作成の `remind` job ロジック、permissions、concurrency を変更しない。 |
| R-5 | closed Issue 維持 | Issue #526 は reopen / close しない。 |

## 変更対象ファイル

| パス | 種別 | 実装方針 |
| --- | --- | --- |
| `.github/workflows/ci.yml` | 編集候補 | 既存 main/dev PR gate に `workflow-shell-lint` job を追加する。最小案として推奨。 |
| `.github/workflows/post-release-observation-reminder.yml` | 編集候補 | 対象 workflow に `lint` job を直接追加する代替案。`pull_request` trigger を追加する場合は paths を workflow と observation scripts に限定する。 |
| `package.json` | 編集 | `observation:lint` を追加。採用値は bash syntax / shell unit / shellcheck / actionlint を含む。 |
| `docs/30-workflows/completed-tasks/ut-350-fu-01-ci-actionlint-shellcheck-gate.md` | 編集 | Phase 12 で consumed trace を追記。 |
| `.claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md` | 編集 | follow-up status を同期。 |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 編集 | workflow lint gate の current contract を追加。 |

## システム仕様参照

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Post-release observation | `.claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md` | reminder workflow / helper / evidence boundary |
| Cloudflare deployment | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Issue #350 の GHA schedule 採用理由 |
| GHA deployment | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | GitHub Actions 運用仕様 |
| Source unassigned task | `docs/30-workflows/completed-tasks/ut-350-fu-01-ci-actionlint-shellcheck-gate.md` | Issue #526 の元タスク |
| Parent workflow | `docs/30-workflows/completed-tasks/issue-350-long-term-production-observation/` | Issue #350 の現行正本。古い非 completed path は参照しない |

## 入出力・副作用

| 種別 | 内容 |
| --- | --- |
| 入力 | PR / push / workflow_dispatch で CI workflow が起動する。 |
| 出力 | actionlint / shellcheck の CI log。 |
| 副作用 | lint job は read-only。reminder Issue 作成 job の副作用は既存条件のまま。 |

## DoD

- R-1 から R-5 が Phase 2 の設計へ反映されている。
- 変更対象ファイルと除外スコープが明記されている。
- `taskType=implementation`, `visualEvidence=NON_VISUAL` が index / artifacts と一致している。
