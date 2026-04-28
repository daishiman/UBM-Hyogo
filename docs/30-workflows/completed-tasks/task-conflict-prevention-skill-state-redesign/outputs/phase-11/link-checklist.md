# Phase 11 Link Checklist — 仕様書相互リンク健全性検証

本書は仕様書間 / 外部参照リンクの健全性を機械的に確認するためのチェックリスト。
実行は実装タスク（または PR レビュー時）に行い、結果を本書のチェックボックスで記録する。

## A. index.md ↔ phase-XX.md 双方向リンク

- [ ] `index.md` の「Phase 一覧」表に phase-01〜13 すべての行がある
- [ ] 各 phase-XX.md に「メタ情報」表がある
- [ ] 各 phase-XX.md に上流 / 下流 phase へのリンクがある
- [ ] phase-01.md の上流が「なし」、phase-13.md の下流が「なし」となっている
- [ ] `index.md` の「主要成果物」が phase-XX outputs と矛盾しない

## B. phase-XX.md → outputs/phase-XX/*.md 参照

- [ ] phase-01〜13 の各「成果物」表に列挙されたファイルが `outputs/phase-N/` に実在
- [ ] 各 phase outputs 配下に `main.md` が必ず存在
- [ ] phase-2 outputs に `file-layout.md` / `fragment-schema.md` / `render-api.md` / `gitattributes-pattern.md`
- [ ] phase-4 outputs に `parallel-commit-sim.md` / `merge-conflict-cases.md`
- [ ] phase-5 outputs に `gitignore-runbook.md`
- [ ] phase-6 outputs に `fragment-runbook.md`
- [ ] phase-7 outputs に `skill-split-runbook.md` / `gitattributes-runbook.md`
- [ ] phase-11 outputs に `manual-smoke-log.md` / `link-checklist.md`
- [ ] phase-12 outputs に 7 ファイルすべて存在

## C. 外部参照（.claude/skills/）

- [ ] `.claude/skills/aiworkflow-requirements/SKILL.md` が実在
- [ ] `.claude/skills/aiworkflow-requirements/LOGS.md` が実在（A-2 移行前）
- [ ] `.claude/skills/aiworkflow-requirements/indexes/keywords.json` が実在（A-1 対象）
- [ ] `.claude/skills/aiworkflow-requirements/indexes/index-meta.json` が実在（A-1 対象）
- [ ] `.claude/skills/task-specification-creator/SKILL.md` が実在
- [ ] `.claude/skills/task-specification-creator/SKILL-changelog.md` が実在（A-2 対象）
- [ ] `.claude/skills/task-specification-creator/assets/main-task-template.md` が実在
- [ ] `.claude/skills/task-specification-creator/assets/phase-spec-template.md` が実在

## D. 外部参照（docs/00-getting-started-manual/specs/）

- [ ] `docs/00-getting-started-manual/specs/00-overview.md` が実在
- [ ] Phase 12 で追記対象として提案された `skill-ledger.md` の **新規作成提案**である旨が `system-spec-update-summary.md` に明記
- [ ] 既存 specs（01〜13）への破壊的変更が「ない」ことが Phase 3 backward-compat と整合

## E. AC ↔ Phase outputs トレース

| AC | Phase | outputs |
| --- | --- | --- |
| AC-1 | 2 | `outputs/phase-2/file-layout.md` |
| AC-2 | 2 | `outputs/phase-2/fragment-schema.md` |
| AC-3 | 2,7 | `outputs/phase-2/file-layout.md` / `outputs/phase-7/skill-split-runbook.md` |
| AC-4 | 2,3 | `outputs/phase-2/gitattributes-pattern.md` / `outputs/phase-3/impact-matrix.md` |
| AC-5 | 4 | `outputs/phase-4/parallel-commit-sim.md` |
| AC-6 | 11 | `outputs/phase-11/manual-smoke-log.md` |
| AC-7 | 12 | `outputs/phase-12/system-spec-update-summary.md` ↔ `documentation-changelog.md` |
| AC-8 | 3 | `outputs/phase-3/backward-compat.md` |
| AC-9 | all | コード変更なし（Markdown / JSON / `.gitkeep` のみ） |

- [ ] 上記すべての AC に対応する outputs ファイルが存在し、内容が AC を満たす

## F. Screenshot Policy

- [ ] `outputs/phase-*/screenshots/` ディレクトリが存在しない（NON_VISUAL）
- [ ] `screenshot-plan.json` が生成されていない
- [ ] 後続実装タスクで UI 追加が発生する場合は、その別タスク側で再分類する旨が `main.md` に記載

## G. リンク健全性検証コマンド例（参考）

```bash
# 内部リンク死活
grep -rEn '\]\(\.{1,2}/' docs/30-workflows/task-conflict-prevention-skill-state-redesign/ \
  | awk -F'[()]' '{print $2}' | sort -u
# 外部参照死活
for p in .claude/skills/aiworkflow-requirements/SKILL.md \
         .claude/skills/task-specification-creator/SKILL.md ; do
  test -f "$p" && echo "OK $p" || echo "MISSING $p"
done
```
