# A-1 実装ランブック — gitignore 化

## 適用範囲

| パス | 種別 | 理由 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | 自動再生成 ledger（A-2 移行 **後** のみ） | hook が再生成、tracked だと衝突 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 単純カウンタ JSON | `totalKeywords` 等が並列で必ず衝突 |
| `.claude/skills/aiworkflow-requirements/indexes/index-meta.json` | 派生メタ | 同上 |
| `.claude/skills/*/indexes/*.cache.json` | キャッシュ派生物 | hook 再生成 |
| `.claude/skills/*/LOGS.rendered.md` | render script 出力 | `pnpm skill:logs:render --out` の出力先 |

注: `LOGS.md` 本体は **A-2 完了まで** gitignore に入れない（履歴喪失防止）。
A-2 完了後は `_legacy.md` 等として履歴温存し、生 `LOGS.md` を gitignore へ移動。

## Step 1 — `.gitignore` 追記 (patch 形式)

```diff
--- a/.gitignore
+++ b/.gitignore
@@
+# === skill auto-generated ledger (A-1) ===
+# 派生物は post-commit / post-merge hook で再生成されるため git 非管理
+.claude/skills/*/indexes/keywords.json
+.claude/skills/*/indexes/index-meta.json
+.claude/skills/*/indexes/*.cache.json
+.claude/skills/*/LOGS.rendered.md
+# A-2 移行完了後に有効化:
+# .claude/skills/aiworkflow-requirements/LOGS.md
```

検証:

```bash
git check-ignore -v .claude/skills/aiworkflow-requirements/indexes/keywords.json
# => .gitignore:<line>:<pattern>  <path>
```

## Step 2 — 既存 tracked file の untrack

```bash
git rm --cached \
  .claude/skills/aiworkflow-requirements/indexes/keywords.json \
  .claude/skills/aiworkflow-requirements/indexes/index-meta.json
git commit -m "chore(skill): untrack auto-generated ledger files (A-1)"
```

- ファイル本体は worktree に残る（`--cached` のため）
- 履歴は維持される
- `LOGS.md` は A-2 後に同様の手順で untrack

## Step 3 — hook ガード設計（疑似コード）

post-commit / post-merge hook の冒頭で「ターゲット存在 → 再生成スキップ or 内容比較」のガードを噛ませる。

```bash
# .claude/skills/aiworkflow-requirements/scripts/post-commit.sh (疑似)
target=".claude/skills/aiworkflow-requirements/indexes/keywords.json"
if [[ -f "$target" ]]; then
  # 既存ファイル尊重（タイムスタンプ判定で chunk 更新のみ行う等は実装タスクで決定）
  exit 0
else
  regenerate "$target"
fi
```

要件:

1. ガードは **冪等** であること（複数回実行しても tree を変えない）
2. 派生物がない worktree では再生成して空状態を回避
3. 結果は **コミットしない**（gitignore 対象）

## Step 4 — 検証コマンド

```bash
# (a) 単一 worktree で再生成しても git tree が変わらないこと
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
git status --porcelain   # => 空（再生成されたファイルが gitignore で除外されている）

# (b) Phase 4 C-3 の 2 worktree 並列再生成 → merge
git checkout main
for n in 1 2; do bash scripts/new-worktree.sh verify/a1-$n; done
( cd .worktrees/verify-a1-1 && node .claude/skills/aiworkflow-requirements/scripts/generate-index.js )
( cd .worktrees/verify-a1-2 && node .claude/skills/aiworkflow-requirements/scripts/generate-index.js )
git merge --no-ff verify/a1-1
git merge --no-ff verify/a1-2
echo $?   # => 0
git ls-files --unmerged | wc -l  # => 0
```

## ロールバック手順

1. `.gitignore` の該当行を `git revert` または手動削除
2. 対象ファイルを再 add: `git add -f .claude/skills/.../keywords.json` 等
3. hook ガード（Step 3）を revert
4. commit メッセージ: `revert(skill): re-track A-1 ledger files`

## 注意事項

- `.git/info/exclude` ではなく **リポジトリ正本の `.gitignore`** を使う（全 worktree で共有のため）
- A-2 完了後も A-1 対象は gitignore 維持（fragment と派生物は別概念）
- 機密値は元来含まれないが、ローカル cache 配置時は秘匿チェック必須
