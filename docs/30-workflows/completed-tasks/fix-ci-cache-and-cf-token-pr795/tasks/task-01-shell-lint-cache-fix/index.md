# task-01-shell-lint-cache-fix

[実装区分: 実装仕様書]

## タイトル

`workflow-shell-lint` job における `actions/setup-node@v4` cache annotation error を解消するため、`setup-project` composite action に `cache` 入力を追加し、`install: 'false'` 経路で cache を無効化する。

## 目的

PR #795 マージ後も残存している CI failure 「`Path Validation Error: Path(s) specified in the action for caching ...`」を恒久的に解消する。`workflow-shell-lint` は依存 install を行わない (`install: 'false'`) ため pnpm store directory が未生成だが、`actions/setup-node@v4` の `cache: pnpm` がその store を post-cleanup で参照しに行き annotation error を出していた。`setup-project` 側で cache 入力を制御可能化し、install しない caller は `cache: ''` で無効化する。

## DoD (受入条件)

| ID | 条件 | 検証 |
| -- | ---- | ---- |
| AC-1 | `workflow-shell-lint` job が green | `gh run list --workflow=ci.yml --branch=<branch>` で latest = success |
| AC-2 | `Path Validation Error` annotation 0 件 | `gh run view <id> --log` で grep 0 |
| AC-3 | 他 caller (pr-build-test / e2e-tests / verify-stable-key-update / playwright-visual-* / ci.yml L103 / L223) が無変更で green | default `cache: 'pnpm'` による後方互換維持 |
| AC-4 | `actionlint` 構文検証 clean | `./actionlint .github/workflows/ci.yml .github/actions/setup-project/action.yml` exit 0 |

## 変更ファイル

| Path | 種別 | 行数 (目安) |
| ---- | ---- | --------- |
| `.github/actions/setup-project/action.yml` | 編集 | +6 / -1 |
| `.github/workflows/ci.yml` | 編集 | +1 |

## Phase テーブル

| Phase | ファイル | status |
| ----- | -------- | ------ |
| 1 | `phase-1.md` | spec_created |
| 2 | `phase-2.md` | spec_created |
| 3 | `phase-3.md` | spec_created |
| 4 | `phase-4.md` | spec_created |
| 5 | `phase-5.md` | spec_created |
| 6 | `phase-6.md` | spec_created |
| 7 | `phase-7.md` | spec_created |
| 8 | `phase-8.md` | spec_created |
| 9 | `phase-9.md` | spec_created |
| 10 | `phase-10.md` | spec_created |
| 11 | `phase-11.md` | spec_created |
| 12 | `phase-12.md` | spec_created |
| 13 | `phase-13.md` | spec_created |

## タスク分類

- task type: **NON_VISUAL** (GitHub Actions YAML 修正)
- implementation_mode: **new**
- Phase 11 evidence: CI run の green stamp + `gh run view --log` 出力 (スクリーンショット不要)

## 不変条件

1. `actions/setup-node@v4` の SHA pin (`49933ea5288caeca8642d1e84afbd3f7d6820020`) を維持
2. `pnpm/action-setup@v4` の SHA pin (`b906affcce14559ad1aafd4ab0e942779e9f58b1`) を維持
3. `cache` input の default は `'pnpm'` とし、既存 caller への副作用を一切出さない
4. 他 job (typecheck / lint / test / verify-*) を破壊しない
5. CLAUDE.md シークレット規約に従い、token 値・secret 値を YAML / docs に転記しない
