# Phase 12: unassigned-task-detection（未タスク検出レポート）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase | 12 / 13 |
| 作成日 | 2026-04-28 |
| 出力義務 | **0 件でも本ファイルは出力必須**（baseline 記録のため空にしない） |

## 1. サマリ

| 項目 | 件数 |
| --- | --- |
| 本タスクから派生する **新規未タスク** | 0 |
| baseline 記録（不採用代替案） | 3（ALT-A / ALT-B / ALT-C） |
| 参考メモ（派生候補・既存に紐付く） | 1（N-01） |

> 本タスクは docs-only / runbook-spec のため、新規未タスクは検出されなかった。
> ただし Phase 3 で検討した代替案 A/B/C を **不採用 baseline** として保存し、
> 将来同種の議論が再燃した際の参照点として残す。

## 2. baseline 記録（Phase 3 代替案の不採用根拠）

| ID | 代替案 | 不採用理由 | baseline 用途 |
| --- | --- | --- | --- |
| ALT-A | GitHub Actions による全 worktree CI 検証 | CI 環境はローカル `.git/hooks/` を持たないため、本問題（30+ ローカル worktree への install ドリフト）を解けない。CI で見えるのは「indexes 鮮度」等の症状のみ | 将来「rare ローカル環境差異検出」が CI 範囲で必要になった際の参照点（その場合は `task-verify-indexes-up-to-date-ci` 系で別途扱う） |
| ALT-B | `git worktree` 全廃して per-clone 化 | コスト過大。既存 30+ worktree の作業を全てクローンに移行するのは現実的でなく、並列開発のディスク使用量・切替時間が悪化する。既存ワークフロー破壊 | clone モデル移行が必要になった際の比較材料 |
| ALT-C | post-merge を復活させて auto re-install | 上流 baseline タスク（`task-git-hooks-lefthook-and-post-merge`）の方針に逆行。無関係 PR への indexes diff 混入が再燃する。post-merge 廃止の根拠と矛盾 | 自動化要望が再燃した際の **却下根拠** として保存 |

## 3. 参考メモ（派生候補）

| ID | タイトル | 種別 | メモ |
| --- | --- | --- | --- |
| N-01 | `scripts/reinstall-lefthook-all-worktrees.sh` 実装 Wave + CI smoke | 派生候補（既知・index.md の依存関係表に記載済み） | 本 runbook 仕様書 Phase 2/5 で擬似スクリプトを specify 済み。実コード化は別 Wave で実施。本ファイルでは **新規** タスクとして起票しない（既存依存関係に含まれている） |

## 4. 新規タスク起票の判定

| 候補 | 起票要否 | 理由 |
| --- | --- | --- |
| 一括再 install スクリプト実装 | **不要**（既存依存関係に N-01 として既に認識済み） | index.md「依存関係」表に下流タスクとして記載済み |
| CI verify-indexes job 実装 | **不要** | 別タスク（`task-verify-indexes-up-to-date-ci`）として既に切り出し済み |
| `lefthook-operations.md` 差分追記実装 | **不要** | 本タスクの `system-spec-update-summary.md` に specify 済み。実装 Wave と同じ Wave で吸収可能 |

## 5. 結論

- 新規未タスクは **0 件**。
- baseline 記録（ALT-A / ALT-B / ALT-C）を本ファイルに保存した。
- 既存の派生候補 N-01 は index.md「依存関係」で既に追跡されているため重複起票しない。
