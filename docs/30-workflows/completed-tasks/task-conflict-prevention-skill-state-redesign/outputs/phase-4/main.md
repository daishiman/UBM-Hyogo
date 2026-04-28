# Phase 4 成果物 — テスト設計総括

## 目的

A-1 / A-2 / A-3 / B-1 適用後に「並列 commit が衝突 0 件で merge できる」ことを
確認するための **手順書** と **ケース集** を Phase 4 内で固定する。
本タスクは docs-only / NON_VISUAL のため自動テストは書かず、Phase 11 の手動検証を
実行可能な粒度で記述する。

## 成果物 index

| ファイル | 役割 | 主な対応 AC |
| --- | --- | --- |
| `parallel-commit-sim.md` | 4 worktree 並列 commit シミュレーション再現手順 | AC-5 |
| `merge-conflict-cases.md` | C-1〜C-7 ケース別期待表 | AC-5 / AC-6 |
| `main.md` (本ファイル) | Phase 4 概観 / トレース | — |

## 検証戦略概要

| 戦略 | 観点 | 期待 |
| --- | --- | --- |
| 戦略 1: 並列 commit シミュレーション | 4 worktree (wt-1〜wt-4) が同一 main 派生で同時に ledger を触る | merge コンフリクト 0 件 |
| 戦略 2: ケース別 (C-1〜C-7) | 各 ledger × 各施策の組み合わせ | ケースごとの期待値どおり |
| 戦略 3: 後方互換 | `LOGS.md` → `LOGS/_legacy.md` 退避後の render 整合 | 旧履歴も出力に含まれる |

## AC トレース

| AC | 検証ファイル | 観測点 |
| --- | --- | --- |
| AC-5 | `parallel-commit-sim.md` | `git merge --no-ff` の戻り値と CONFLICT 行の有無 |
| AC-6 | `merge-conflict-cases.md` C-1〜C-7 | 各ケースの判定欄 |
| AC-8 | 戦略 3（backward-compat.md へ委譲） | render 出力に legacy 含まれること |

## 観測コマンド共通仕様

| コマンド | 期待 |
| --- | --- |
| `git status --porcelain` | 観測対象以外の差分が出ない |
| `git merge --no-ff <branch>` | 終了コード 0、`CONFLICT` 出力なし |
| `git diff --check` | trailing whitespace / 未解決 marker なし |
| `git ls-files --unmerged` | 0 行 |

## 前提条件

- Node 24 / pnpm 10（mise 経由）
- A-1 / A-2 / A-3 / B-1 が **実装後** であること（本仕様書はその実装が参照する）
- worktree は `scripts/new-worktree.sh` で同一 main HEAD から派生

## ゲート条件

Phase 5 へ進めるのは、各シナリオに「セットアップ・観測コマンド・期待値」の三点が
コマンドレベルで揃っていることを確認できたときのみ。

## Phase 11 への引き継ぎ

- 本フェーズで固定した手順を Phase 11 `manual-smoke-log.md` でそのまま実行
- 各 step の標準出力をログに転記して証跡化
