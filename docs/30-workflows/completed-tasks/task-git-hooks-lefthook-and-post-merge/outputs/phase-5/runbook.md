# Phase 5 — runbook.md

## Status

completed

## 概要

後続 `feat/git-hooks-lefthook-migration` 実装タスクの作業順序・検証コマンド・rollback 手順を確定する。実装は本タスクスコープ外。

## 前提

- 作業ブランチ: `feat/git-hooks-lefthook-migration`（本タスクで作成）
- Node 24 / pnpm 10（`mise exec --` 経由）
- 既存 `.git/hooks/{pre-commit, post-merge}` の現行内容は git 管理外のため、作業ツリーから直接コピーで退避する

## ステップ

### Step 1 — lefthook 依存追加

```bash
mise exec -- pnpm add -D -w lefthook
```

`package.json` に以下を追記:

```jsonc
{
  "scripts": {
    "prepare": "lefthook install",
    "indexes:rebuild": "node .claude/skills/aiworkflow-requirements/scripts/generate-index.js"
  },
  "devDependencies": {
    "lefthook": "^1.7.0"
  }
}
```

検証:

```bash
mise exec -- pnpm install
mise exec -- pnpm exec lefthook version
```

### Step 2 — `lefthook.yml` 配置

リポジトリルートに `lefthook.yml` を新規作成。内容は `outputs/phase-2/design.md` セクション 1 をそのまま使う。

検証:

```bash
mise exec -- pnpm exec lefthook validate    # 設定構文チェック
mise exec -- pnpm exec lefthook dump        # 解決後の lane 一覧確認
```

### Step 3 — 移植スクリプト配置

```bash
mkdir -p scripts/hooks
# 旧 .git/hooks/pre-commit → scripts/hooks/staged-task-dir-guard.sh
# 旧 .git/hooks/post-merge の通知部分のみ → scripts/hooks/stale-worktree-notice.sh
chmod +x scripts/hooks/*.sh
```


検証:

```bash
bash scripts/hooks/staged-task-dir-guard.sh                # exit 0 期待
bash scripts/hooks/stale-worktree-notice.sh post-merge     # 通知のみ
git status --porcelain | grep -F 'indexes/' && echo FAIL || echo PASS
```

### Step 4 — `.gitignore` 追記

```diff
+ # lefthook 開発者個別 override
+ lefthook-local.yml
```

### Step 5 — 既存 `.git/hooks/*` の置換タイミング

`pnpm install` の `prepare` script が `lefthook install` を起動すると、既存 `.git/hooks/{pre-commit, post-merge}` は lefthook 製の薄いラッパに **自動で上書き** される。明示削除は不要。

検証:

```bash
head -1 .git/hooks/pre-commit | grep -q lefthook && echo OK
head -1 .git/hooks/post-merge | grep -q lefthook && echo OK
```

### Step 6 — 既存 30+ worktree への再インストール

```bash
# (1) 全 worktree をリストアップ（prunable / detached HEAD はスキップ）
git worktree list --porcelain | awk '/^worktree /{print $2}' > /tmp/wts.txt

# (2) 各 worktree で lefthook install
while read -r wt; do
  test -d "$wt" || continue
  ( cd "$wt" && mise exec -- pnpm install --prefer-offline && mise exec -- pnpm exec lefthook install )
done < /tmp/wts.txt

# (3) 検証: 各 .git/worktrees/<name>/hooks/post-merge が lefthook 由来であること
find .git/worktrees -maxdepth 3 -name post-merge -exec head -1 {} \; | grep -c lefthook
```

> **注意**: 並列実行は `xargs -P` ではなく逐次にする。`pnpm install` が同 store に同時書き込みすると壊れる。

### Step 7 — `scripts/new-worktree.sh` への追加

末尾近くに以下を追記:

```bash
# lefthook を新 worktree にも install
mise exec -- pnpm exec lefthook install
```

検証: 新規ダミー worktree を作成し、`.git/worktrees/<dummy>/hooks/post-merge` が lefthook 製であることを確認後、削除。

### Step 8 — 結合検証（実装タスク完了前の必須）

`outputs/phase-4/test-matrix.md` の TC-PRE / TC-PMG / TC-PFT / TC-INST を上から順に流す。

```bash
mise exec -- pnpm exec lefthook run pre-commit --files "$(git diff --cached --name-only)"
mise exec -- pnpm exec lefthook run post-merge
git merge origin/main --no-edit --no-ff   # 副作用確認用（dry な branch で）
git status --porcelain | grep -F 'indexes/' && echo FAIL || echo PASS
```

## Rollback 手順

問題発生時は次の順で巻き戻す。

```bash
# (1) lefthook.yml と scripts/hooks/*.sh を削除
git rm -f lefthook.yml
git rm -rf scripts/hooks

# (2) package.json の lefthook 依存と prepare/indexes:rebuild を削除
#     （手動編集 → pnpm install）

# (3) .gitignore から lefthook-local.yml を削除

# (4) 旧 .git/hooks/* を退避コピーから復元
cp /path/to/backup/pre-commit  .git/hooks/pre-commit
cp /path/to/backup/post-merge  .git/hooks/post-merge
chmod +x .git/hooks/{pre-commit,post-merge}

# (5) 全 worktree でも同様に旧 hook を再配置
#     （Step 6 と同じループで .git/worktrees/<name>/hooks へコピー）
```

> **退避バックアップ**: Step 1 着手時に `cp -r .git/hooks /tmp/git-hooks-backup-$(date +%Y%m%d)` を必ず取る。

## 想定外ケース

| ケース | 対応 |
| --- | --- |
| `pnpm install` 中に `lefthook` のダウンロードが失敗 | proxy / npmrc 確認。`pnpm config get registry` |
| Apple Silicon で `lefthook` バイナリが起動しない | `pnpm rebuild lefthook` で arch 再選択 |
| 既存 worktree で `pnpm install` が壊れる | `mise exec -- pnpm install --force` |
| `lefthook install` が `.git/hooks/*` を書けない | `.git/hooks/` に古い実行不能ファイルが残存 → `chmod 644` で固定後に再実行 |

## 完了条件チェック

- [x] 新規 / 修正 / 削除パス一覧を明記
- [x] Step 1〜8 の手順と検証コマンドを記載
- [x] 既存 30+ worktree への一括再インストール手順を記載
- [x] Rollback 手順を記載
- [x] バックアップ取得タイミングを明示
