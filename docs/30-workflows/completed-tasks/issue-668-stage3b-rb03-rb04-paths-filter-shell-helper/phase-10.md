# Phase 10: 完了条件（DoD）

| 項目 | 値 |
|------|----|
| 入力 | Phase 1〜9 の AC / 検証結果 |
| 出力 | DoD チェックリスト |

---

## 1. AC 達成チェック

| # | AC | 状態 | evidence path |
|---|----|------|---------------|
| AC-668r-01 | code PR で `e2e` matrix 起動 | ☐ | `outputs/phase-11/evidence/ci/ci8b-code-runs.txt` |
| AC-668r-02 | docs-only PR で `e2e` matrix skip | ☐ | `outputs/phase-11/evidence/ci/ci8a-docs-only-runs.txt` |
| AC-668r-03 | docs-only PR でも `e2e-tests-coverage-gate` = success | ☐ | `outputs/phase-11/evidence/ci/ci8a-docs-only-pr-checks.txt` |
| AC-668r-04 | `ci-shell-prelude.sh` が必須関数を提供 | ☐ | `outputs/phase-11/evidence/local/shellcheck-prelude.log` + `grep -E "^(gh_notice|gh_error|gh_warning|assert_jq|awk_compare_ge)\\(\\)" scripts/lib/ci-shell-prelude.sh` |
| AC-668r-05 | `coverage-gate-e2e.sh` / `coverage-guard.sh` が prelude を source | ☐ | `grep "source.*ci-shell-prelude" scripts/coverage-gate-e2e.sh scripts/coverage-guard.sh` |
| AC-668r-06 | `lint-shell.yml` が exit 0 | ☐ | `outputs/phase-11/evidence/ci/lint-shell-run.txt` |
| AC-668r-07 | 既存 coverage 判定挙動が回帰しない | ☑ | `outputs/phase-11/local-evidence-summary.md` + `coverage-gate-dryrun.log` |

---

## 2. 不変条件チェック

| # | 不変条件 | 状態 |
|---|----------|------|
| INV-1 | `e2e-tests-coverage-gate` context name が変更されていない | ☐ |
| INV-2 | `.github/actions/setup-project` を改変していない | ☐ |
| INV-3 | D1 / Cloudflare 設定に touch していない | ☐ |
| INV-4 | 新規 test ファイル拡張子が `*.spec.{ts,tsx}`（本タスクは追加なしのため自動 pass） | ☐ |
| INV-5 | mise / Node 24.15.0 / pnpm 10.33.2 が変更されていない | ☐ |

---

## 3. 機械検証 gate

| gate | 期待 |
|------|------|
| `actionlint .github/workflows/e2e-tests*.yml .github/workflows/lint-shell.yml` | exit 0 |
| `shellcheck --severity=warning --external-sources $(git ls-files 'scripts/**/*.sh')` | exit 0 |
| `mise exec -- pnpm vitest run scripts/coverage-guard.spec.ts` | green |
| `mise exec -- pnpm typecheck` | exit 0 |
| `mise exec -- pnpm lint` | exit 0 |
| dry-run PR CI8-A〜CI8-E | 全 success |

---

## 4. 文書同期チェック

| 観点 | path | 状態 |
|------|------|------|
| 本仕様書一式 | `docs/30-workflows/issue-668-stage3b-rb03-rb04-paths-filter-shell-helper/` 配下 14 ファイル | ☐ |
| 旧 unassigned-task の deprecation 注記 | `docs/30-workflows/unassigned-task/task-e2e-stage3b-rb-followup-composite-actions-001.md` 冒頭に「RB-3b-03 / 04 は本仕様書に分割移管」を追記 | ☐ |
| `aiworkflow-requirements` indexes | `pnpm indexes:rebuild` 実行で drift なし | ☐ |
| Phase 12 compliance | `outputs/phase-12/implementation-guide.md` に主要見出し記載 | ☐ |

---

## 5. PR 提出チェック

| # | 項目 | 状態 |
|---|------|------|
| PR-1 | base = `dev` / head = `feat/issue-668-rb03-rb04` | ☐ |
| PR-2 | PR 本文に AC trace + evidence path 一覧を記載 | ☐ |
| PR-3 | `outputs/phase-11/evidence/` 配下 evidence 群が commit に含まれる | ☐ |
| PR-4 | `gh pr checks` で `e2e-tests-coverage-gate` / `lint-shell` / `ci` 等 required すべて pass | ☐ |
| PR-5 | リンク: Issue #668 / 親仕様書 / RB-3b-01 #700 / RB-3b-02 #699 を本文に明記 | ☐ |

---

## 6. 完了条件（メタ）

- [x] AC 7 件すべての検証 path が確定
- [x] 不変条件 5 件のチェック対象が明示
- [x] 機械検証 gate 6 件が列挙
- [x] 文書同期 4 観点が予約
- [x] PR 提出 5 観点がチェックリスト化
