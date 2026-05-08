# Phase 3: 設計レビュー

<!-- validator-required skeleton -->

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| 機能名 | issue-526-ci-actionlint-shellcheck-gate |
| 作成日 | 2026-05-08 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | CI workflow / shell lint gate |
| status | completed |

## 目的

設計レビューとして、Issue #526 の actionlint / shellcheck gate を実装済みローカル状態に同期する。

## 実行タスク

- [x] Phase 3 の責務を確認する。
- [x] `.github/workflows/ci.yml` 所有の lint gate と `post-release-observation-reminder.yml` lint 対象境界を維持する。
- [x] Phase 3 の成果物と完了条件を記録する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Index | `index.md` | タスク全体の正本 |
| Artifacts | `artifacts.json` | Phase status / references |
| Previous Phase | `phase-02.md` | 依存 Phase |
| CI workflow | `.github/workflows/ci.yml` | workflow-shell-lint 実装 |
| Reminder workflow | `.github/workflows/post-release-observation-reminder.yml` | actionlint 対象 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 3 specification | `phase-03.md` | 設計レビューの記録 |

## 完了条件

- [x] 必須見出しが存在する。
- [x] CI lint gate の所有 workflow が `.github/workflows/ci.yml` に固定されている。
- [x] closed Issue #526 は reopen / close しない。

## 依存 Phase 明示

Phase 1 / Phase 2

## 統合テスト連携

本タスクは CI workflow と shell lint gate の NON_VISUAL 実装であり、UI や D1 runtime を伴う統合テストは対象外。統合相当の確認は `pnpm observation:lint`、actionlint、shellcheck、shell unit、artifacts parity で代替する。

## Phase実行記録
`[実装区分: 実装仕様書]`

## レビュー観点

| 観点 | チェック |
| --- | --- |
| スコープ | repo 全体 shellcheck に拡大していない。 |
| 副作用 | `lint` job は read-only。`remind` job の `issues: write` は既存 job に閉じる。 |
| パス | `.github/workflows/post-release-observation-reminder.yml` と `scripts/observation/*.sh` が実在する。 |
| 再現性 | local command と CI command が同じ対象を検査する。 |
| 正本整合 | post-release observation / deployment GHA の仕様と矛盾しない。 |

## 依存関係

Phase 4 以降は、本 Phase の設計レビュー完了後に実行する。Phase 4 / 5 / 9 / 11 は並列検討可能だが、ファイル編集は Phase 5 の手順に従って一回の実装サイクルで行う。

## 設計決定

| ID | 決定 | 理由 |
| --- | --- | --- |
| D-1 | 既存 workflow に `lint` job を追加 | trigger / path が対象 workflow と一致し、専用 workflow より運用面が単純。 |
| D-2 | actionlint は rhysd 公式 download script を使用 | 既存 `.github/workflows/audit-correlation-verify.yml` と同じ導入パターン。 |
| D-3 | shellcheck は apt で導入 | GitHub hosted runner で安定し、既存 workflow と同じ方式。 |
| D-4 | `remind` job に `needs: lint` は付けない | schedule runtime を lint download 障害で止めない。PR では lint job failure が gate になる。 |

## DoD

- 設計決定 D-1 から D-4 が Phase 5 の実装手順に反映されている。
- `needs: lint` を付けない理由が明記されている。
- Phase 4 以降へ進める状態である。
