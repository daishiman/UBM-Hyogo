# Phase 9: ローカル実行・検証コマンド

## 必須実行コマンド（実装者向け）

```bash
# 1. ブランチに入る
git checkout feat/branch-flow-dev-sync

# 2. 構文チェック
bash -n scripts/new-worktree.sh

# 3. dev/main 同期確認
git fetch origin
git rev-list --left-right --count origin/main...origin/dev   # 期待: 0  0（remote sync）
git rev-list --left-right --count origin/dev...HEAD          # 期待: 0  N（本ブランチのPR差分）

# 4. branch protection 確認
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print("force_push:", d["allow_force_pushes"]["enabled"])'
# 期待: force_push: False

# 5. CLAUDE.md / diff-to-pr.md 整合
grep -nE 'git merge origin/main|git fetch origin main|git diff main\\.\\.\\.HEAD|--base main' .claude/commands/ai/diff-to-pr.md
# 期待: 0 件
grep -nE 'git merge origin/main|git fetch origin main|git diff main\\.\\.\\.HEAD' CLAUDE.md
# 期待: 0 件（dev → main 昇格説明の --base main は許容）

# 6. 品質検証（プロジェクト共通）
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## デプロイ確認（PR マージ後）

```bash
# dev にマージされた直後の CD を観察
gh run watch --exit-status $(gh run list --branch dev --workflow=backend-ci --limit 1 --json databaseId -q '.[0].databaseId')
gh run watch --exit-status $(gh run list --branch dev --workflow=web-cd --limit 1 --json databaseId -q '.[0].databaseId')
```

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

ローカル実行コマンドを固定する。

## 実行タスク

syntax、remote sync、branch protection、stale grep、品質検証を定義する。

## 参照資料

`scripts/new-worktree.sh`、GitHub Actions workflows。

## 成果物

検証コマンド一覧。

## 完了条件

remote sync と feature delta を別々に確認できる。

## 統合テスト連携

Phase 11 evidence と Phase 13 runtime gate に接続する。
