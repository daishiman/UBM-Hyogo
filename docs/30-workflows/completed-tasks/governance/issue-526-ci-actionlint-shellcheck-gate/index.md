# issue-526-ci-actionlint-shellcheck-gate - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| 機能名 | UT-350-FU-01 CI actionlint / shellcheck gate |
| GitHub Issue | #526（CLOSED 維持 / 再 OPEN しない / PR 文面は `Refs #526, Refs #350`） |
| 親タスク | Issue #350 long-term production observation |
| 起票元 | `docs/30-workflows/completed-tasks/ut-350-fu-01-ci-actionlint-shellcheck-gate.md` |
| 親 workflow 正本 | `docs/30-workflows/completed-tasks/issue-350-long-term-production-observation/` |
| 作成日 | 2026-05-08 |
| ステータス | implemented-local |
| 総 Phase 数 | 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| docsOnly | false |
| 優先度 | low |
| 見積もり規模 | small |

## 実装区分

`[実装区分: 実装仕様書]`

判定根拠:

- Issue #526 は `.github/workflows/post-release-observation-reminder.yml` と `scripts/observation/*.sh` を CI で検査する gate 追加を求めており、コード変更なしでは目的を達成できない。
- 変更対象は GitHub Actions workflow と package script / shell lint command であり、ドキュメントだけで完結しない。
- Issue は closed だが、ユーザー指定どおり closed のまま仕様書を作成する。後続 PR は `Refs #526, Refs #350` とし、Issue の reopen / close 操作は行わない。
- 本レビューサイクルで `.github/workflows/ci.yml` の `workflow-shell-lint` job と `package.json` の `observation:lint` script を実装済み。GitHub Actions runtime evidence は PR 後に取得するため `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` とする。

CONST_005 必須項目の所在:

| 必須項目 | 所在 |
| --- | --- |
| 変更対象ファイル一覧 | Phase 1 / Phase 2 |
| 関数・型・モジュール構造 | Phase 2 |
| 入力・出力・副作用 | Phase 2 / Phase 5 |
| テスト方針 | Phase 4 / Phase 7 / Phase 9 |
| ローカル実行・検証コマンド | Phase 5 / Phase 9 / Phase 11 |
| DoD | 各 Phase 末尾 |

## 目的

Issue #350 で追加された post-release observation reminder の GitHub Actions YAML と shell helper を、main へ入る前に CI で検査する。初回対象は `post-release-observation-reminder.yml` と `scripts/observation/*.sh` に限定し、repo 全体の shellcheck warning 一括修正は行わない。

## 受入条件

| ID | 条件 | 検証 |
| --- | --- | --- |
| AC-1 | GitHub Actions workflow 検査で `.github/workflows/post-release-observation-reminder.yml` に `actionlint` が走る | `gh run view --log` / Phase 11 |
| AC-2 | shell helper 検査で `scripts/observation/*.sh` に `shellcheck` が走る | `gh run view --log` / Phase 11 |
| AC-3 | 初回 gate は対象を Issue #350 追加ファイルに限定し、既存 shell 全体の warning を巻き込まない | workflow path / shellcheck path grep |
| AC-4 | local でも syntax / lint 相当の検証コマンドが再現できる | Phase 5 / Phase 9 commands |
| AC-5 | CI 失敗時に broken YAML / shell script が PR 上で検出される | Phase 6 failure cases |
| AC-6 | aiworkflow-requirements の post-release observation / deployment GHA 仕様と Phase 12 成果物が同期される | Phase 12 |

## 変更対象ファイル

| パス | 種別 | 方針 |
| --- | --- | --- |
| `.github/workflows/ci.yml` | 編集済み | 既存 main/dev PR gate に `workflow-shell-lint` job を追加。 |
| `.github/workflows/post-release-observation-reminder.yml` | 参照のみ | reminder runtime workflow。`remind` job の runtime 副作用は変更しない。 |
| `package.json` | 編集済み | `observation:lint` script を追加。 |
| `docs/30-workflows/completed-tasks/ut-350-fu-01-ci-actionlint-shellcheck-gate.md` | 編集 | Phase 12 で consumed trace を追記する。 |
| `.claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md` | 編集 | Follow-up entry を spec_created / implementation pending から implemented-local へ同期する。 |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 編集 | post-release observation reminder の CI lint gate を追記する。 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` / `quick-reference.md` | 編集済み | Issue #526 の手動導線行を追加。 |

## Phase 一覧

| Phase | 名称 | 仕様書 |
| --- | --- | --- |
| 1 | 要件定義 | `phase-01.md` |
| 2 | 基本設計 | `phase-02.md` |
| 3 | 設計レビュー | `phase-03.md` |
| 4 | テスト設計 | `phase-04.md` |
| 5 | 実装手順 | `phase-05.md` |
| 6 | 失敗ケース | `phase-06.md` |
| 7 | カバレッジ確認 | `phase-07.md` |
| 8 | リファクタリング | `phase-08.md` |
| 9 | 品質保証 | `phase-09.md` |
| 10 | 最終レビュー | `phase-10.md` |
| 11 | 手動 / CI 実行確認 | `phase-11.md` |
| 12 | 仕様同期 | `phase-12.md` |
| 13 | PR 準備 | `phase-13.md` |
