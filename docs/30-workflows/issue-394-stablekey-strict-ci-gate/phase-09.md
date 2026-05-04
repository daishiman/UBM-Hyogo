# Phase 9: セキュリティ・品質ゲート

## branch protection 正本確認

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection/required_status_checks
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection/required_status_checks
```

期待: `contexts` 配列に `ci` を含む。

PUT 操作は **禁止**（scope out / CONST_002）。drift があれば Phase 12 で aiworkflow-requirements doc を更新し unassigned-task 化する。

## 不変条件保護トレース

| 不変条件 | 保護機構 |
| --- | --- |
| #1 stableKey 二重定義禁止 | strict CI gate が allow-list 外の文字列リテラルで blocking |
| #2 publicConsent / rulesConsent 統一 | 同上射程内 |

## suppression 監査

`.github/workflows/ci.yml` 全体に `continue-on-error: true` が strict step に付与されていないことを Phase 11 で grep 確認:

```bash
grep -B1 -A2 "lint:stablekey:strict" .github/workflows/ci.yml | grep -i "continue-on-error" && echo "FAIL" || echo "PASS"
```

## bypass 経路の閉塞

- `if:` 条件は `steps.ready.outputs.value == 'true'` のみ（既存 step と同条件）
- `--no-verify` 等のローカル bypass は git hook の責務外（本タスク scope 外）

## 完了条件

- [ ] この Phase の判断・手順・成果物が index.md の AC と矛盾しない。
- [ ] strict 0 violations 未達時は blocking CI gate を有効化しない。
- [ ] 必要な evidence または blocker 記録が outputs 配下に保存されている。

## 出力

- outputs/phase-09/main.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-394-stablekey-strict-ci-gate |
| phase | 9 |
| taskType | implementation / NON_VISUAL |
| state | spec_created / blocked_by_legacy_cleanup |

## 目的

Phase 9: セキュリティ・品質ゲート の目的は、strict stableKey CI gate を legacy cleanup 完了後に安全に有効化できるよう、現行 blocker と実行条件を矛盾なく固定すること。

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

- 対応する `outputs/phase-09/` 配下に実測または blocked-state evidence を保存する。
- 実装前提が満たされない場合は `BLOCKED_BY_LEGACY_CLEANUP` として記録し、PASS と誤記しない。

## 統合テスト連携

NON_VISUAL。UI screenshot は不要。主な検証は `pnpm lint:stablekey:strict`、command trace、branch protection snapshot、Phase 12 strict 7 files の実体確認で行う。
