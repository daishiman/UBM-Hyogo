# Phase 8: パフォーマンス・運用

## パフォーマンス測定

| 項目 | 測定方法 | 許容範囲 |
| --- | --- | --- |
| local strict 実行時間 | `time pnpm lint:stablekey:strict` | < 5 sec（リポジトリ規模に応じ調整） |
| CI strict step 増分 | ci job 実行時間の前後比較（直近 5 回平均） | < 10 sec 増分 |

## 開発者 DX

- local 実行コマンドは CI と完全一致（`pnpm lint:stablekey:strict`）
- 違反検出時の出力形式は既存スクリプト準拠（変更なし）
- pre-commit hook への組込は本タスク scope 外（追加検討は Phase 12 unassigned-task 候補）

## 運用考慮

- ci.yml 編集は 1 step 追加に限定し rollback 容易
- 親 workflow 完了後、本 task spec dir は `docs/30-workflows/completed-tasks/` 移動候補（運用ルールに従う）

## 完了条件

- [ ] この Phase の判断・手順・成果物が index.md の AC と矛盾しない。
- [ ] strict 0 violations 未達時は blocking CI gate を有効化しない。
- [ ] 必要な evidence または blocker 記録が outputs 配下に保存されている。

## 出力

- outputs/phase-08/main.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-394-stablekey-strict-ci-gate |
| phase | 8 |
| taskType | implementation / NON_VISUAL |
| state | spec_created / blocked_by_legacy_cleanup |

## 目的

Phase 8: パフォーマンス・運用 の目的は、strict stableKey CI gate を legacy cleanup 完了後に安全に有効化できるよう、現行 blocker と実行条件を矛盾なく固定すること。

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

- 対応する `outputs/phase-08/` 配下に実測または blocked-state evidence を保存する。
- 実装前提が満たされない場合は `BLOCKED_BY_LEGACY_CLEANUP` として記録し、PASS と誤記しない。

## 統合テスト連携

NON_VISUAL。UI screenshot は不要。主な検証は `pnpm lint:stablekey:strict`、command trace、branch protection snapshot、Phase 12 strict 7 files の実体確認で行う。
