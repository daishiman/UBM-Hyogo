# A-2 実装ランブック — fragment 化

## Step 1 — ディレクトリ転換

各対象 skill 内に以下を新設し、`.gitkeep` で空ディレクトリ追跡を行う。

```bash
mkdir -p .claude/skills/aiworkflow-requirements/LOGS
mkdir -p .claude/skills/task-specification-creator/changelog
mkdir -p .claude/skills/aiworkflow-requirements/lessons-learned
mkdir -p .claude/skills/task-specification-creator/lessons-learned
touch .claude/skills/aiworkflow-requirements/LOGS/.gitkeep
touch .claude/skills/task-specification-creator/changelog/.gitkeep
touch .claude/skills/aiworkflow-requirements/lessons-learned/.gitkeep
touch .claude/skills/task-specification-creator/lessons-learned/.gitkeep
```

## Step 2 — 既存 ledger の退避（git mv 推奨）

`git mv` を使う理由: rename 検出により blame / log が連続するため、履歴ロストを防ぐ。

```bash
git mv .claude/skills/aiworkflow-requirements/LOGS.md \
       .claude/skills/aiworkflow-requirements/LOGS/_legacy.md

git mv .claude/skills/task-specification-creator/SKILL-changelog.md \
       .claude/skills/task-specification-creator/changelog/_legacy.md

# lessons-learned-*.md は内容スコープごとに退避
for f in $(git ls-files '.claude/skills/**/lessons-learned-*.md'); do
  dir=$(dirname "$f")/lessons-learned
  base=$(basename "$f" .md)
  mkdir -p "$dir"
  git mv "$f" "$dir/_legacy-${base}.md"
done

git commit -m "refactor(skill): move ledgers to fragment dir as _legacy (A-2)"
```

代替策: `LOGS/00000000-000000-imported-legacy.md` 形式で fragment として import する
（render 時に通常 fragment と同列に扱える利点あり）。命名規則 regex を満たす必要がある。

## Step 3 — fragment 命名規約（再掲）

`outputs/phase-2/fragment-schema.md` の規約に従う:

| 種別 | パス regex | front matter 必須 |
| --- | --- | --- |
| LOGS | `^LOGS/[0-9]{8}-[0-9]{6}-[a-z0-9_-]+-[a-f0-9]{8}\.md$` | `timestamp` `branch` `author` `type` |
| changelog | `^changelog/[0-9]+\.[0-9]+\.[0-9]+\.md$` | `version` |
| lessons-learned | `^lessons-learned/[0-9]{8}-[a-z0-9-]+\.md$` | `date` `topic` |

ブランチ名エスケープ: `/` および空白を `_` に、安全でない文字は除去し、空文字になった場合は `detached` を使う。
nonce は 8 桁 hex（例: `openssl rand -hex 4`）で生成する。

## Step 4 — 追記コードの fragment 生成への書換え（実装は別タスク）

```bash
# 旧: append
echo "- 2026-04-28 entry" >> .claude/skills/<skill>/LOGS.md

# 新: 新規 fragment 作成
ts=$(date -u +%Y%m%d-%H%M%S)
branch_esc=$(git rev-parse --abbrev-ref HEAD | tr '/ ' '__')
nonce=$(openssl rand -hex 4)
cat > .claude/skills/<skill>/LOGS/${ts}-${branch_esc}-${nonce}.md <<EOF
---
timestamp: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
branch: "$(git rev-parse --abbrev-ref HEAD)"
author: "human"
type: "log"
---

entry body
EOF
```

書換え対象の grep 雛形:

```bash
git grep -n 'LOGS\.md' .claude/skills/
git grep -n 'SKILL-changelog\.md' .claude/skills/
git grep -n 'lessons-learned-' .claude/skills/
```

書換え後、append への参照は **0 件** であること（A-2 完了の必要条件）。

## Step 5 — render script 雛形 API

`outputs/phase-2/render-api.md` に従い `pnpm skill:logs:render` を提供する。

```text
pnpm skill:logs:render \
  --skill <skill-name> \
  --kind <log|changelog|lessons-learned> \
  [--out <path>]   # 省略時は stdout
```

要件:

- timestamp 降順（lessons は date 降順、changelog は semver 降順）
- 不正 front matter は file path 付きでエラー停止（C-7）
- `_legacy*.md` は本文末尾に「Legacy」セクションとして連結（後方互換）
- `--out` で書き出す場合、出力先は **A-1 と同じく gitignore 必須**

## Step 6 — 検証

```bash
# C-1: 同秒・同 branch fragment 生成 → 命名衝突検知
# C-2: 異なる fragment → 衝突なし
# C-6: render 出力が timestamp 降順
# C-7: timestamp 欠損 fragment → render 失敗

pnpm skill:logs:render --skill aiworkflow-requirements --kind log > /tmp/render.txt
head -n 20 /tmp/render.txt   # 期待: 最新 fragment が先頭

# 2 worktree から fragment を作成して merge
for n in 1 2; do bash scripts/new-worktree.sh verify/a2-$n; done
( cd .worktrees/verify-a2-1 && pnpm skill:logs:append --skill aiworkflow-requirements --kind log && git add .claude/skills/aiworkflow-requirements/LOGS && git commit -m "wt1" )
( cd .worktrees/verify-a2-2 && pnpm skill:logs:append --skill aiworkflow-requirements --kind log && git add .claude/skills/aiworkflow-requirements/LOGS && git commit -m "wt2" )
git merge --no-ff verify/a2-1 verify/a2-2
echo $?   # => 0
git ls-files --unmerged   # => 0 行
```

## ロールバック手順

1. `git mv` 退避を逆順実施: `LOGS/_legacy.md` → `LOGS.md`
2. 新規 fragment ディレクトリを削除（`.gitkeep` 含む）
3. 追記コードを append 方式へ revert
4. render script を package.json から削除
5. commit: `revert(skill): rollback A-2 fragment migration`

## 注意

- `_legacy*.md` は履歴温存目的のため **削除禁止** （Phase 3 backward-compat 方針）
- A-2 完了後も B-1 (`merge=union`) は `_legacy*.md` のみ対象として残す案あり（Phase 7 で確定）
- writer の append 方式が **ひとつでも残る** と A-2 効果が消える。grep 0 件を CI で固定推奨
