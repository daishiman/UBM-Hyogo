# Quick Reference: Search Patterns — Skill Ledger

> 最終更新日: 2026-04-28
> 親: `quick-reference.md`
> 分離理由: `quick-reference.md` が 832 行で 500 行ガード超過のため、skill-ledger 関連クエリは本ファイルに分離（A-3 progressive disclosure 適用）

## skill ledger / 4 施策 早見

| クエリ | キーワード | 参照先 |
| --- | --- | --- |
| skill ledger 全体像 | `skill-ledger`, `4施策`, `A-1 A-2 A-3 B-1` | `references/skill-ledger-overview.md` |
| 実装順序 | `A-2 → A-1 → A-3 → B-1`, `実装順序` | `references/skill-ledger-overview.md` §3 |
| fragment 命名規則 | `fragment`, `escapedBranch`, `nonce`, `LOGS/<timestamp>-<branch>-<nonce>.md` | `references/skill-ledger-fragment-spec.md` §2 |
| fragment front matter | `front matter`, `timestamp / branch / author / type` | `references/skill-ledger-fragment-spec.md` §3 |
| render API | `pnpm skill:logs:render`, `--since`, `--out`, `--include-legacy` | `references/skill-ledger-fragment-spec.md` §5 |
| render-api 型定義 | `RenderSkillLogsOptions`, `SkillLedgerFragment` | `references/skill-ledger-fragment-spec.md` §4 |
| append helper | `pnpm skill:logs:append`, writer 経路集約 | `references/skill-ledger-fragment-spec.md` §6 |
| writer ガード | `git grep 'LOGS\.md'`, CI ヒット 0 件 | `references/skill-ledger-fragment-spec.md` §6 |
| gitignore 対象 | `keywords.json`, `index-meta.json`, `*.cache.json`, `LOGS.rendered.md` | `references/skill-ledger-gitignore-policy.md` §2 |
| gitignore NG リスト | `LOGS.md`（A-2 完了前）, `SKILL.md`, `references/*.md` | `references/skill-ledger-gitignore-policy.md` §3 |
| hook 冪等化 | post-commit / post-merge `[[ -f $target ]] && exit 0` | `references/skill-ledger-gitignore-policy.md` §4 |
| 200 行ガード | `progressive-disclosure`, `SKILL.md 200 行未満` | `references/skill-ledger-progressive-disclosure.md` §2 |
| entry 残置要素 | `front matter / trigger / Anchors / quickstart / agent 導線` | `references/skill-ledger-progressive-disclosure.md` §3 |
| classification-first | `spec-splitting-guidelines.md` 親ルール | `references/skill-ledger-progressive-disclosure.md` §5 |
| canonical / mirror 同期 | `.claude/skills/` ⇔ `.agents/skills/`, `diff -r` | `references/skill-ledger-progressive-disclosure.md` §6 |
| `merge=union` 許可 | `_legacy.md`, 行独立 Markdown | `references/skill-ledger-gitattributes-policy.md` §3 |
| `merge=union` 禁止 | JSON / YAML / SKILL.md / lockfile | `references/skill-ledger-gitattributes-policy.md` §4 |
| `git check-attr merge` | 適用 / 除外確認 | `references/skill-ledger-gitattributes-policy.md` §5 |
| 4 worktree smoke | `git ls-files --unmerged`, `verify/a2-{1..4}` | `references/skill-ledger-fragment-spec.md` §8 |
| `_legacy.md` 規約 | 物理削除禁止, 30 日 include window | `references/skill-ledger-overview.md` §5 |
| 苦戦箇所集 | L-SLR-001〜009 | `references/lessons-learned-skill-ledger-redesign-2026-04.md` |

## クエリ → reference 1 行マップ

| 知りたいこと | 1 ファイルだけ読むなら |
| --- | --- |
| 「全体像が知りたい」 | `references/skill-ledger-overview.md` |
| 「fragment の作り方・命名・render の API」 | `references/skill-ledger-fragment-spec.md` |
| 「何を gitignore すればいい？」 | `references/skill-ledger-gitignore-policy.md` |
| 「SKILL.md を 200 行未満にする手順」 | `references/skill-ledger-progressive-disclosure.md` |
| 「`merge=union` を当てていい/当ててはいけない path」 | `references/skill-ledger-gitattributes-policy.md` |
| 「過去にハマった点を知りたい」 | `references/lessons-learned-skill-ledger-redesign-2026-04.md` |

