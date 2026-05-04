# Phase 1: 要件定義

## 目的

03a AC-7 を「warning mode + 規約担保」から「required CI gate での strict 0 violation」に昇格させる要件を確定する。

## 真の論点

- 既存 `ci` job 内に step を追加するか、別 job を立てるか（required context 名 drift 回避を最重視）
- legacy cleanup 0 violation 達成と本タスクの実装順序
- branch protection は変更しないが、required_status_checks の現行 `contexts` 名で drift がないこと

## 4 条件評価

| 条件 | 内容 |
| --- | --- |
| 価値 | 不変条件 #1 を CI レベルで静的に保護、AC-7 fully enforced 化 |
| 実現 | 既存 `pnpm lint:stablekey:strict` を ci.yml step として追加するのみ |
| 整合 | 03a workflow / aiworkflow-requirements / branch protection 正本と整合 |
| 運用 | 開発者 DX（local 同コマンド）/ rollback（step 削除）容易 |

## artifacts.json metadata

```json
{
  "taskType": "implementation",
  "visualEvidence": "NON_VISUAL",
  "workflow_state": "spec_created"
}
```

## AC（再掲）

index.md AC-1〜AC-7 を本 Phase で確定とする。

## 完了条件

- [ ] この Phase の判断・手順・成果物が index.md の AC と矛盾しない。
- [ ] strict 0 violations 未達時は blocking CI gate を有効化しない。
- [ ] 必要な evidence または blocker 記録が outputs 配下に保存されている。

## 出力

- outputs/phase-01/main.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-394-stablekey-strict-ci-gate |
| phase | 1 |
| taskType | implementation / NON_VISUAL |
| state | spec_created / blocked_by_legacy_cleanup |

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

- 対応する `outputs/phase-01/` 配下に実測または blocked-state evidence を保存する。
- 実装前提が満たされない場合は `BLOCKED_BY_LEGACY_CLEANUP` として記録し、PASS と誤記しない。

## 統合テスト連携

NON_VISUAL。UI screenshot は不要。主な検証は `pnpm lint:stablekey:strict`、command trace、branch protection snapshot、Phase 12 strict 7 files の実体確認で行う。
