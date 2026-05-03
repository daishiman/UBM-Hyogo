# Phase 7: 統合検証

## 検証項目

| # | 項目 | コマンド | 期待 |
| --- | --- | --- | --- |
| I1 | local / CI command 一致 | `diff <(grep "lint:stablekey:strict" package.json) <(grep "lint:stablekey:strict" .github/workflows/ci.yml)` を目視 | command 文字列一致 |
| I2 | apps/web strict PASS | `mise exec -- pnpm lint:stablekey:strict` | exit 0 |
| I3 | apps/api strict PASS | 同上（同一スクリプトが apps / packages を全走査） | exit 0 |
| I4 | packages/* strict PASS | 同上 | exit 0 |
| I5 | 親 workflow AC-7 トレース | `grep -n "AC-7" docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/outputs/phase-12/implementation-guide.md` | 該当行存在 |
| I6 | 既存 vitest 健全性 | `mise exec -- pnpm vitest run scripts/lint-stablekey-literal.test.ts` | PASS |

## AC トレース

| AC | 検証 phase | 結果 |
| --- | --- | --- |
| AC-1 | Phase 5 Step 2 ci.yml diff | trace |
| AC-2 | Phase 9 / 11 branch protection snapshot | trace |
| AC-3 | Phase 11 strict-pass.txt | trace |
| AC-4 | Phase 6 / 11 strict-violation-fail.txt | trace |
| AC-5 | Phase 7 I1 | trace |
| AC-6 | Phase 12 親 workflow 同期 diff | trace |
| AC-7 | Phase 11/12 unassigned-task spec 完了条件 3 項対応 | trace |

## 完了条件

- [ ] この Phase の判断・手順・成果物が index.md の AC と矛盾しない。
- [ ] strict 0 violations 未達時は blocking CI gate を有効化しない。
- [ ] 必要な evidence または blocker 記録が outputs 配下に保存されている。

## 出力

- outputs/phase-07/main.md
- outputs/phase-07/integration-check.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-394-stablekey-strict-ci-gate |
| phase | 7 |
| taskType | implementation / NON_VISUAL |
| state | spec_created / blocked_by_legacy_cleanup |

## 目的

Phase 7: 統合検証 の目的は、strict stableKey CI gate を legacy cleanup 完了後に安全に有効化できるよう、現行 blocker と実行条件を矛盾なく固定すること。

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

- 対応する `outputs/phase-07/` 配下に実測または blocked-state evidence を保存する。
- 実装前提が満たされない場合は `BLOCKED_BY_LEGACY_CLEANUP` として記録し、PASS と誤記しない。

## 統合テスト連携

NON_VISUAL。UI screenshot は不要。主な検証は `pnpm lint:stablekey:strict`、command trace、branch protection snapshot、Phase 12 strict 7 files の実体確認で行う。
