# Phase 12 Task 4: 未タスク検出レポート

`[実装区分: implementation]` / status: `implemented_local_runtime_pending`

## current（本タスクで生じた残課題）

**新規未タスク: 0 件。**

本ワークフローは #1027 の本来スコープ（動的 member OG の OG 専用 Worker 分離）を 1 実装サイクルで完了できる粒度に収めている（CONST_007）。Paid plan 分岐はユーザー決定により不採用＝先送りではなく除外。

## baseline（既存・関連タスク差分確認）

| 候補 | 既存タスク差分 | 判定 |
|------|----------------|------|
| 元 unassigned `member-dynamic-og-paid-or-worker-split`（#1027） | 本ワークフローが実装仕様書として具体化 | **本タスクに統合**。重複起票しない。Issue は OPEN 維持 |

## 将来候補（今回スコープ外・先送り理由を明記）

> 以下は **今回サイクルの AC を満たすには不要**で、独立スコープのため将来候補。CONST_007 の「独立した大規模/別関心」に該当。起票はユーザー承認後（本サイクルでは起票しない）。

| 候補 | 内容 | 先送り理由 |
|------|------|-----------|
| OG フォント subset 最適化 | Noto Sans JP の字形を更に絞り bundle を縮小 | 初回は単一 subset で 3MiB 内に収まれば AC 達成。最適化は独立した計測タスク |
| OG 画像 A/B 意匠改善 | 配色・レイアウトのデザイン磨き込み | 機能完成後の意匠改善。デザイン正本（prototype）と別レーン |

## ソース別確認

| ソース | 結果 |
|--------|------|
| 元タスク仕様書「スコープ外」 | Paid plan（不採用）/ フォント最適化（将来候補）|
| Phase 3/10 レビュー MINOR | なし（implemented_local_runtime_pending 時点） |
| Phase 11 手動テスト | runtime pending（実行サイクルで再評価） |
| コードコメント TODO/FIXME | 該当なし（コード実装済み） |
| describe.skip | 該当なし |
