# Phase 1: 要件定義（Issue #668 残課題: RB-3b-03 / RB-3b-04）

| 項目 | 値 |
|------|----|
| 起票日 | 2026-05-14 |
| 担当 | solo (daishiman) |
| 対象 PR base | `dev` |
| feature branch（想定） | `feat/issue-668-rb03-rb04` |
| 親 Issue | #668（CLOSED, 残課題の local implementation） |

---

## 1. 背景と目的

Issue #668（Stage 3b follow-up）は 4 件の RB を含む umbrella issue として close されたが、`gh issue view 668` および後続 PR ログ（#699 / #700）の精査により以下 2 件が残存していたことを確認した。本ブランチでローカル実装を完了し、PR runtime evidence は user gate 後に取得する。

| RB | タイトル | 現状 |
|----|----------|------|
| RB-3b-03 | `e2e-tests.yml` の `on.pull_request` に `paths` filter を追加し docs-only PR の e2e skip | implemented-local-runtime-pending |
| RB-3b-04 | shell helper (`scripts/lib/ci-shell-prelude.sh`) 抽出 + shellcheck gate workflow 追加 | implemented-local-runtime-pending |

本仕様書では、この 2 件のみを 1 サイクル（CONST_007）で完了させる。

---

## 2. P50 pre-check（事前確認サマリ）

| 確認項目 | 結果 | 根拠 |
|---------|------|------|
| `.github/workflows/e2e-tests.yml` 現状 | `pull_request: { branches: [dev, main] }` のみ。`paths` 未指定 | `.github/workflows/e2e-tests.yml:1-10` |
| `e2e-tests-coverage-gate` の required check 登録 | 登録済（Issue #669 で hard gate 化） | branch protection の `required_status_checks.contexts` に含まれる前提 |
| `scripts/lib/` 配下 | `branch-escape.ts` / `front-matter.ts` 等のみ。shell prelude 不在 | `ls scripts/lib/` |
| `scripts/coverage-gate-e2e.sh` 現状 | `set -euo pipefail` を冒頭に直書き | 既存 helper 不在 |
| `scripts/coverage-guard.sh` 現状 | 同上 | 既存 helper 不在 |
| shellcheck gate workflow | 不在 | `ls .github/workflows/ | grep -i shell` 該当なし |
| `.github/actions/setup-project` | 配備済（RB-3b-01 完了 #700） | `.github/actions/setup-project/action.yml` |

---

## 3. scope

| in scope | out of scope |
|----------|-------------|
| `.github/workflows/e2e-tests.yml` の `on.pull_request.paths` 追加 | matrix / shard 構成変更 |
| `e2e-tests-coverage-gate` job の `if:` 条件拡張（skip 時も success 化） | required check context name の変更 |
| `scripts/lib/ci-shell-prelude.sh` の新規作成 | `scripts/lib/` 配下 TypeScript helper の改変 |
| `scripts/coverage-gate-e2e.sh` / `scripts/coverage-guard.sh` の prelude `source` 化 | 既存判定ロジックの変更 |
| `.github/workflows/lint-shell.yml` 新設 | 既存 `ci.yml` / `lint.yml` への shellcheck step 追加（独立 workflow に分離） |

---

## 4. pre-conditions

- RB-3b-01（`.github/actions/setup-project`）が dev に merge 済（PR #700）
- RB-3b-02（build artifact 共有）が dev に merge 済（PR #699）
- Issue #669 の hard gate 化により `e2e-tests-coverage-gate` が dev/main の required check として登録済
- `mise install` 済（Node 24.15.0 / pnpm 10.33.2）
- `shellcheck` が ubuntu-latest runner で利用可能（pre-installed、検証済）

---

## 5. acceptance criteria（AC）

index.md §4 の AC-668r-01..AC-668r-07 を本 phase の正本 AC として採用する。要旨は以下:

