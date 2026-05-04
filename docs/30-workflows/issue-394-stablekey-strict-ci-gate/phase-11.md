# Phase 11: 実測 evidence（NON_VISUAL）

## 取得 evidence

| ファイル | 内容 | 取得コマンド |
| --- | --- | --- |
| `outputs/phase-11/evidence/strict-current-blocker.txt` | 現行コードベースで strict が exit 1 / violations > 0 | `pnpm lint:stablekey:strict 2>&1 \| tee outputs/phase-11/evidence/strict-current-blocker.txt; echo "exit_code=$?" >> outputs/phase-11/evidence/strict-current-blocker.txt` |
| `outputs/phase-11/evidence/strict-pass.txt` | legacy cleanup 完了後の strict exit 0 | `pnpm lint:stablekey:strict \| tee outputs/phase-11/evidence/strict-pass.txt; echo "exit_code=$?" >> outputs/phase-11/evidence/strict-pass.txt` |
| `outputs/phase-11/evidence/strict-violation-fail.txt` | 故意違反 fixture で strict が exit 非 0 | Phase 6 fixture 手順を実行し tee |
| `outputs/phase-11/evidence/ci-command-trace.md` | local / CI command 一致確認の grep 結果 | `grep "lint:stablekey:strict" package.json .github/workflows/ci.yml` を md 化 |
| `outputs/phase-11/evidence/branch-protection-main.json` | main required_status_checks の現行 contexts | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection/required_status_checks` |
| `outputs/phase-11/evidence/branch-protection-dev.json` | dev required_status_checks の現行 contexts | `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection/required_status_checks` |

## main.md / manual-smoke-log.md

- `outputs/phase-11/main.md` に NON_VISUAL evidence 4 点の収集結果サマリを記述
- `outputs/phase-11/manual-smoke-log.md` に実行日時 / 実行者 / 各 evidence の PASS/FAIL を記録

## 完了条件

- [ ] この Phase の判断・手順・成果物が index.md の AC と矛盾しない。
- [ ] strict 0 violations 未達時は blocking CI gate を有効化しない。
- [ ] 必要な evidence または blocker 記録が outputs 配下に保存されている。

## 出力

- outputs/phase-11/main.md
- outputs/phase-11/manual-smoke-log.md
- outputs/phase-11/evidence/strict-pass.txt
- outputs/phase-11/evidence/strict-violation-fail.txt
- outputs/phase-11/evidence/ci-command-trace.md
- outputs/phase-11/evidence/branch-protection-main.json
- outputs/phase-11/evidence/branch-protection-dev.json

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-394-stablekey-strict-ci-gate |
| phase | 11 |
| taskType | implementation / NON_VISUAL |
| state | spec_created / blocked_by_legacy_cleanup |

## 目的

Phase 11: 実測 evidence（NON_VISUAL） の目的は、strict stableKey CI gate を legacy cleanup 完了後に安全に有効化できるよう、現行 blocker と実行条件を矛盾なく固定すること。

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

- 対応する `outputs/phase-11/` 配下に実測または blocked-state evidence を保存する。
- 実装前提が満たされない場合は `BLOCKED_BY_LEGACY_CLEANUP` として記録し、PASS と誤記しない。

## 統合テスト連携

NON_VISUAL。UI screenshot は不要。主な検証は `pnpm lint:stablekey:strict`、command trace、branch protection snapshot、Phase 12 strict 7 files の実体確認で行う。
