# Phase 2: 基本設計

<!-- validator-required skeleton -->

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| 機能名 | issue-526-ci-actionlint-shellcheck-gate |
| 作成日 | 2026-05-08 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | CI workflow / shell lint gate |
| status | completed |

## 目的

基本設計として、Issue #526 の actionlint / shellcheck gate を実装済みローカル状態に同期する。

## 実行タスク

- [x] Phase 2 の責務を確認する。
- [x] `.github/workflows/ci.yml` 所有の lint gate と `post-release-observation-reminder.yml` lint 対象境界を維持する。
- [x] Phase 2 の成果物と完了条件を記録する。

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
| Phase 2 specification | `phase-02.md` | 基本設計の記録 |

## 完了条件

- [x] 必須見出しが存在する。
- [x] CI lint gate の所有 workflow が `.github/workflows/ci.yml` に固定されている。
- [x] closed Issue #526 は reopen / close しない。

## 依存 Phase 明示

Phase 1

## 統合テスト連携

本タスクは CI workflow と shell lint gate の NON_VISUAL 実装であり、UI や D1 runtime を伴う統合テストは対象外。統合相当の確認は `pnpm observation:lint`、actionlint、shellcheck、shell unit、artifacts parity で代替する。

## Phase実行記録
`[実装区分: 実装仕様書]`

## CI workflow 設計

推奨実装は `.github/workflows/ci.yml` への `workflow-shell-lint` job 追加とする。既存 main/dev PR gate に乗せることで、Issue #526 の「main に入る前に検出」を最小差分で満たす。

`.github/workflows/post-release-observation-reminder.yml` へ path-limited `pull_request` と `lint` job を直接追加する案も許容する。ただし schedule runtime と lint gate の責務が混ざるため、採用時は `remind` job に `needs: lint` を付けない。

```yaml
jobs:
  workflow-shell-lint:
    name: workflow-shell-lint
    runs-on: ubuntu-24.04
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - name: Install shellcheck
        run: sudo apt-get update && sudo apt-get install -y shellcheck
      - name: shellcheck observation scripts
        run: shellcheck scripts/observation/*.sh scripts/observation/test/*.sh
      - name: actionlint reminder workflow
        run: |
          bash <(curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)
          ./actionlint -color .github/workflows/post-release-observation-reminder.yml
      - name: Verify workflow secret allowlist
        run: |
          unexpected="$(
            grep -RInE 'secrets\.[A-Z0-9_]+' .github/workflows/post-release-observation-reminder.yml \
              | grep -v 'secrets.GITHUB_TOKEN' || true
          )"
          if [ -n "$unexpected" ]; then
            printf '%s\n' "$unexpected"
            exit 1
          fi
```

## 関数・スクリプト構造

既存 shell の関数シグネチャは変更しない。

```bash
die()                  # stderr に error を出して exit 1
validate_date DATE     # DATE が YYYY-MM-DD でなければ非 0
resolve_release_date() # INPUT_RELEASE_DATE または latest release の日付を返す
days_diff FROM TO      # 日数差を stdout
date_add_days DATE N   # DATE + N 日を stdout
today_iso()            # UTC 今日、または TODAY_OVERRIDE
write_output KEY VALUE # GITHUB_OUTPUT または stdout へ key=value
mode_resolve_only()    # reminder 判定 output を生成
render_body()          # markdown template を展開
mode_create()          # gh issue create 副作用あり
mode_dry_run()         # stdout のみ、副作用なし
```

## 入出力契約

| 対象 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `workflow-shell-lint` job | repository checkout | lint log | なし |
| `shellcheck` step | `scripts/observation/*.sh` | warning / error | なし |
| `actionlint` step | `.github/workflows/post-release-observation-reminder.yml` | warning / error | actionlint binary download |
| `remind` job | schedule / dispatch inputs | GitHub output / reminder Issue | 既存の Issue 作成 |

## エラーハンドリング

- `shellcheck` / `actionlint` / secret allowlist grep が非 0 の場合、`workflow-shell-lint` job は失敗させる。
- actionlint download failure は CI infrastructure failure として扱い、fallback で PASS にしない。
- shellcheck warning を suppress する場合は対象行に `# shellcheck disable=SCxxxx` と理由をコメントする。全体 disable は不可。

## DoD

- `workflow-shell-lint` job が `remind` job の副作用を変更しない設計になっている。
- 関数シグネチャを変更しない方針が明記されている。
- `actionlint` と `shellcheck` の対象 path が Issue #350 追加ファイルに限定されている。
