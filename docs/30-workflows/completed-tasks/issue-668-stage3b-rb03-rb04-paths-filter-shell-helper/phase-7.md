# Phase 7: ローカル検証

## 実行済み local evidence

| ID | 観点 | コマンド | 結果 |
| --- | --- | --- | --- |
| L7-1 | bash syntax | `bash -n scripts/lib/ci-shell-prelude.sh scripts/coverage-gate-e2e.sh scripts/coverage-guard.sh` | PASS |
| L7-2 | focused shellcheck | `shellcheck --severity=warning --external-sources scripts/lib/ci-shell-prelude.sh scripts/coverage-gate-e2e.sh scripts/coverage-guard.sh` | PASS |
| L7-3 | all tracked shellcheck | `git ls-files -z 'scripts/*.sh' 'scripts/**/*.sh' \| xargs -0 shellcheck --severity=warning --external-sources` | PASS |
| L7-4 | e2e precheck inventory | `rg -n "grep -Eq\|run_e2e=false\|run_e2e=true\|e2e skipped by paths precheck" .github/workflows/e2e-tests.yml` + `test ! -f .github/workflows/e2e-tests-skip.yml` | PASS |
| L7-5 | coverage gate boundary | fixture `total.lines.pct` = 79 / 80 / 81 | PASS: 79 fails, 80/81 pass |

Tracked summary: `outputs/phase-11/local-evidence-summary.md`.

Raw `.log` files under `outputs/phase-11/evidence/` are ignored by repository `.gitignore`; they are local evidence only. The tracked summary is the reviewable evidence ledger.

## Pending

| ID | 観点 | 理由 |
| --- | --- | --- |
| L7-P1 | `actionlint` | local command not installed in this environment |
| L7-P2 | `pnpm lint` / `pnpm typecheck` | broad repository gates; not required for shell-only local proof, may be run before PR |
| L7-P3 | GitHub Actions dry-run PR | commit / push / PR are user-gated |

## 完了条件

- [x] macOS-compatible shellcheck command に更新済み
- [x] local evidence と pending evidence を分離済み
- [x] tracked evidence summary を追加済み
