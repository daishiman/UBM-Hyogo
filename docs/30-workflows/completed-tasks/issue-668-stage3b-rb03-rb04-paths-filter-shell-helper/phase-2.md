# Phase 2: 高位設計

## 1. 採用アーキテクチャ

RB-3b-03 は **single-workflow precheck** を採用する。

```
.github/workflows/e2e-tests.yml
  precheck
    changed files を判定
    run_e2e=true  -> e2e matrix + coverage gate
    run_e2e=false -> e2e matrix skip + e2e-tests-coverage-gate no-op success

.github/workflows/lint-shell.yml
  scripts/**/*.sh 変更時に shellcheck

scripts/lib/ci-shell-prelude.sh
  shell helper 共通化
```

二 workflow 補完案（`e2e-tests-skip.yml` + `paths-ignore`）は撤回する。混在 PR（例: `apps/web/**` + `docs/**`）では両 workflow が起動し、同名 required context `e2e-tests-coverage-gate` が衝突し得るため。

## 2. RB-3b-03 設計

`e2e-tests.yml` は PR で常に起動し、`precheck` job が changed files を見て重い E2E 実行だけを分岐する。

| 変更パス例 | `precheck.run_e2e` | e2e matrix | `e2e-tests-coverage-gate` |
| --- | --- | --- | --- |
| `docs/**` のみ | `false` | skipped | no-op success |
| `apps/web/**` | `true` | run | coverage gate |
| `apps/web/**` + `docs/**` | `true` | run | coverage gate |
| `.github/workflows/lint-shell.yml` のみ | `false` | skipped | no-op success |
| `scripts/lib/**` | `true` | run | coverage gate |

precheck allowlist:

- `apps/web/`
- `apps/api/`
- `packages/`
- `scripts/e2e-mock-api`
- `scripts/coverage-gate-e2e.sh`
- `scripts/lib/`
- `.github/workflows/e2e-tests.yml`
- `.github/actions/`

## 3. RB-3b-04 設計

`scripts/lib/ci-shell-prelude.sh` を source 専用 helper として追加し、次を提供する。

- `set -euo pipefail`
- `umask 077`
- `gh_notice`, `gh_warning`, `gh_error`
- `assert_jq`
- `awk_compare_ge`

`scripts/coverage-gate-e2e.sh` と `scripts/coverage-guard.sh` はこの prelude を source する。

## 4. Shellcheck Sweep

全 tracked shell script を `shellcheck --severity=warning --external-sources` で確認する。既存 violation の最小修正として次も implementation target に含める。

- `scripts/cf-waf-apply/lib.sh`
- `scripts/observability-target-diff.sh`
- `scripts/verify-09c-no-visual-values.sh`

## 5. 完了条件

- [x] required context の duplicate 起動を避ける single-workflow precheck に統一
- [x] implementation targets 9 件を artifacts / Phase 12 に反映
- [x] local shellcheck / bash syntax / coverage boundary evidence を取得
- [ ] PR 上の GitHub Actions runtime evidence は user-gated
