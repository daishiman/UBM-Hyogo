# Phase 4: テスト戦略

## テスト matrix

| # | ケース | 実行コマンド | 期待結果 | evidence |
| --- | --- | --- | --- | --- |
| T1 | 現行コードベース strict PASS | `pnpm lint:stablekey:strict` | exit 0 / `0 violation(s)` | `outputs/phase-11/evidence/strict-pass.txt` |
| T2 | 故意違反 fixture FAIL | `STABLEKEY_LINT_FIXTURE=1 pnpm lint:stablekey:strict` 相当（Phase 6 で具体化） | exit 非 0 / violation 一覧出力 | `outputs/phase-11/evidence/strict-violation-fail.txt` |
| T3 | CI command 同等性 | `grep -A1 "lint:stablekey:strict" .github/workflows/ci.yml` と `grep "lint:stablekey:strict" package.json` の比較 | command 完全一致 | `outputs/phase-11/evidence/ci-command-trace.md` |
| T4 | 既存 vitest test 健全性 | `pnpm vitest run scripts/lint-stablekey-literal.test.ts` | PASS | Phase 7 integration-check |
| T5 | branch protection required context 整合 | `gh api repos/daishiman/UBM-Hyogo/branches/{main,dev}/protection/required_status_checks` | `contexts` に `ci` を含む | `outputs/phase-11/evidence/branch-protection-main.json` / `branch-protection-dev.json` |

## 追加テストファイル

新規 vitest 追加なし（既存 `scripts/lint-stablekey-literal.test.ts` で充足）。

## 完了条件

- [ ] この Phase の判断・手順・成果物が index.md の AC と矛盾しない。
- [ ] strict 0 violations 未達時は blocking CI gate を有効化しない。
- [ ] 必要な evidence または blocker 記録が outputs 配下に保存されている。

## 出力

- outputs/phase-04/main.md
- outputs/phase-04/test-matrix.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-394-stablekey-strict-ci-gate |
| phase | 4 |
| taskType | implementation / NON_VISUAL |
| state | spec_created / blocked_by_legacy_cleanup |

## 目的

Phase 4: テスト戦略 の目的は、strict stableKey CI gate を legacy cleanup 完了後に安全に有効化できるよう、現行 blocker と実行条件を矛盾なく固定すること。

## 実行タスク

- 現行 148 violations を前提に、CI を壊す変更を実行しない。
- cleanup 後に実行する作業と、今回実体化する evidence を分離する。
- AC / 依存関係 / Phase 12 strict outputs との整合を確認する。

## 参照資料

- docs/30-workflows/issue-394-stablekey-strict-ci-gate/index.md
- docs/30-workflows/completed-tasks/task-03a-stablekey-strict-ci-gate-001.md
- docs/30-workflows/completed-tasks/task-03a-stablekey-literal-legacy-cleanup-001.md
- .github/workflows/ci.yml
- package.json
- scripts/lint-stablekey-literal.mjs

## 成果物/実行手順

- 対応する `outputs/phase-04/` 配下に実測または blocked-state evidence を保存する。
- 実装前提が満たされない場合は `BLOCKED_BY_LEGACY_CLEANUP` として記録し、PASS と誤記しない。

## 統合テスト連携

NON_VISUAL。UI screenshot は不要。主な検証は `pnpm lint:stablekey:strict`、command trace、branch protection snapshot、Phase 12 strict 7 files の実体確認で行う。
