---
name: lessons-learned-sync-merge-hook-skip
description: sync-merge (main 取り込み) 時に pre-commit/pre-push hook が構造的に誤検知する問題への solo dev 運用ポリシー
type: lessons-learned
date: 2026-04-30
related-task: branch-sync-and-push (sync-merge hook policy)
---

# sync-merge 時の hook 自動スキップ運用

## 背景

`branch-sync-and-push` プロンプトで main を feature ブランチへ sync-merge する運用において、以下 2 hook が構造的に誤検知する問題が発生した:

- `pre-commit` `staged-task-dir-guard.sh`: main 取り込みでブランチ slug と無関係なタスク dir が必ず混入するため fail
- `pre-push` `coverage-guard.sh`: 他タスクのコード追加で一時的に coverage が閾値を下回ると fail

両者とも feature コミット/push には有効だが、sync-merge では構造的な誤検知になる。

## 結論 (個人開発運用ポリシー)

両 hook はマージコミット時に **自動でスキップ** する。`--no-verify` 常用は避ける。

| hook | スキップ条件 | 実装 |
|------|-------------|------|
| `staged-task-dir-guard.sh` | `$GIT_DIR/MERGE_HEAD` / `CHERRY_PICK_HEAD` / `REVERT_HEAD` のいずれか存在 | 早期 `exit 0` |
| `coverage-guard.sh` (--changed) | `git log --merges @{u}..HEAD` が 1 件以上 (push 範囲に merge commit) | 早期 `exit 0` |

## 教訓 (Lesson IDs)

- **L-SMHS-001**: pre-commit/pre-push hook を導入する際は **merge / cherry-pick / revert 進行中の挙動** を必ず仕様化する。特に sync-merge ではブランチ単位の前提が崩れる
- **L-SMHS-002**: hook 誤検知に対して `--no-verify` を常用するのは負けパターン。hook 側に「正当なスキップ条件」を実装し、`--no-verify` は緊急脱出口に限定する
- **L-SMHS-003**: solo dev 運用では「hook が誤検知する状況の自動スキップ」を hook 設計の正本要件として明記する。多人数 dev では CI 側でカバーするためこのスキップは引き上げない判断もありうる
- **L-SMHS-004**: branch-sync-and-push のような自動同期プロンプトと hook 設計はセットで考える。プロンプトが Red List で `--no-verify` を禁止しているのに hook が必ず fail する状況は構造矛盾
- **L-SMHS-005**: マージ commit 検出は `MERGE_HEAD` の存在 (進行中) と `git rev-list --parents -n 1 HEAD` (完了済み) の 2 系統がある。pre-commit は前者、pre-push は後者を使い分ける

## 関連

- `CLAUDE.md` § sync-merge 時の hook 挙動
- `docs/00-getting-started-manual/lefthook-operations.md` § sync-merge 時の hook 自動スキップ
- `scripts/hooks/staged-task-dir-guard.sh`
- `scripts/coverage-guard.sh`
