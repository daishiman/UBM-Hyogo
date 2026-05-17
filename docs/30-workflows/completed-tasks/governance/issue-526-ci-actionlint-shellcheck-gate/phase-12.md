# Phase 12: 仕様同期

<!-- validator-required skeleton -->

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| 機能名 | issue-526-ci-actionlint-shellcheck-gate |
| 作成日 | 2026-05-08 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | CI workflow / shell lint gate |
| status | completed |

## 目的

仕様同期として、Issue #526 の actionlint / shellcheck gate を実装済みローカル状態に同期する。

## 実行タスク

- [x] Phase 12 の責務を確認する。
- [x] `.github/workflows/ci.yml` 所有の lint gate と `post-release-observation-reminder.yml` lint 対象境界を維持する。
- [x] Phase 12 の成果物と完了条件を記録する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Index | `index.md` | タスク全体の正本 |
| Artifacts | `artifacts.json` | Phase status / references |
| Previous Phase | `phase-11.md` | 依存 Phase |
| CI workflow | `.github/workflows/ci.yml` | workflow-shell-lint 実装 |
| Reminder workflow | `.github/workflows/post-release-observation-reminder.yml` | actionlint 対象 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 12 specification | `phase-12.md` | 仕様同期の記録 |

## 完了条件

- [x] 必須見出しが存在する。
- [x] CI lint gate の所有 workflow が `.github/workflows/ci.yml` に固定されている。
- [x] closed Issue #526 は reopen / close しない。

## 依存 Phase 明示

Phase 1 / Phase 2 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11

## 統合テスト連携

本タスクは CI workflow と shell lint gate の NON_VISUAL 実装であり、UI や D1 runtime を伴う統合テストは対象外。統合相当の確認は `pnpm observation:lint`、actionlint、shellcheck、shell unit、artifacts parity で代替する。

## Phase実行記録
`[実装区分: 実装仕様書]`

## 必須成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 close-out summary |
| `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル / Part 2 技術者レベルの実装ガイド |
| `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements 同期内容 |
| `outputs/phase-12/documentation-changelog.md` | docs / spec 更新履歴 |
| `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出。0 件でも作成 |
| `outputs/phase-12/skill-feedback-report.md` | skill feedback。改善なしでも作成 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | CONST_005 / Phase 12 compliance |

## 同期対象

| パス | 更新内容 |
| --- | --- |
| `docs/30-workflows/completed-tasks/ut-350-fu-01-ci-actionlint-shellcheck-gate.md` | consumed trace と `implemented-local / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` status を追記。 |
| `.claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md` | Follow-up entry を本 workflow path に接続。 |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | post-release observation reminder lint gate の current contract 追記。 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | no-diff 確認。Cloudflare deploy topology 変更なし。 |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-350-long-term-observation-2026-05.md` | no-diff 確認。今回の reusable lesson は skill feedback に記録。 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Issue #526 row を追加。 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Issue #526 quick lookup を追加。 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | v2026.05.08 row を追加。 |
| `.claude/skills/aiworkflow-requirements/changelog/20260508-issue526-ci-actionlint-shellcheck-gate.md` | 新規 changelog。 |

## 未タスク判定

CONST_007 に従い、本タスクは今回の実装サイクルで完了させる。repo 全体 shellcheck gate や汎用 workflow lint gate は Issue #526 の目的外であり、先送りではなくスコープ外と判定する。新規 backlog を作成する場合は、既存 `ut-cicd-drift-impl-workflow-lint-gate.md` との重複を確認する。

## DoD

- 7 つの Phase 12 成果物が実体として存在する。
- aiworkflow index を再生成している。
- `docs/30-workflows/completed-tasks/ut-350-fu-01-ci-actionlint-shellcheck-gate.md` に consumed trace がある。
