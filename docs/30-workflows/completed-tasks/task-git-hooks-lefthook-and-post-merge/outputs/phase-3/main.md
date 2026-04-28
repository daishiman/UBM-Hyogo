# Phase 3 — 設計レビュー

## Status

completed

## レビュー結論

**判定: GO**（Phase 4 へ進行可）

| 評価軸 | 結果 | 備考 |
| --- | --- | --- |
| 価値性 | PASS | 無関係 PR への indexes diff 混入を恒久的に解消。worktree hook 配布コスト低減。 |
| 実現性 | PASS | lefthook は実績ある OSS。設計上の新規実装は yaml 1 + shell 2 のみ。 |
| 整合性 | PASS | `.gitattributes merge=ours`、`scripts/new-worktree.sh`、CI 責務分離と矛盾なし。 |
| 運用性 | PASS | `prepare` script で auto-install。worktree 再インストール手順を runbook 化予定。 |

## 4 条件に対する評価

詳細は `outputs/phase-3/review.md` を参照。

- 価値: indexes 自動再生成廃止により毎マージで 2 ファイル diff が消える（直近 PR で実測の問題）。
- コスト: lefthook 1 依存追加・hook 移植 3 ファイル・runbook 1 本。実装規模は小。
- リスク: 既存 worktree への再インストール忘れ → Phase 5 runbook と Phase 11 manual smoke で担保。

## MINOR 指摘（Phase 4 への申し送り）

| ID | 指摘 | 対応方針 |
| --- | --- | --- |
| M-01 | `lefthook-local.yml` の `.gitignore` 追記が Phase 5 runbook に明示必要 | Phase 5 で記載 |
| M-02 | `prepare` script は既存 `package.json` に存在しないため新設 | Phase 5 で記載 |
| M-03 | post-merge 廃止後の代替コマンド `pnpm indexes:rebuild` 周知方法 | Phase 12 implementation-guide で説明 |
| M-04 | CI 側 `verify-indexes-up-to-date` job 新設は本タスクスコープ外 | Phase 12 unassigned-task-detection で派生タスク化 |

## ブロッカー

なし。

## Phase 4 への引き継ぎ事項

1. テスト設計時、lefthook 動作確認は `lefthook run pre-commit --files <staged>` の dry-run で行う（実 commit 不要）。
2. post-merge 通知 lane は副作用なし（read-only）のため、テストは出力 grep で十分。
3. NON_VISUAL タスクのため screenshot evidence は不要。
