# B-1 実装ランブック — `.gitattributes` merge=union driver

## 位置付け

A-2 fragment 化が **完了するまでの暫定策**、および A-2 で fragment 化できない
履歴温存ファイル（`_legacy*.md` 等）に対し、Git の `merge=union` ドライバを当て、
両ブランチの追記行を機械的にマージして **衝突自体を発生させない**。

## Step 1 — 適用対象選定

「行レベル独立性」を満たすファイルのみ対象。判定基準:

| OK / NG | 条件 |
| --- | --- |
| OK | 各行が独立した意味を持つ（箇条書き log / lesson 行） |
| NG | YAML / JSON など構造体（行をまたぐ意味を持つ） |
| NG | front matter を持つ Markdown（fragment はそもそも対象外） |
| NG | コードファイル全般 |
| NG | lockfile (`pnpm-lock.yaml` 等) |
| NG | `SKILL.md` |

候補:

- `.claude/skills/**/LOGS.md` （A-2 移行前の旧 ledger）
- `.claude/skills/**/lessons-learned-*.md` （A-2 移行前）
- `.claude/skills/**/_legacy*.md` 等の履歴温存ファイル

## Step 2 — `.gitattributes` 追記内容

```diff
--- a/.gitattributes
+++ b/.gitattributes
@@
+# === skill ledger (B-1) — A-2 完了時に削除予定の暫定策 ===
+# 行レベル独立な append-only Markdown のみ対象。構造体・コードに付与禁止。
+.claude/skills/**/LOGS.md             merge=union
+.claude/skills/**/lessons-learned-*.md merge=union
+.claude/skills/**/_legacy*.md         merge=union
```

注釈:

- `merge=union` は Git ビルトイン driver。追加設定不要
- root の `CHANGELOG.md` は skill 範囲外のため **既定では対象外**

## Step 3 — 行レベル独立性チェック手順 (AC-4 根拠)

```bash
# 対象候補を列挙
candidates=$(git ls-files '.claude/skills/**/LOGS.md' \
             '.claude/skills/**/lessons-learned-*.md' \
             '.claude/skills/**/_legacy*.md')

# YAML/JSON フェンス・front matter の有無を判定（簡易）
for f in $candidates; do
  if head -n 1 "$f" | grep -q '^---$'; then
    echo "WARN front-matter: $f"   # 対象から除外
  elif grep -q '^```' "$f"; then
    echo "WARN code-fence: $f"     # 内容を要レビュー
  else
    echo "OK: $f"
  fi
done

# git の attribute 適用結果を直接確認
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS.md
# => .claude/skills/aiworkflow-requirements/LOGS.md: merge: union
git check-attr merge -- .claude/skills/aiworkflow-requirements/indexes/keywords.json
# => .claude/skills/aiworkflow-requirements/indexes/keywords.json: merge: unspecified
```

`WARN` は手動レビューで除外可否を判断し、対象から外す場合は `.gitattributes` の
パターンを **より厳密** に書き換える（個別パス指定など）。

## Step 4 — 検証 (Phase 4 C-4)

```bash
git checkout main
for n in 1 2; do bash scripts/new-worktree.sh verify/b1-$n; done

# 2 worktree から同一 LOGS.md 末尾に追記
( cd .worktrees/verify-b1-1 && \
  printf -- '- entry from wt1\n' >> .claude/skills/aiworkflow-requirements/LOGS.md && \
  git commit -am "log: wt1" )
( cd .worktrees/verify-b1-2 && \
  printf -- '- entry from wt2\n' >> .claude/skills/aiworkflow-requirements/LOGS.md && \
  git commit -am "log: wt2" )

# main で順次 merge
git merge --no-ff verify/b1-1
git merge --no-ff verify/b1-2
echo $?   # => 0
git ls-files --unmerged   # => 0 行

# 両追記が結果ファイルに含まれること
grep 'entry from wt1' .claude/skills/aiworkflow-requirements/LOGS.md
grep 'entry from wt2' .claude/skills/aiworkflow-requirements/LOGS.md
```

期待: 終了コード 0、両エントリが保存。

## ロールバック手順

1. `.gitattributes` の追記行を `git revert` または手動削除
2. commit: `revert(skill): drop merge=union driver (B-1)`
3. 既存ファイルへの影響なし（attribute は merge 時にのみ作用）

## 注意

- `merge=union` は **行順を保証しない**。timestamp 順を要求する用途には向かない（その場合は A-2 fragment 化必須）
- 適用後に対象ファイルのフォーマットを「行をまたぐ構造」に変更してはいけない
- A-2 完了時に **本 attribute を削除** すること（main.md の AC マトリクスに記載済）
- JSON / YAML / lockfile / `SKILL.md` への誤適用は AC-4 違反。`git check-attr merge` で逐一確認
