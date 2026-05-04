# Phase 3: 設計レビュー

## Alternative 評価

| 案 | 内容 | 判定 | 理由 |
| --- | --- | --- | --- |
| A: 既存 `ci` job に step 追加 | `pnpm lint:stablekey:strict` を ci job 内 step として追加 | **PASS（採用）** | required context 名維持 / branch protection 変更不要 / scope in に最小収束 |
| B: 新 lint-strict job を追加 | 専用 job + `needs: [ci]` または並列 | MAJOR | 新 context 名が branch protection に未登録、required PUT が必要となり scope out 抵触 |
| C: matrix で warn / strict 両走 | strategy.matrix で 2 mode 並列 | MINOR | 実行時間 2 倍 / 価値増分なし。warn mode は legacy cleanup 完了で不要 |

## 4 条件再確認

採用案 A は 4 条件すべて満たす（価値 / 実現 / 整合 / 運用）。

## リスク再評価

| リスク | 対策 |
| --- | --- |
| `pnpm lint` が先に fail し strict が skip される | step 順依存は許容（lint fail も等価に required gate で blocking）。`if: always()` 化は将来検討事項として Phase 12 unassigned-task 候補化 |
| legacy cleanup 未完了で strict が常に fail | 前提条件として cleanup 完了を Phase 5 ランブック先頭で require。未完了時は実装着手しない |

## 完了条件

- [ ] この Phase の判断・手順・成果物が index.md の AC と矛盾しない。
- [ ] strict 0 violations 未達時は blocking CI gate を有効化しない。
- [ ] 必要な evidence または blocker 記録が outputs 配下に保存されている。

## 出力

- outputs/phase-03/main.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-394-stablekey-strict-ci-gate |
| phase | 3 |
| taskType | implementation / NON_VISUAL |
| state | spec_created / blocked_by_legacy_cleanup |

## 目的

Phase 3: 設計レビュー の目的は、strict stableKey CI gate を legacy cleanup 完了後に安全に有効化できるよう、現行 blocker と実行条件を矛盾なく固定すること。

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

- 対応する `outputs/phase-03/` 配下に実測または blocked-state evidence を保存する。
- 実装前提が満たされない場合は `BLOCKED_BY_LEGACY_CLEANUP` として記録し、PASS と誤記しない。

## 統合テスト連携

NON_VISUAL。UI screenshot は不要。主な検証は `pnpm lint:stablekey:strict`、command trace、branch protection snapshot、Phase 12 strict 7 files の実体確認で行う。
