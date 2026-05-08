# Phase 5: 実装手順

<!-- validator-required skeleton -->

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| 機能名 | issue-526-ci-actionlint-shellcheck-gate |
| 作成日 | 2026-05-08 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | CI workflow / shell lint gate |
| status | completed |

## 目的

実装手順として、Issue #526 の actionlint / shellcheck gate を実装済みローカル状態に同期する。

## 実行タスク

- [x] Phase 5 の責務を確認する。
- [x] `.github/workflows/ci.yml` 所有の lint gate と `post-release-observation-reminder.yml` lint 対象境界を維持する。
- [x] Phase 5 の成果物と完了条件を記録する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Index | `index.md` | タスク全体の正本 |
| Artifacts | `artifacts.json` | Phase status / references |
| Previous Phase | `phase-04.md` | 依存 Phase |
| CI workflow | `.github/workflows/ci.yml` | workflow-shell-lint 実装 |
| Reminder workflow | `.github/workflows/post-release-observation-reminder.yml` | actionlint 対象 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 5 specification | `phase-05.md` | 実装手順の記録 |

## 完了条件

- [x] 必須見出しが存在する。
- [x] CI lint gate の所有 workflow が `.github/workflows/ci.yml` に固定されている。
- [x] closed Issue #526 は reopen / close しない。

## 依存 Phase 明示

Phase 4

## 統合テスト連携

本タスクは CI workflow と shell lint gate の NON_VISUAL 実装であり、UI や D1 runtime を伴う統合テストは対象外。統合相当の確認は `pnpm observation:lint`、actionlint、shellcheck、shell unit、artifacts parity で代替する。

## Phase実行記録
`[実装区分: 実装仕様書]`

## 実装ステップ

1. `.github/workflows/ci.yml` に `workflow-shell-lint` job を追加する。`permissions.contents: read`、`runs-on: ubuntu-24.04` とする。
2. 代替として `.github/workflows/post-release-observation-reminder.yml` へ直接追加する場合は、`pull_request.paths` を workflow と observation scripts に限定し、既存 `schedule` / `workflow_dispatch` は維持する。
3. `workflow-shell-lint` job で `shellcheck scripts/observation/*.sh` を実行する。
4. `workflow-shell-lint` job で actionlint を download し、`.github/workflows/post-release-observation-reminder.yml` を検査する。
5. `workflow-shell-lint` job で workflow secret allowlist grep を実行する。`post-release-observation-reminder.yml` では `secrets.GITHUB_TOKEN` を既存構造として許可し、それ以外の `secrets.*` literal を検出する。
6. shellcheck warning が出る場合のみ `scripts/observation/create-reminder-issue.sh` を最小修正する。関数名・CLI option・出力 key は変更しない。
7. 任意で `package.json` に次を追加する。

```json
"observation:lint": "set -e; bash -n scripts/observation/create-reminder-issue.sh; bash scripts/observation/test/test-create-reminder-issue.sh; shellcheck scripts/observation/*.sh scripts/observation/test/*.sh; ... actionlint .github/workflows/post-release-observation-reminder.yml .github/workflows/ci.yml"
```

8. Phase 12 で unassigned task と aiworkflow-requirements を同期する。

## 変更禁止

- `mode_create` の `gh issue create` 条件を変更しない。
- `permissions.issues: write` を workflow 全体から削除しない。
- Issue #526 を reopen / close しない。
- repo 全体の shellcheck 対象化を同サイクルに含めない。

## ローカル検証コマンド

```bash
bash -n scripts/observation/create-reminder-issue.sh
bash scripts/observation/test/test-create-reminder-issue.sh
shellcheck scripts/observation/*.sh scripts/observation/test/*.sh
actionlint .github/workflows/post-release-observation-reminder.yml .github/workflows/ci.yml
unexpected="$(grep -RInE 'secrets\.[A-Z0-9_]+' .github/workflows/post-release-observation-reminder.yml | grep -v 'secrets.GITHUB_TOKEN' || true)"; test -z "$unexpected"
pnpm run indexes:rebuild
git diff --check
```

`shellcheck` / `actionlint` がローカル未導入の場合:

```bash
sudo apt-get install -y shellcheck
bash <(curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)
./actionlint -color .github/workflows/post-release-observation-reminder.yml
```

## DoD

- workflow diff に `workflow-shell-lint` job が存在する。
- reminder runtime job の既存副作用が変わっていない。
- local command の結果が Phase 11 evidence に保存される。
