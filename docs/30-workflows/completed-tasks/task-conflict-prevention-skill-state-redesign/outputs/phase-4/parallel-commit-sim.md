# 4 worktree 並列 commit シミュレーション (AC-5)

## 目的

4 worktree が同一 main 派生で並走し、`.claude/skills/` 配下の ledger を同時に触る状況を
再現し、A-1〜B-1 適用前後の衝突挙動を観測する。

## 前提

- 作業ルート: リポジトリルート（worktree 親）
- 検証ブランチ: `verify/skill-conflict-<施策状態>` を main から派生
- 4 worktree: `wt-1`〜`wt-4` を `.worktrees/sim-wtN` に作成

## 各 worktree の操作役割

| worktree | ブランチ | 触る ledger | 方法 |
| --- | --- | --- | --- |
| wt-1 | `sim/wt-1` | `aiworkflow-requirements/indexes/keywords.json` | hook 自動再生成（A-1 検証） |
| wt-2 | `sim/wt-2` | `aiworkflow-requirements/LOGS/...` | fragment 1 件生成（A-2 検証） |
| wt-3 | `sim/wt-3` | `aiworkflow-requirements/LOGS/...` | 異 timestamp の別 fragment 生成 |
| wt-4 | `sim/wt-4` | `aiworkflow-requirements/LOGS.md` (legacy) | 行独立な末尾追記（B-1 検証） |

## 再現手順 (bash)

```bash
# 1. main から派生して 4 worktree を作成
git checkout main && git pull --ff-only
for n in 1 2 3 4; do
  bash scripts/new-worktree.sh sim/wt-$n
done

# 2. wt-1: hook で keywords.json を再生成（A-1 適用後は git tree に出ない想定）
( cd .worktrees/sim-wt1 && \
  node .claude/skills/aiworkflow-requirements/scripts/generate-index.js && \
  git add -A && git commit -m "wt1: regenerate index" --allow-empty )

# 3. wt-2 / wt-3: fragment 自動生成（異なる timestamp）
for n in 2 3; do
  ( cd .worktrees/sim-wt$n && \
    pnpm skill:logs:append --skill aiworkflow-requirements --kind log && \
    git add .claude/skills/aiworkflow-requirements/LOGS && \
    git commit -m "wt-$n: log fragment" )
done

# 4. wt-4: legacy LOGS.md に末尾追記（B-1 merge=union 検証）
( cd .worktrees/sim-wt4 && \
  printf -- '- entry from wt4\n' >> .claude/skills/aiworkflow-requirements/LOGS.md && \
  git commit -am "wt-4: legacy ledger append" )

# 5. main で順次 merge
git checkout main
for n in 1 2 3 4; do
  git merge --no-ff sim/wt-$n -m "merge sim/wt-$n"
  echo "exit=$?"
  git ls-files --unmerged
done
```

## 観測する成果物

| 観測項目 | 取得コマンド | A-1〜B-1 適用前 | 適用後 (期待) |
| --- | --- | --- | --- |
| `git merge` 終了コード | `echo $?` | wt-2 以降で 1 (CONFLICT) | 全マージ 0 |
| 未マージファイル | `git ls-files --unmerged` | `LOGS.md` / `keywords.json` 等が列挙 | 0 行 |
| CONFLICT 出力 | `git merge` stderr | `CONFLICT (content): ... LOGS.md` | なし |
| ツリー差分 | `git diff --stat HEAD~4..HEAD` | 同一ファイル多数 | 全て別 fragment ファイル |

## 期待値サマリ

- **適用前**: wt-2 と wt-3 が同じ `LOGS.md` 末尾に追記するため衝突。
  `keywords.json` の `totalKeywords` カウンタも全 worktree で衝突。
- **適用後**:
  - wt-1 の `keywords.json` は gitignore で git tree に現れない (A-1)
  - wt-2 / wt-3 は独立 fragment のため別ファイル (A-2)
  - wt-4 の `LOGS.md` 追記は `merge=union` で両保存 (B-1)
  - すべて非衝突マージとなる

## クリーンアップ

```bash
git checkout main
for n in 1 2 3 4; do
  git worktree remove .worktrees/sim-wt$n --force
  git branch -D sim/wt-$n
done
```
