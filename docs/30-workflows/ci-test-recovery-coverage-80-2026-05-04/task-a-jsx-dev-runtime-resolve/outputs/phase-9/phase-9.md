# Phase 9: 品質検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task | Task A (jsx-dev-runtime 解決) |
| Phase | 9 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 上流ブロッカー | なし（wave-1 起点、Task B と並列） |

## 目的

jsx-dev-runtime 解決 の Phase 9（品質検証）を実行する。本 Phase は親 wave `outputs/phase-{1,2,3}/` 設計書に従い、Phase 8 の成果物を入力とし、Phase 10 へ引き継ぐ。

## 実行タスク

- タスク 1: Phase 9 の入力（Phase 8 成果物 / 親 wave 設計書）の整合確認
- タスク 2: Phase 9 固有の作業実施（下記「実行手順」参照）
- タスク 3: 成果物を `outputs/phase-9/` 配下に出力
- タスク 4: 完了条件チェックリストの全項目確認

## 参照資料

| 参照 | パス |
| --- | --- |
| 親 wave Phase 1 | `../../../outputs/phase-1/phase-1-requirements.md` |
| 親 wave Phase 2 | `../../../outputs/phase-2/phase-2-design.md` |
| 親 wave Phase 3 | `../../../outputs/phase-3/phase-3-architecture.md` |
| 本タスク index | `../../index.md` |
| 既存 wave 参考 | `../../../../ut-coverage-2026-05-wave/README.md` |

## 実行手順

```bash
# 品質検証 4 項目
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test
bash scripts/coverage-guard.sh
```


## 統合テスト連携

Phase 9 の成果は親 wave `outputs/phase-3/phase-3-architecture.md` の依存グラフに従い、後続タスクの統合テスト入力となる。

## 多角的チェック観点（AI が判断）

- システム系: CI / ローカル両環境で同一結果か
- 戦略系: スコープ拡大の防止（CONST_007 遵守）
- 問題解決系: 真因への対処になっているか（症状緩和に逃げていないか）

## サブタスク管理

- [ ] 入力整合性確認（Phase 8 成果物）
- [ ] Phase 9 固有作業の完了
- [ ] 成果物 `outputs/phase-9/` 配置
- [ ] 完了条件全項目チェック

## 成果物

- `outputs/phase-9/phase-9.md`（本ファイル）
- Phase 9 固有 evidence（上記実行手順で生成）

## 完了条件

- [ ] coverage Statements/Branches/Functions/Lines >=80%（apps/api / apps/web / packages/* 全パッケージ）
- [ ] `bash scripts/coverage-guard.sh` exit 0
- [ ] Phase 9 固有作業の DoD 達成
- [ ] 成果物が `outputs/phase-9/` に配置されている

## タスク 100% 実行確認【必須】

- [ ] 全実行タスク完了
- [ ] 全成果物作成
- [ ] 完了条件全項目チェック完了

## 次 Phase

Phase 10 に進む（Phase 13 の場合は本タスク完了）。
