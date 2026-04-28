# Skill Ledger Gitattributes Policy — B-1 merge=union 適用境界

> 最終更新日: 2026-04-28
> 対象: B-1 / `task-skill-ledger-b1-gitattributes`
> 出典: `outputs/phase-2/gitattributes-pattern.md` / `outputs/phase-7/gitattributes-runbook.md` / `outputs/phase-12/implementation-guide.md`
> 前提: A-1 / A-2 / A-3 完了

## 1. 目的

A-2 で fragment 化できない / 移行猶予中の **行独立な append-only ledger** に対し、Git ビルトイン `merge=union` ドライバを `.gitattributes` で適用し、並列 worktree の追記行衝突を 0 件化する保険として機能させる。

## 2. 位置付け

B-1 は **A-1〜A-3 完了後の最後の保険**。先行実施すると fragment 化対象にまで driver が残り、A-2 設計と二重管理になる。fragment 化が本筋であることを忘れない。

## 3. 適用許可リスト

`merge=union` を適用してよいのは、以下を **すべて満たす** path のみ。

| 条件 | 説明 |
| --- | --- |
| 行独立な Markdown | 各行が他行と独立に意味を持つ。順序が保証されなくても構造が壊れない |
| append-only | 既存行を書き換えず末尾に追記のみ |
| `_legacy.md` 系 | A-2 移行猶予中の退避ファイル |
| front matter なし | `---` を持たない（重複すると順序崩壊） |
| code fence なし | 構造体を持たない |

### 推奨 pattern 例

```gitattributes
# === skill ledger merge=union (B-1) ===
# 適用条件: 行独立な append-only Markdown のみ
# 解除条件: A-2 fragment 化が完了次第、該当行を削除すること（負債化防止）
# 適用禁止: JSON / YAML / SKILL.md / lockfile / コードファイル
.claude/skills/**/LOGS/_legacy.md merge=union
.claude/skills/**/changelog/_legacy.md merge=union
.claude/skills/**/lessons-learned/_legacy-*.md merge=union
```

pattern は **広く書きすぎない**。`**/*.md` のような広域 glob は禁止。個別 path / 限定 glob のみ。

## 4. 適用禁止リスト

以下は構造体を持つため `merge=union` を **絶対に適用してはならない**。両側追記を機械的に並べると静かに破損する。

| 種別 | 例 | 禁止理由 |
| --- | --- | --- |
| JSON | `indexes/keywords.json` / `index-meta.json` | 構造体破壊・括弧整合喪失 |
| YAML | `*.yml` / `*.yaml` | インデント / アンカー破壊 |
| `SKILL.md` | skill loader の entrypoint | front matter / Anchors 重複・順序逆転 |
| lockfile | `pnpm-lock.yaml` 等 | 構造体破壊 |
| コードファイル | `.ts` / `.tsx` / `.js` 等 | 構文破壊 |
| front matter 付き fragment | `LOGS/<timestamp>-*.md` | 既に fragment 化済みで衝突しない |

## 5. 検証

```bash
# 適用結果確認
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
# => merge: union
git check-attr merge -- .claude/skills/aiworkflow-requirements/indexes/keywords.json
# => merge: unspecified
git check-attr merge -- .claude/skills/aiworkflow-requirements/SKILL.md
# => merge: unspecified
```

`merge: unspecified` が除外側で必ず出力されることを確認する。

## 6. 2 worktree smoke

```bash
git checkout main
bash scripts/new-worktree.sh verify/b1-1
bash scripts/new-worktree.sh verify/b1-2

( cd .worktrees/verify-b1-1 && \
  printf -- '- entry from wt1\n' >> .claude/skills/aiworkflow-requirements/LOGS/_legacy.md && \
  git commit -am "log: wt1" )
( cd .worktrees/verify-b1-2 && \
  printf -- '- entry from wt2\n' >> .claude/skills/aiworkflow-requirements/LOGS/_legacy.md && \
  git commit -am "log: wt2" )

git merge --no-ff verify/b1-1
git merge --no-ff verify/b1-2
echo $?                       # => 0
git ls-files --unmerged       # => 0 行
grep 'entry from wt1' .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
grep 'entry from wt2' .claude/skills/aiworkflow-requirements/LOGS/_legacy.md
```

## 7. 完了条件

- `.gitattributes` に B-1 セクションが追加されている
- 適用対象は行独立な append-only Markdown のみ
- JSON / YAML / `SKILL.md` / lockfile / コードファイルへ適用されていない
- 2 worktree smoke で両追記行が保存され、衝突 0 件
- A-2 fragment 化完了時の解除手順が `.gitattributes` コメントまたは runbook に明記
- evidence: `outputs/phase-11/evidence/<run-id>/b1/`

## 8. 苦戦箇所

| 項目 | 内容 |
| --- | --- |
| 症状 | front matter 付き Markdown / JSON / YAML へ広域 glob で誤適用すると、`---` が重複したり構造体が静かに破損する |
| 原因 | `merge=union` は行単位の機械マージしか行わず、構造体整合性を見ない |
| 対応 | pattern を `**/_legacy.md` 等の移行猶予対象に限定。Phase 1 で front matter / コードフェンス / 構造体の有無を判定して除外。`git check-attr` を対象 / 除外双方で実行 |
| 再発防止 | A-2 fragment 化完了後に該当 `.gitattributes` 行を削除する解除条件をコメント明記。A-2 完了レビューのチェックリストに「B-1 attribute 残存確認」を追加 |

## 9. ロールバック

`.gitattributes` 該当行の `git revert` のみ。既存ファイルへの副作用なし（attribute は merge 時のみ作用）。

## 10. 関連 references

- `skill-ledger-overview.md`
- `skill-ledger-fragment-spec.md`（A-2 が本筋）
- `skill-ledger-gitignore-policy.md`（A-1 適用 NG リストとの関係）
- `skill-ledger-progressive-disclosure.md`（SKILL.md は禁止対象）
- `lessons-learned-skill-ledger-redesign-2026-04.md`
