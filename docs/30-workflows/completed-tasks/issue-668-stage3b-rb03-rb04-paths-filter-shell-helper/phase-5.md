# Phase 5: 実装手順 — RB-3b-03

## 対象

| ファイル | 操作 |
| --- | --- |
| `.github/workflows/e2e-tests.yml` | edit |

`e2e-tests-skip.yml` は作らない。二 workflow 補完案は mixed PR で同名 required context が衝突し得るため撤回済み。

## 手順

1. `pull_request` の workflow-level `paths` filter は置かない。
2. `precheck` job を追加し、changed files から `run_e2e` output を決定する。
3. `e2e` matrix job に `needs: precheck` と `if: needs.precheck.outputs.run_e2e == 'true'` を追加する。
4. `e2e-tests-coverage-gate` job は `needs: [precheck, e2e]` + `if: always()` とし、`run_e2e=false` の時は no-op success で required context を満たす。

## 検証

| 観点 | コマンド / 証跡 | 期待 |
| --- | --- | --- |
| precheck pattern | `rg -n "grep -Eq|run_e2e=false|run_e2e=true|e2e skipped by paths precheck" .github/workflows/e2e-tests.yml` | hit |
| skip workflow 不在 | `test ! -f .github/workflows/e2e-tests-skip.yml` | exit 0 |
| PR runtime | CI8-A〜E dry-run PR | user-gated |

## 完了条件

- [x] `e2e-tests.yml` に precheck job がある
- [x] `e2e-tests-skip.yml` が存在しない
- [x] local precheck evidence を `outputs/phase-11/local-evidence-summary.md` に記録
