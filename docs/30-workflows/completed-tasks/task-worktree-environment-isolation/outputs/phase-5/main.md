# Phase 5: 実装ランブックサマリ — task-worktree-environment-isolation

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 5（実装ランブック） |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |
| 入力 | `outputs/phase-2/design.md`、`outputs/phase-3/review.md`、`outputs/phase-4/test-matrix.md` |
| 出力 | `outputs/phase-5/main.md`（本書）、`outputs/phase-5/runbook.md` |

## 1. ランブックの位置付け

本タスクは **docs-only / spec_created** であり、本 Phase で生成するランブックは **後続実装タスクが参照する手順書**である。本 Phase 自身ではコード変更・コミット・PR 作成は行わない。

ランブックは以下の単位で構成する。

1. 事前確認（環境前提・既存状態のスナップショット）
2. D-1: skill symlink 撤去
3. D-2: tmux session-scoped state 設定
4. D-3: gwt-auto lock 実装（mkdir 正本 + flock optional）
5. D-4: shell state 分離（`PATH` / `mise` / 1Password トークン）
6. `scripts/new-worktree.sh` への変更手順
7. `.gitignore` 確認手順（C-2 対応）
8. 既存 worktree への遡及手順（C-6 対応）
9. ロールバック手順
10. 検証（Phase 4 test-matrix 参照）

## 2. Phase 3 申し送りの消化方針

| 申し送り | 本ランブックでの対応 |
| --- | --- |
| C-1 macOS の `flock(1)` 不在 | デフォルトを mkdir 方式とし、flock を opt-in。runbook §4 で両系統を併記 |
| C-2 `.gitignore` の `.worktrees/` 確認 | runbook §7 で確認コマンドと追記手順を明示 |
| C-3 既存 tmux 汚染 | runbook §3 で `tmux kill-session` / `kill-server` の cleanup 手順を記載 |
| C-6 既存 worktree への遡及 | runbook §8 で per-worktree 遡及手順を記載 |

## 3. 詳細ランブック

詳細は [`runbook.md`](./runbook.md) を参照。

## 4. 完了条件

- [x] artifacts.json の `outputs/phase-5/*` と一致する 2 ファイルが揃っている。
- [x] D-1〜D-4 すべての実装手順が runbook.md に記載されている。
- [x] flock 不在環境のフォールバックが runbook.md に明記されている。
- [x] `.gitignore` 確認手順、既存 worktree 遡及手順、ロールバック手順が記載されている。
- [x] 「実装は後続タスクで実施」「本タスクではコミット・PR 作成しない」を runbook.md 冒頭で明示している。
- [x] ユーザー承認なしの commit / push / PR 作成を行っていない。

## 5. 後続 Phase への申し送り

- Phase 6 失敗ケース拡充は runbook.md §4 のロック競合・stale・hostname 不一致を起点に拡張する。
- Phase 11 手動テストは runbook.md §10 検証コマンドの出力を `manual-smoke-log.md` に貼り付ける。
- Phase 12 documentation update は `CLAUDE.md` の「ワークツリー作成」セクションに runbook.md へのリンクを追加する案を検討する。
