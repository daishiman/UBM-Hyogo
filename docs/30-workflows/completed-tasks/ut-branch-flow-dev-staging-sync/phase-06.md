# Phase 6: 関数・モジュールシグネチャ

## scripts/new-worktree.sh

シェルスクリプト（関数化なし）。

```bash
# 入力: $1 = ブランチ名 (例: feat/my-feature)
# 副作用: .worktrees/task-<TS>-wt/ を origin/dev から作成、pnpm install 実行
# 出力: stdout に進捗メッセージ
```

差分（unified diff 概要）:

```diff
- # リモートmainを最新化
- git fetch origin main
-
- # ワークツリー作成（mainから分岐）
- git worktree add -b "$BRANCH" "$WT_PATH" origin/main
+ # リモートdevを最新化（feature/* は dev から分岐する運用 — feature → dev → main フロー）
+ git fetch origin dev
+
+ # ワークツリー作成（devから分岐）
+ git worktree add -b "$BRANCH" "$WT_PATH" origin/dev
```

## CLAUDE.md（PR作成フロー section）

差分要点:

- 「目的と絶対原則」の `main` 参照を `dev` に置換
- 新規 subsection「dev → main 昇格」を追加
- コンフリクト解消方針表の `main` を `dev` に置換
- `git diff main...HEAD` → `git diff dev...HEAD`

## .claude/commands/ai/diff-to-pr.md

差分要点（全て replace_all 適用）:

- `git fetch origin main` → `git fetch origin dev`
- `git merge origin/main --no-edit` → `git merge origin/dev --no-edit`
- `git commit -m "merge: resolve conflicts with origin/main"` → `... origin/dev`
- `gh pr create ... --base main` → `--base dev`

> 注: 残存する `main` 文字列（旧 changelog 行 / `main` ブランチ説明文）は意図的に保持。

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

変更シグネチャを最小単位で示す。

## 実行タスク

script / docs / command の変更要点を記録する。

## 参照資料

`scripts/new-worktree.sh`、`CLAUDE.md`、`.claude/commands/ai/diff-to-pr.md`。

## 成果物

差分要点表。

## 完了条件

operational command が `dev` に統一されている。

## 統合テスト連携

Phase 11 の stale `main` grep に接続する。
