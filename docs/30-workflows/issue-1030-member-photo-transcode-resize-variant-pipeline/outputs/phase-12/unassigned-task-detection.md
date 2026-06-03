# 未タスク検出レポート — issue-1030

## サマリ

| 区分 | 件数 |
|------|------|
| current（本タスク scope 内の残課題） | 0 |
| baseline（別レーン・既存 issue で管理） | 3 |
| 新規未タスク化（本サイクルで起票推奨） | 0（M-1 は判定の結果 not now） |

## 関連タスク差分確認（重複起票防止）

| 候補 | 既存タスク | 重複 | 判定 |
|------|-----------|------|------|
| 公開メンバー表示での thumb 露出 | #1029 followup-002 | あり | 起票しない（別レーン） |
| member self upload | #1031 followup-001 | あり | 起票しない（OPEN） |
| Google Form schema | #983 invariant | — | 実施しない |

## current 残課題（scope 内）

なし。Phase 1-13 で admin variant pipeline は 1 サイクル完結スコープに収めた（CONST_005 / workflow-local CONST_007）。

## MINOR 仕分け（Phase 3 / Phase 10）

| # | 指摘 | 未タスク化判定 |
|---|------|----------------|
| M-1 | content_hash による R2 dedup / 同一画像 put skip | **not now**。本タスクは hash 記録のみで機能完結。dedup は現在の受入条件では要求されず、追加すると R2 削除・audit・同一画像共有時の所有境界が増えて過剰設計になるため、今回の改善対象ではない。 |
| M-2 | 公開 thumb 露出 | #1029 に委譲（重複起票しない） |
| M-3 | retina 2x variant | over-scope（不採用） |

## baseline 参考

repo 全体の既存 unassigned（#1029/#1031 等）は本タスクと責務分離済み。本タスク由来の新規 baseline 違反は 0。
