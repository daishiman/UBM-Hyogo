# Phase 10: 統合レビュー — サマリー

## 概要

Phase 1〜9 の成果物を「実装タスクへ引き渡せる仕様書として完結しているか」の観点で
最終レビューした。本ファイルは 4 観点レビューと **4 施策間の相互依存**を整理する。
Go / No-Go の最終判定は `go-no-go.md` に分離する。

## 4 観点レビュー結果

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 完全性 | PASS | phase-01〜13 / outputs / artifacts.json が全て揃い、AC-1〜AC-9 が trace 可能 |
| 並列開発の衝突消滅性 | PASS | A-1 で再生成物を git 外に追放、A-2 で append-only の 1 ファイル 1 worktree 化、B-1 は暫定で union merge、A-3 で SKILL.md 肥大化を予防 |
| 後方互換性 | PASS | 既存 LOGS.md は `_legacy/` へ退避し history 保持、hook はガード `[[ -f target ]] || regenerate` で gitignore 対象も成立 |
| 運用性 | PASS | render script は pnpm + Node 24 で動作、各ランブックにロールバック手順あり、無料枠内 |

## 4 施策間の相互依存マトリクス

| 施策 | 依存元 | 依存先 | 関係 |
| --- | --- | --- | --- |
| A-1 (gitignore 化) | A-2 | — | LOGS.md は両者の対象。A-1 単独適用すると history が消える |
| A-2 (fragment 化) | — | A-1 / B-1 | A-2 完了後は B-1 が不要となる対象が増える |
| A-3 (Progressive Disclosure) | — | — | 独立。SKILL.md 単体の問題 |
| B-1 (merge=union) | — | A-2 | **暫定策**。A-2 移行までのつなぎとして fragment 化不可ファイルに継続適用 |

## 重複対象の処理順序

### LOGS.md は A-1 と A-2 の両対象

| 順序 | 結果 | 安全性 |
| --- | --- | --- |
| A-1 → A-2 | LOGS.md を gitignore してから fragment 化 | **NG**: 既存 history が `_legacy` 退避前に追跡対象外になる |
| **A-2 → A-1** | fragment 化で履歴を `LOGS/<…>.md` に分散させてから旧 LOGS.md を gitignore | **OK**: 採用。go-no-go.md で正式化 |

### keywords.json / index-meta.json

A-1 のみの対象（自動カウンタで履歴価値なし）。A-2 / B-1 の対象外。
A-3 とも独立。順序制約なし。

### SKILL.md

A-3 のみの対象。A-1 / A-2 / B-1 と独立。

## B-1 と A-2 の関係（剥がし方の道筋）

1. 初期: B-1 で `.gitattributes` に `*.md merge=union` を ledger 限定で適用
2. A-2 移行完了後: 当該ファイルが「fragment 集約 view（git 管理外）」となるため
   `.gitattributes` から該当行を削除する手順を Phase 7 gitattributes-runbook.md に明記
3. 残存対象: A-2 を適用できない formal な append-only ledger（あれば）に対して
   B-1 を **継続**適用する

## 残存リスク

| # | リスク | 緩和策 | 残存度 |
| --- | --- | --- | --- |
| R-10-1 | 別タスク（実装）でロールバック手順が機能するかは未検証 | Phase 11 手動テストで実装後検証 | 中 |
| R-10-2 | hook の gitignore ガードが OS 差異で挙動違いの可能性 | macOS / Linux 両方で Phase 11 実行 | 低 |
| R-10-3 | render script 未実装段階で B-1 を剥がしすぎると衝突再燃 | gitattributes-runbook.md の剥がし条件を A-2 完了後に限定 | 低 |

## 結論

4 観点全て PASS / 相互依存解消済み / 残存リスクは別タスク側で吸収可能 →
**Go 判定**（詳細は go-no-go.md）。