| # | 要旨 |
|---|------|
| AC-668r-01 | code 系変更で `e2e` matrix が起動 |
| AC-668r-02 | docs-only 変更で `e2e` matrix が skip |
| AC-668r-03 | docs-only でも `e2e-tests-coverage-gate` が `success`（pending 不可） |
| AC-668r-04 | `ci-shell-prelude.sh` が必須関数を提供 |
| AC-668r-05 | `coverage-gate-e2e.sh` / `coverage-guard.sh` が prelude を source |
| AC-668r-06 | shellcheck gate workflow が exit 0 |
| AC-668r-07 | 既存 coverage 判定挙動が回帰しない |

---

## 6. inventory（変更対象）

| path | 種別 | 主要変更点 |
|------|------|-----------|
| `.github/workflows/e2e-tests.yml` | edit | `on.pull_request.paths` 追加 / `e2e-tests-coverage-gate` の `if:` 条件と `needs.e2e.result` 判定の拡張 |
| `scripts/lib/ci-shell-prelude.sh` | new | 共通 prelude bash library |
| `scripts/coverage-gate-e2e.sh` | edit | 冒頭 `source "$(dirname "$0")/lib/ci-shell-prelude.sh"` |
| `scripts/coverage-guard.sh` | edit | 同上 |
| `.github/workflows/lint-shell.yml` | new | shellcheck gate |

---

## 7. naming conventions

- shell helper file: `scripts/lib/ci-shell-prelude.sh`（命名理由: `ci-` で CI 用途を明示、`-prelude` で source 専用ライブラリと明示）
- shell helper 関数 prefix: `gh_*`（GitHub Actions 用）/ `assert_*`（事前検証）/ `awk_*`（awk wrapper）
- shellcheck workflow id: `lint-shell`
- shellcheck job id / name: `shellcheck`
- e2e-tests-coverage-gate context name: 変更禁止（dev/main required check）

---

## 8. open questions

| # | 質問 | 暫定方針 |
|---|------|----------|
| Q-668r-01 | workflow-level paths filter と job-level precheck のどちらを採用するか | **job-level precheck** を採用。workflow は常に起動し、重い e2e matrix だけを skip する |
| Q-668r-02 | required check pending 罠の回避策として別 workflow 補完を採るか | **採らない**。mixed PR で同名 required context が重複し得るため、single-workflow no-op branch に統一 |
| Q-668r-03 | shellcheck の severity threshold | `--severity=warning`（error と warning を fail、style / info は pass） |
| Q-668r-04 | shellcheck 対象 glob | `scripts/**/*.sh` のみ。`scripts/hooks/**/*.sh` も含む（lefthook hook も lint 対象） |
| Q-668r-05 | `scripts/cf.sh` を shellcheck 対象に含めるか | 含める（既存実装で violation があれば本 PR で最小修正） |

---

## 9. implementation_mode

`edit + new`:
- edit: `.github/workflows/e2e-tests.yml` / `scripts/coverage-gate-e2e.sh` / `scripts/coverage-guard.sh`
- new: `scripts/lib/ci-shell-prelude.sh` / `.github/workflows/lint-shell.yml`

---

## 10. exit criteria

| # | 条件 |
|---|------|
| EX-01 | inventory 9 件が確定 |
| EX-02 | AC-668r-01..AC-668r-07 が機械検証可能な形式で列挙 |
| EX-03 | required check pending 罠の回避策（single-workflow no-op branch）が明示 |
| EX-04 | paths precheck の allowlist パターンが正本として固定 |

---

## Template Compliance Appendix

## メタ情報

- workflow: issue-668-stage3b-rb03-rb04-paths-filter-shell-helper
- phase: 1
- task classification: implementation / NON_VISUAL
- workflow_state: implemented-local-runtime-pending

## 目的

Issue #668 の残課題 2 RB（paths filter / shell helper + shellcheck gate）の実装スコープを確定する。

## 完了条件

- [x] AC が機械検証可能な形式で列挙されている
- [x] inventory が path 単位で確定している
- [x] required check pending 罠の回避策が明示されている
