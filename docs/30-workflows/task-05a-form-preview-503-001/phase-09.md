# Phase 9: 品質保証 — task-05a-form-preview-503-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-05a-form-preview-503-001 |
| phase | 9 / 13 |
| wave | 05a-followup |
| mode | sequential |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

CONST_005 の品質ゲート（typecheck / lint / test）を全件 green で通過させ、line budget・link 健全性・mirror parity（`docs/30-workflows/<task>/` と `outputs/`、`artifacts.json` Phase 一覧の整合）を実測する。

## 実行タスク

1. typecheck / lint / API test を実行する。完了条件: 全 green、失敗時はログを記録し最大 3 回まで自動修復する。
2. `docs/30-workflows/task-05a-form-preview-503-001/` 配下の line budget（CONST_005: phase-NN.md ≤ 200 行 / outputs ≤ 400 行）と Markdown link 健全性を確認する。完了条件: 違反 0 件。
3. `artifacts.json` の Phase 一覧と outputs/ 実体ファイル一覧の parity を確認する。完了条件: 差分 0。

## 参照資料

- `docs/30-workflows/task-05a-form-preview-503-001/index.md`
- `docs/30-workflows/task-05a-form-preview-503-001/artifacts.json`
- `outputs/phase-08/main.md`
- `packages/shared/src/errors.ts`

## 実行手順

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/api test -- --coverage
```

- 仕様書作成段階では **コマンド実行をしない**。実装サイクルで実測値を本 Phase outputs に記録する。
- 実測時、coverage は `apps/api/src/use-cases/public/get-form-preview.ts` について Statements ≥85% / Branches ≥80% / Functions ≥85% / Lines ≥85% を目標とする。

## 統合テスト連携

- 上流: Phase 8 リファクタリング
- 下流: Phase 10 最終レビュー

## 多角的チェック観点

- 不変条件 #1 / #5 / #14 の遵守
- 未実装 / 未実測を PASS と扱わない
- placeholder と実測 evidence を分離する

## サブタスク管理

- [ ] typecheck green の証跡
- [ ] lint green の証跡
- [ ] API test green の証跡（PASS 件数を記録）
- [ ] coverage 閾値達成
- [ ] line budget / link / mirror parity OK
- [ ] outputs/phase-09/main.md を作成する

## 成果物

- `outputs/phase-09/main.md`

## 完了条件

- 三点 gate green
- coverage 閾値達成
- artifacts.json と outputs/ の parity 一致

## タスク100%実行確認

- [ ] 必須セクションすべて埋まっている
- [ ] 仕様書段階で実コマンド実行を行っていない
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 10 へ、品質ゲート結果サマリと残課題（あれば）を渡す。
