# test-matrix（issue-394-stablekey-strict-ci-gate）

| ID | 種別 | 入力 | 実行コマンド | 期待 | 受け皿 |
| --- | --- | --- | --- | --- | --- |
| T-1 | 現行 blocker | repo 現状 | `pnpm lint:stablekey:strict` | exit 1 / 148 violations | `phase-11/evidence/strict-current-blocker.txt` |
| T-2 | command 一致 | `package.json` / `.github/workflows/ci.yml` | grep + diff | scripts entry と CI step 計画値が一致 | `phase-11/evidence/ci-command-trace.md` |
| T-3 | required context | branch=main, dev | `gh api repos/daishiman/UBM-Hyogo/branches/{branch}/protection/required_status_checks` | `contexts` に `ci` が含まれる | `phase-11/evidence/branch-protection-{branch}.json` |
| T-4 | cleanup 後 PASS | cleanup 完了後 repo | `pnpm lint:stablekey:strict` | exit 0 / 0 violations | `phase-11/evidence/strict-pass.txt`（PLANNED） |
| T-5 | 故意違反 fixture | 一時違反コミット | `pnpm lint:stablekey:strict` | exit 非 0 + violation 行報告 | `phase-11/evidence/strict-violation-fail.txt`（PLANNED） |
| T-6 | unit test | `scripts/lint-stablekey-literal.test.ts` | `pnpm vitest run` | PASS | local check log |

## 注記

- T-4 / T-5 は legacy cleanup 完了後にのみ実行可能。本サイクルでは PLANNED として記録。
- T-3 の正本は branch protection JSON で、`required_pull_request_reviews=null` (solo dev policy) に整合する。
