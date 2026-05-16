# Phase 11: evidence 取得計画

| 項目 | 値 |
|------|----|
| 評価方式 | NON_VISUAL（YAML / shell のみ） |
| evidence ルート | `docs/30-workflows/issue-668-stage3b-rb03-rb04-paths-filter-shell-helper/outputs/phase-11/evidence/` |

---

## 1. ディレクトリ構成

```
outputs/phase-11/evidence/
  local/
    bash-n.log
    shellcheck-prelude.log
    shellcheck-all.log
    paths-precheck.log
    coverage-gate-79.log
    coverage-gate-80.log
    coverage-gate-81.log
  ci/
    ci8a-docs-only-pr-checks.txt
    ci8a-docs-only-runs.txt
    ci8b-code-pr-checks.txt
    ci8b-code-runs.txt
    ci8c-mixed-pr-checks.txt
    ci8d-shell-pr-checks.txt
    ci8e-workflow-pr-checks.txt
    lint-shell-run.txt
  inventory/
    files-changed.txt
    grep-source-prelude.txt
    grep-prelude-functions.txt
  governance/
    branch-protection-contexts.txt
```

---

## 2. ローカル evidence 取得コマンド

| ファイル | コマンド |
|---------|----------|
| `local/bash-n.log` | `bash -n scripts/lib/ci-shell-prelude.sh scripts/coverage-gate-e2e.sh scripts/coverage-guard.sh 2>&1 | tee outputs/phase-11/evidence/local/bash-n.log` |
| `local/shellcheck-prelude.log` | `shellcheck --severity=warning --external-sources scripts/lib/ci-shell-prelude.sh scripts/coverage-gate-e2e.sh scripts/coverage-guard.sh 2>&1 | tee outputs/phase-11/evidence/local/shellcheck-prelude.log` |
| `local/shellcheck-all.log` | `git ls-files -z 'scripts/*.sh' 'scripts/**/*.sh' \| xargs -0 shellcheck --severity=warning --external-sources 2>&1 \| tee outputs/phase-11/evidence/local/shellcheck-all.log` |
| `local/paths-precheck.log` | `rg -n "grep -Eq\|run_e2e=false\|run_e2e=true\|e2e skipped by paths precheck" .github/workflows/e2e-tests.yml && test ! -f .github/workflows/e2e-tests-skip.yml` |
| `local/coverage-gate-{79,80,81}.log` | Phase 4 §6 の stub ループ + `tee` |
| `outputs/phase-11/local-evidence-summary.md` | tracked summary for ignored raw local logs |

---

## 3. CI evidence 取得コマンド

dry-run PR ごとに以下を実行（CI8-A の例）:

```bash
PR=<pr_number>
gh pr checks "$PR" > outputs/phase-11/evidence/ci/ci8a-docs-only-pr-checks.txt
gh run list --workflow=e2e-tests.yml --branch=ci8a-docs-only --limit=5 \
  > outputs/phase-11/evidence/ci/ci8a-docs-only-runs.txt
gh run list --workflow=e2e-tests.yml --branch=ci8a-docs-only --limit=5 \
  >> outputs/phase-11/evidence/ci/ci8a-docs-only-runs.txt
```

CI8-B〜CI8-E も同様の対応関係でファイル名を割り当てる（Phase 8 §1 の表を参照）。

`lint-shell-run.txt`:
```bash
gh run list --workflow=lint-shell.yml --branch=feat/issue-668-rb03-rb04 --limit=3 \
  > outputs/phase-11/evidence/ci/lint-shell-run.txt
```

`governance/branch-protection-contexts.txt`:
```bash
mkdir -p outputs/phase-11/evidence/governance
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --jq '.required_status_checks.contexts' \
  > outputs/phase-11/evidence/governance/branch-protection-contexts.txt
```

---

## 4. inventory evidence

| ファイル | コマンド |
|---------|----------|
| `inventory/files-changed.txt` | `git diff dev...HEAD --name-only > outputs/phase-11/evidence/inventory/files-changed.txt` |
| `inventory/grep-source-prelude.txt` | `grep -nE "source.*ci-shell-prelude" scripts/coverage-gate-e2e.sh scripts/coverage-guard.sh > outputs/phase-11/evidence/inventory/grep-source-prelude.txt` |
| `inventory/grep-prelude-functions.txt` | `grep -nE "^(gh_notice|gh_warning|gh_error|assert_jq|awk_compare_ge)\\(\\)" scripts/lib/ci-shell-prelude.sh > outputs/phase-11/evidence/inventory/grep-prelude-functions.txt` |

---

## 5. evidence の正本判定

| evidence | 正本判定基準 |
|---------|-------------|
| `shellcheck-all.log` | 末尾 exit 0（出力末尾に何も出ないか、command exit code = 0） |
| `paths-precheck.log` | `run_e2e=true` / `run_e2e=false` / no-op success branch が存在し、`e2e-tests-skip.yml` が存在しない |
| `coverage-gate-79.log` | `::error::line coverage 79 < 80` を含み exit=1 |
| `coverage-gate-80.log` | `::notice::line coverage 80 >= 80` を含み exit=0 |
| `local-evidence-summary.md` | raw local logs の要点と pending user-gated evidence が分離されている |
| CI checks `.txt` | `e2e-tests-coverage-gate` 行が `pass` |
| `branch-protection-contexts.txt` | `e2e-tests-coverage-gate` を含み、context name 変更不要であることを確認 |
| `files-changed.txt` | 9 implementation paths（`.github/workflows/e2e-tests.yml`, `.github/workflows/lint-shell.yml`, `scripts/lib/ci-shell-prelude.sh`, `scripts/coverage-gate-e2e.sh`, `scripts/coverage-guard.sh`, `scripts/cf-waf-apply/lib.sh`, `scripts/observability-target-diff.sh`, `scripts/verify-09c-no-visual-values.sh`）+ 仕様書 / artifacts / Phase 12 outputs |

---

## 6. 完了条件

- [x] evidence ファイルパス全件が予約済
- [x] 取得コマンドが path 単位で記述
- [x] 正本判定基準が明記
