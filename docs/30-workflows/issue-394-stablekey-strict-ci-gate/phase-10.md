# Phase 10: リリース準備

## merge 順序

1. legacy stableKey literal cleanup PR が main へ merge 済み（前提条件）
2. 本タスク PR（ci.yml strict step + 親 workflow doc 同期）作成
3. PR の `ci` required check が strict step を含めて PASS
4. main merge

## rollback 戦略

- ci.yml の strict step を削除する 1-line revert で warning_mode に戻る
- 親 workflow doc 更新は Phase 12 で同 PR にまとめており、同 PR 全体を revert すれば一貫した rollback 可能

## announce / 周知

- README / CONTRIBUTING.md への記載は scope out（不要と判断）
- 03a 親 workflow の implementation-guide.md 更新を周知の正本とする

## 完了条件

- [ ] この Phase の判断・手順・成果物が index.md の AC と矛盾しない。
- [ ] strict 0 violations 未達時は blocking CI gate を有効化しない。
- [ ] 必要な evidence または blocker 記録が outputs 配下に保存されている。

## 出力

- outputs/phase-10/main.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-394-stablekey-strict-ci-gate |
| phase | 10 |
| taskType | implementation / NON_VISUAL |
| state | spec_created / blocked_by_legacy_cleanup |

## 目的

Phase 10: リリース準備 の目的は、strict stableKey CI gate を legacy cleanup 完了後に安全に有効化できるよう、現行 blocker と実行条件を矛盾なく固定すること。

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

- 対応する `outputs/phase-10/` 配下に実測または blocked-state evidence を保存する。
- 実装前提が満たされない場合は `BLOCKED_BY_LEGACY_CLEANUP` として記録し、PASS と誤記しない。

## 統合テスト連携

NON_VISUAL。UI screenshot は不要。主な検証は `pnpm lint:stablekey:strict`、command trace、branch protection snapshot、Phase 12 strict 7 files の実体確認で行う。