## 実装タスク逆引き

| タスク | 仕様書 |
| --- | --- |
| A-1 gitignore 化 | `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a1-gitignore.md` |
| A-2 fragment 化 | `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a2-fragment.md` |
| A-3 progressive disclosure | `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a3-progressive-disclosure.md` |
| B-1 gitattributes（原典スペック） | `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-b1-gitattributes.md` |
| B-1 design workflow（Phase 1〜13） | `docs/30-workflows/skill-ledger-b1-gitattributes/` |
| B-1 実装未タスク（実 `.gitattributes` 適用） | `docs/30-workflows/unassigned-task/task-skill-ledger-b1-gitattributes-implementation.md` |
| B-1 A-2 完了レビュー未タスク | `docs/30-workflows/unassigned-task/task-skill-ledger-b1-a2-completion-review.md` |
| Phase 11 NON_VISUAL 証跡テンプレ改善 | `docs/30-workflows/unassigned-task/task-phase11-nonvisual-evidence-template-sync.md` |

## 検証コマンド早見

```bash
# fragment render
mise exec -- pnpm skill:logs:render --skill aiworkflow-requirements
mise exec -- pnpm skill:logs:render --skill aiworkflow-requirements --include-legacy

# gitignore 確認
git check-ignore -v .claude/skills/aiworkflow-requirements/indexes/keywords.json

# 200 行ガード
for f in .claude/skills/*/SKILL.md; do
  lines=$(wc -l < "$f")
  [[ $lines -ge 200 ]] && echo "FAIL: $f = $lines" || echo "OK: $f = $lines"
done

# merge=union
git check-attr merge -- .claude/skills/aiworkflow-requirements/LOGS/_legacy.md

# writer 残存ガード
git grep -n 'LOGS\.md' .claude/skills/

# 4 worktree smoke (A-2)
for n in 1 2 3 4; do bash scripts/new-worktree.sh verify/a2-$n; done
git ls-files --unmerged | wc -l
```

## A-3 他スキル適用事例

### task-specification-creator（2026-04-28 / Issue #131）

| 項目 | 値 |
| --- | --- |
| 適用前 SKILL.md 行数 | 315 行 |
| 適用後 SKILL.md 行数 | 116 行（entry） |
| 抽出 references 数 | 6 本（新規） |
| 関連 workflow | `docs/30-workflows/skill-ledger-a3-progressive-disclosure/` |

| 抽出 references | 用途 / 対応キーワード |
| --- | --- |
| `.claude/skills/task-specification-creator/references/requirements-review.md` | 要件レビュー手順 / `要件レビュー`, `requirements review`, `Phase 1 ゲート` |
| `.claude/skills/task-specification-creator/references/task-type-decision.md` | タスクタイプ判定 / `task type`, `docs-only`, `non_visual`, `visual` |
| `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase 12 仕様（中学生レベル概念説明含む） / `Phase 12`, `中学生レベル`, `concept explanation` |
| `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md` | Phase 12 の罠（UBM-009〜013 等） / `Phase 12 pitfalls`, `placeholder PNG`, `wrangler 直呼び`, `Next.js 16 worktree root` |
| `.claude/skills/task-specification-creator/references/quality-gates.md` | 品質ゲート定義 / `quality gates`, `coverage`, `phase gate` |
| `.claude/skills/task-specification-creator/references/orchestration.md` | サブエージェント編成・並列実行 / `orchestration`, `subagent`, `parallel` |

## 関連 quick-reference

- `quick-reference.md`（親）
- `quick-reference-search-patterns.md`
- `quick-reference-search-patterns-skill-lifecycle.md`
- `quick-reference-search-patterns-code.md`
- `quick-reference-search-patterns-ipc-infra.md`
