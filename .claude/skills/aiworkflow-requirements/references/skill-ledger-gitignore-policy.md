# Skill Ledger Gitignore Policy — A-1 自動生成 ledger の git 非管理化

> 最終更新日: 2026-04-28
> 対象: A-1 / `task-skill-ledger-a1-gitignore`
> 出典: `outputs/phase-5/main.md` / `outputs/phase-5/gitignore-runbook.md` / `outputs/phase-12/implementation-guide.md`
> 前提: A-2 fragment 化完了

## 1. 目的

`.claude/skills/<skill>/` 配下の **自動再生成可能な派生物** を Git 非管理にし、複数 worktree 並列開発時に派生物 merge conflict が発生しない状態を作る。派生物は明示コマンド（例: `pnpm indexes:rebuild`）と CI gate で管理し、post-commit / post-merge hook は tracked canonical の再生成や `git add` を行わない。

## 2. 適用対象（gitignore 追記 glob）

```gitignore
# === skill auto-generated ledger (A-1) ===
# 派生物は明示 rebuild / CI gate で管理するため git 非管理
.claude/skills/*/indexes/keywords.json
.claude/skills/*/indexes/index-meta.json
.claude/skills/*/indexes/*.cache.json
.claude/skills/*/LOGS.rendered.md
# A-2 移行完了後に有効化（本タスクは A-2 完了が前提なので有効化済み）:
# .claude/skills/aiworkflow-requirements/LOGS.md
```

| 対象 | 種別 | 再生成元 |
| --- | --- | --- |
| `indexes/keywords.json` | 集計インデックス | `scripts/generate-index.js` |
| `indexes/index-meta.json` | メタ情報 | `scripts/generate-index.js` |
| `indexes/*.cache.json` | キャッシュ | scripts / hook |
| `LOGS.rendered.md` | render 出力 | `pnpm skill:logs:render` |

## 3. 適用 NG リスト

以下は **append-only であっても自動生成ではない正本** のため、A-1 対象外。A-2 fragment 化または B-1 `merge=union` に倒す。

| 対象 | 理由 |
| --- | --- |
| `LOGS.md`（A-2 完了前） | 履歴の正本。A-2 で fragment 退避完了するまで ignore 化禁止（履歴喪失リスク） |
| `SKILL-changelog.md` | A-2 fragment 化対象 |
| `lessons-learned-*.md` | A-2 fragment 化対象 |
| `SKILL.md` | entry。A-3 分割対象 |
| `references/*.md` | 正本 |

## 4. 実施手順（runbook 抜粋）

### Phase 1: 棚卸し

```bash
git ls-files .claude/skills | rg "(indexes/.*\.json|\.cache\.json|LOGS\.rendered\.md)"
```

実態ベースで tracked 派生物を全列挙する。runbook の例示 glob と実態の差分を識別。

### Phase 2: `.gitignore` 追記

§2 の patch を `.gitignore` に追加し、`git check-ignore -v <target>` で各対象がマッチすることを確認。**`.git/info/exclude` ではなくリポジトリ正本の `.gitignore`** に書く。

### Phase 3: tracked 派生物の untrack

```bash
git rm --cached \
  .claude/skills/aiworkflow-requirements/indexes/keywords.json \
  .claude/skills/aiworkflow-requirements/indexes/index-meta.json
git commit -m "chore(skill): untrack auto-generated ledger files (A-1)"
```

`git ls-files` から対象が消え、worktree 上の実体ファイルは残ることを確認。

### Phase 4: hook 冪等化

post-commit / post-merge hook は stale 通知までに留め、tracked canonical への書き込み、派生物の自動再生成、`git add` 系コマンドを実行しない。派生物の作成・修復は明示 `pnpm indexes:rebuild` と CI gate の責務にする:

```bash
pnpm indexes:rebuild
find . -path '*/indexes/*.json' -exec sh -c 'jq -e . "$1" >/dev/null 2>&1 || rm -v "$1"' _ {} \;
```

## 5. 検証コマンド

```bash
# (a) gitignore マッチ
git check-ignore -v .claude/skills/aiworkflow-requirements/indexes/keywords.json
git check-ignore -v .claude/skills/aiworkflow-requirements/indexes/index-meta.json

# (b) tracked 解除確認
git ls-files .claude/skills/aiworkflow-requirements/indexes

# (c) 単一 worktree 再生成
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
git status --porcelain   # => 空

# (d) 4 worktree smoke
git checkout main
for n in 1 2; do bash scripts/new-worktree.sh verify/a1-$n; done
( cd .worktrees/verify-a1-1 && node .claude/skills/aiworkflow-requirements/scripts/generate-index.js )
( cd .worktrees/verify-a1-2 && node .claude/skills/aiworkflow-requirements/scripts/generate-index.js )
git merge --no-ff verify/a1-1
git merge --no-ff verify/a1-2
git ls-files --unmerged | wc -l   # => 0
```

## 6. 完了条件

- `.gitignore` に runbook §Step 1 の glob が追加されている
- tracked 派生物が `git ls-files` から消えている（worktree 実体は残存）
- hook が stale 通知以外の副作用を持たず、`git add` 系と自動再生成を行わない
- 4 worktree smoke で派生物 conflict 0 件
- 単一 worktree 再生成後 `git status --porcelain` が空
- evidence: `outputs/phase-11/evidence/<run-id>/a1/`

## 7. 苦戦箇所（最重要）

| 項目 | 内容 |
| --- | --- |
| 症状 | A-2 より先に A-1 を実施し、`LOGS.md` を ignore 化した瞬間に履歴が事実上失われる |
| 原因 | `LOGS.md` は本来正本だが、A-2 完了前は `_legacy.md` 退避先がない。ignore 化すると Git が履歴を追跡できない |
| 対応 | runbook §適用範囲で「`LOGS.md` は **A-2 完了まで** gitignore に入れない」と明記。implementation-guide §実装順序で 1) A-2 → 2) A-1 → 3) A-3 → 4) B-1 を厳守 |
| 再発防止 | A-1 PR レビュー時に「`LOGS.md` を gitignore に入れていないこと」「A-2 PR が先行マージ済みであること」を必須チェック |

## 8. ロールバック

```bash
git revert <commit-of-a1>
git add -f .claude/skills/aiworkflow-requirements/indexes/keywords.json
git commit -m "revert(skill): re-track A-1 ledger files"
```

## 9. 関連 references

- `skill-ledger-overview.md`
- `skill-ledger-fragment-spec.md`（A-2 前提）
- `skill-ledger-gitattributes-policy.md`（B-1 適用 NG リストとの関係）
- `lessons-learned-skill-ledger-redesign-2026-04.md`
