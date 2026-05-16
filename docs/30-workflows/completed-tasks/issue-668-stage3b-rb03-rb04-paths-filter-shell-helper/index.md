# Issue #668 残課題 — RB-3b-03 paths filter / RB-3b-04 shell helper + shellcheck gate（実装仕様書）

| 項目 | 値 |
|------|----|
| workflow id | `issue-668-stage3b-rb03-rb04-paths-filter-shell-helper` |
| 実装区分 | **実装仕様書** |
| CONST_007 | single cycle |
| 親 Issue | #668 (CLOSED, residual follow-up implemented locally) |
| 関連 PR | #699 (RB-3b-02 build artifact 共有 完了) / #700 (RB-3b-01 composite action 完了) |
| 親仕様書 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/` |
| base branch | `dev` |
| feature branch（想定） | `feat/issue-668-rb03-rb04` |
| workflow_state | implemented-local-runtime-pending |
| 起票日 | 2026-05-14 |

---

## 機械検証メタ情報

| key | value |
| --- | --- |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| coverageTier | n/a（YAML / shell のみ） |
| evidence_state | LOCAL_NON_VISUAL_PASS_CI_PENDING |
| implementation_mode | edit + new（既存 workflow 修正 + helper 新設） |

---

## 1. 背景

Issue #668（Stage 3b follow-up: composite action 抽出と CI 高速化）は CLOSED されたが、4 件の RB（remediation backlog）のうち以下 2 件が残っていた。本ブランチでは RB-3b-03 / RB-3b-04 をローカル実装済みとし、PR CI / dry-run PR evidence / commit / push / PR はユーザー承認後に残す。

| RB | 状態 | 備考 |
|----|------|------|
| RB-3b-01: composite action `setup-project` 抽出 | DONE (#700) | `.github/actions/setup-project/action.yml` 配備済 |
| RB-3b-02: PR build-test と Lighthouse の build artifact 共有 | DONE (#699) | — |
| **RB-3b-03: e2e-tests.yml に paths precheck 追加** | **implemented-local-runtime-pending** | docs-only PR でも 18 分 e2e フル実行が走る CI コスト浪費を、single-workflow precheck で解消 |
| **RB-3b-04: shell helper + shellcheck gate** | **implemented-local-runtime-pending** | shell script 群の prelude 重複・lint gate 不在を、共通 prelude + shellcheck workflow で解消 |

既存の `docs/30-workflows/unassigned-task/task-e2e-stage3b-rb-followup-composite-actions-001.md` は 4 件混在で陳腐化しているため流用せず、残課題 2 項目のみをスコープとする独立 spec を本ディレクトリで定義する。

---

## 2. 目的（本仕様書スコープ）

1. `.github/workflows/e2e-tests.yml` に `precheck` job を追加し、UI / API / e2e 関連変更時のみ重い Playwright 実行を起動する。`e2e-tests-coverage-gate` という context name は dev/main の required check として登録済み（Issue #669 で hard gate 化）であるため、対象外 PR では同一 workflow 内で no-op success を返す。
2. `scripts/lib/ci-shell-prelude.sh` を新設して `set -euo pipefail` / `umask` / GitHub Actions annotation helper を一元化し、`scripts/coverage-gate-e2e.sh` および `scripts/coverage-guard.sh` を refactor する。
3. shellcheck gate workflow を追加し、`scripts/**/*.sh` の SC2086 等 violation を 0 件で維持する。

---

## 3. スコープ境界

| in scope | out of scope |
|----------|-------------|
| `.github/workflows/e2e-tests.yml` の `precheck` job 追加 + `e2e-tests-coverage-gate` job 名維持 | `e2e-tests.yml` の matrix / shard / browser 構成変更（Issue #668 で確定済） |
| `scripts/lib/ci-shell-prelude.sh` 新規作成 | `scripts/lib/` 配下既存 helper（`branch-escape.ts` 等）の挙動変更 |
| `scripts/coverage-gate-e2e.sh` を prelude `source` に refactor | coverage threshold（80%）の変更 |
| `scripts/coverage-guard.sh` を prelude `source` に refactor（最小限） | coverage-guard の判定ロジック変更 |
| `.github/workflows/lint-shell.yml` 新設（shellcheck gate） | 既存 `ci.yml` / `lint.yml` の改変 |
| docs-only PR で `e2e-tests-coverage-gate` が success になる回帰検証 | branch protection context name の変更 |

---

## 4. 受入基準（AC）

| # | 受入基準 | 検証方法 |
|---|----------|----------|
| AC-668r-01 | `apps/web/**` / `apps/api/**` / `packages/**` / `scripts/e2e-mock-api*` / `scripts/coverage-gate-e2e.sh` / `scripts/lib/**` / `.github/workflows/e2e-tests.yml` / `.github/actions/**` のいずれかが変更された PR で `e2e` matrix job が起動する | dummy code PR の `gh run list --workflow=e2e-tests.yml` で `e2e (desktop-chromium)` 等が `success` |
| AC-668r-02 | docs-only PR（`docs/**` のみ変更）で `e2e` matrix job が **skip** される | `gh run view` で `e2e (*)` が `skipped` |
| AC-668r-03 | docs-only PR でも `e2e-tests-coverage-gate` job が **`success`** で完了する（pending にならない） | `gh pr checks <PR>` で `e2e-tests-coverage-gate` = `pass` |
| AC-668r-04 | `scripts/lib/ci-shell-prelude.sh` が存在し、`set -euo pipefail` / `gh_notice` / `gh_error` 関数を提供する | `bash -n` + `grep -E '^(gh_notice|gh_error)\\(\\)' scripts/lib/ci-shell-prelude.sh` |
| AC-668r-05 | `scripts/coverage-gate-e2e.sh` / `scripts/coverage-guard.sh` が prelude を `source` する | `grep "source.*ci-shell-prelude" scripts/coverage-gate-e2e.sh scripts/coverage-guard.sh` 両方 hit |
| AC-668r-06 | `.github/workflows/lint-shell.yml` が起動し、`shellcheck scripts/**/*.sh` が exit 0 | `gh run view` で `shellcheck` step が `success` |
| AC-668r-07 | refactor 後も `coverage-gate-e2e.sh` / `coverage-guard.sh` の既存挙動（threshold 判定 / exit code）が回帰しない | 既存 `scripts/coverage-guard.spec.ts` が green / dry-run で 79% / 80% / 81% の 3 ケースを再確認 |

---

## 5. 変更対象ファイル inventory（CONST_005）

| path | 種別 | 役割 |
|------|------|------|
| `.github/workflows/e2e-tests.yml` | edit | `precheck` job と no-op success branch を追加。対象変更 PR でのみ重い e2e matrix を実行し、対象外 PR でも同名 required context `e2e-tests-coverage-gate` を success として出す |
| `scripts/lib/ci-shell-prelude.sh` | new | 共通 prelude（`set -euo pipefail` / `umask 077` / `gh_notice` / `gh_error` / `assert_jq` / `awk_compare_ge`） |
| `scripts/coverage-gate-e2e.sh` | edit | 冒頭で prelude を `source`、`echo "::error::"` を `gh_error` に置換 |
| `scripts/coverage-guard.sh` | edit | 冒頭で prelude を `source`（最小差分。判定ロジック不変） |
| `.github/workflows/lint-shell.yml` | new | `shellcheck scripts/**/*.sh` を実行する gate workflow |
| `scripts/cf-waf-apply/lib.sh` | edit | shellcheck sweep の SC2034 対応 |
| `scripts/observability-target-diff.sh` | edit | shellcheck sweep の SC2034 対応 |
| `scripts/verify-09c-no-visual-values.sh` | edit | shellcheck sweep の SC1102 対応 |

---

## 6. 不変条件

1. **mise 経由実行**: Node 24.15.0 / pnpm 10.33.2 を `.mise.toml` 正本として保持。CI 内の `mise exec --` 実行ルールは `setup-project` composite action に委譲。
2. **`.github/actions/setup-project` を継続利用**: RB-3b-01 で導入済の composite action を破壊しない。
3. **`e2e-tests-coverage-gate` context name は変更不可**: dev/main の required check として GitHub branch protection に登録済（Issue #669 で hard gate 化）。job id / `name:` / 完了時の context 名がいずれもこの文字列のままであること。
4. **D1 / Cloudflare 設定への影響なし**: 本タスクは workflow + shell のみ。`apps/api/wrangler.toml` / `apps/web/wrangler.toml` / `scripts/cf.sh` には触れない。
5. **新規 test ファイル拡張子規約**: 本タスクは shell + yml のため対象外だが、副次的に test ファイルを追加する場合は `*.spec.{ts,tsx}` のみ（CLAUDE.md §不変条件 8）。
6. **CONST_007 single cycle**: Phase 1→13 一直線。先送りタスクを生成しない。

---

## 7. paths precheck の対象パターン（正本）

```bash
if printf '%s\n' "$changed" | grep -Eq '^(apps/web/|apps/api/|packages/|scripts/e2e-mock-api|scripts/coverage-gate-e2e\.sh$|scripts/lib/|\.github/workflows/e2e-tests\.yml$|\.github/actions/)'; then
  echo "run_e2e=true" >> "$GITHUB_OUTPUT"
else
  echo "run_e2e=false" >> "$GITHUB_OUTPUT"
fi
```

> **設計判断**: workflow-level `paths` / 別 workflow `paths-ignore` 方式は mixed PR で同名 context が衝突し得るため撤回した。PR では workflow を常に起動し、job-level precheck で重い E2E だけを skip する。

---

## 8. Phase 1-13 状態表

| Phase | 名称 | 状態 | 出力 |
|-------|------|------|------|
| 1 | 要件定義 | completed | `phase-1.md` |
| 2 | 設計（高位） | completed | `phase-2.md` |
| 3 | 詳細設計 | completed | `phase-3.md` |
| 4 | テスト設計 | completed | `phase-4.md` |
| 5 | 実装手順（RB-3b-03） | completed | `phase-5.md` |
| 6 | 実装手順（RB-3b-04） | completed | `phase-6.md` |
| 7 | ローカル検証 | completed | `phase-7.md` |
| 8 | CI 検証 | completed（local executable evidence captured; PR CI pending user approval） | `phase-8.md` |
| 9 | ロールバック設計 | completed | `phase-9.md` |
| 10 | 完了条件（DoD） | completed | `phase-10.md` |
| 11 | evidence 取得 | completed（local NON_VISUAL evidence） | `phase-11.md` + `outputs/phase-11/evidence/*` |
| 12 | skill / docs 同期 | completed | `phase-12.md` + `outputs/phase-12/*` |
| 13 | PR 作成 | blocked | `phase-13.md`（user approval gate） |

---

## 9. DoD（Definition of Done）サマリ

- [x] AC-668r-04 / AC-668r-05 / AC-668r-07 のローカル evidence を保存
- [ ] AC-668r-01..AC-668r-03 / AC-668r-06 の GitHub Actions runtime evidence は push / PR 後に取得
- [ ] docs-only PR 1 件で `e2e-tests-coverage-gate` = `success` を観測した evidence を `outputs/phase-11/evidence/ci/ci8a-docs-only-pr-checks.txt` として保存
- [ ] code PR 1 件で `e2e (desktop-chromium)` = `success` + `e2e-tests-coverage-gate` = `success` を観測した evidence を `outputs/phase-11/evidence/ci/ci8b-code-pr-checks.txt` として保存
- [x] `shellcheck scripts/**/*.sh` exit 0 の log を `outputs/phase-11/evidence/local/shellcheck-all.log` として保存
- [ ] `aiworkflow-requirements` indexes が再生成され drift なし（`pnpm indexes:rebuild` 実行）
- [x] `outputs/phase-12/` strict 7 files が存在し、`phase12-task-spec-compliance-check.md` が implemented-local-runtime-pending 境界で PASS
