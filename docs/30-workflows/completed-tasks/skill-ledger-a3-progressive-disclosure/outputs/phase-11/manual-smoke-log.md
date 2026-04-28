# Phase 11 manual smoke log

実行ワーキングディレクトリ: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260428-170401-wt-3`
実行日時: 2026-04-28
スクリプト本体: `docs/30-workflows/skill-ledger-a3-progressive-disclosure/outputs/phase-04/scripts/`
raw ログ: `outputs/phase-11/evidence/`

---

## §1 行数検査（line-count.sh）

```bash
bash outputs/phase-04/scripts/line-count.sh
```

stdout 抜粋:

```
OK:   .claude/skills/aiworkflow-requirements/SKILL.md = 190 lines
FAIL: .claude/skills/automation-30/SKILL.md = 432 lines (>= 200)
FAIL: .claude/skills/claude-agent-sdk/SKILL.md = 324 lines (>= 200)
FAIL: .claude/skills/github-issue-manager/SKILL.md = 363 lines (>= 200)
OK:   .claude/skills/int-test-skill/SKILL.md = 121 lines
FAIL: .claude/skills/skill-creator/SKILL.md = 402 lines (>= 200)
OK:   .claude/skills/skill-fixture-runner/SKILL.md = 99 lines
OK:   .claude/skills/task-specification-creator/SKILL.md = 115 lines
---
SUMMARY: total=8 fail=4 threshold=200
```

exit code: `1`

期待値との一致 / 不一致:
- **task-specification-creator = 115 lines (< 200)**: AC-1 / AC-9 PASS（本 PR の最優先対象）
- 既分割 4 件（aiworkflow-requirements / int-test-skill / skill-fixture-runner / task-specification-creator）すべて PASS
- 残 4 件（automation-30 / claude-agent-sdk / github-issue-manager / skill-creator）は **本 PR 範囲外・次の per-skill PR で分割予定**（Phase 1〜3 の「現 PR スコープ = task-specification-creator のみ」と整合）

---

## §2 SKILL.md → references リンク列挙（link-integrity.sh）

```bash
bash outputs/phase-04/scripts/link-integrity.sh
```

stdout 主要抜粋（task-specification-creator 部分）:

```
OK:   task-specification-creator -> references/create-workflow.md
OK:   task-specification-creator -> references/execute-workflow.md
OK:   task-specification-creator -> references/orchestration.md
OK:   task-specification-creator -> references/phase-12-documentation-guide.md
OK:   task-specification-creator -> references/phase-12-pitfalls.md
OK:   task-specification-creator -> references/phase-12-spec.md
OK:   task-specification-creator -> references/phase-templates.md
OK:   task-specification-creator -> references/quality-gates.md
OK:   task-specification-creator -> references/requirements-review.md
OK:   task-specification-creator -> references/task-type-decision.md
OK:   task-specification-creator -> references/logs-archive-index.md
```

`SUMMARY: fail=7`（exit code=1）

FAIL 内訳:
- aiworkflow-requirements -> references/spec-update-workflow.md（既存スキルの旧リンク。本 PR 対象外）
- claude-agent-sdk -> references/interfaces-agent-sdk.md（次 PR 対象）
- 5 件は `.claude/skills/skill-creator/references/` 配下の README 内に "SKILL.md" 文字列が含まれることによる false positive（`references/<X>.md` 形式の path リンクではない）

期待値との一致 / 不一致:
- **task-specification-creator は 11 件すべて OK / リンク切れ 0**（AC-7 PASS）
- 残対象 skill のリンク切れは次 PR で当該 skill を分割する際に同時解消

---

## §3 未参照 reference 検出（orphan-references.sh）

```bash
bash outputs/phase-04/scripts/orphan-references.sh
```

`SUMMARY: orphan=509`（exit code=1）

orphan は次 4 つのカテゴリに集約:
1. **automation-30 / github-issue-manager**: SKILL.md 未分割のため references 表が SKILL.md に存在しない → 次 PR で解消
2. **claude-agent-sdk / skill-creator**: 同上 + 旧 references/ ファイルが残存
3. **task-specification-creator**: SKILL.md は分割済みだが旧 references/*.md を多数 retain（後続 cleanup wave で除去予定）
4. **aiworkflow-requirements**: 旧 logs/topic-map 系の orphan が一部残存

task-specification-creator の Main References 表（7 entries）に列挙されている下記 7 件はすべて `OK:` 判定:

```
OK:   task-specification-creator <- references/requirements-review.md
OK:   task-specification-creator <- references/task-type-decision.md
OK:   task-specification-creator <- references/phase-templates.md
OK:   task-specification-creator <- references/phase-12-spec.md
OK:   task-specification-creator <- references/phase-12-pitfalls.md
OK:   task-specification-creator <- references/quality-gates.md
OK:   task-specification-creator <- references/orchestration.md
```

期待値との一致 / 不一致:
- **本 PR 対象 7 件は AC-8 PASS**
- 残 orphan は SKILL.md 分割未着手の skill or 旧 references の cleanup 未実施に起因 → 次 PR スコープへ register

---

## §4 canonical / mirror 差分検証（mirror-diff.sh）

```bash
bash outputs/phase-04/scripts/mirror-diff.sh
```

stdout:

```
OK:   aiworkflow-requirements canonical == mirror
OK:   automation-30 canonical == mirror
OK:   claude-agent-sdk canonical == mirror
OK:   github-issue-manager canonical == mirror
OK:   int-test-skill canonical == mirror
OK:   skill-creator canonical == mirror
OK:   skill-fixture-runner canonical == mirror
OK:   task-specification-creator canonical == mirror
---
SUMMARY: total=8 fail=0
```

exit code: `0`

期待値との一致: **全 8 skill 完全一致 / AC-5 PASS（PR 全体）**。

---

## §5 task-specification-creator 重点 smoke

```bash
wc -l .claude/skills/task-specification-creator/SKILL.md
# => 115 .claude/skills/task-specification-creator/SKILL.md

rg -n 'references/' .claude/skills/task-specification-creator/SKILL.md | wc -l
# => 18 行（主表 7 件 + クイックスタート/本文中 11 件 = 計 18）

rg -n '^name:|^allowed-tools:|^Anchors:|^Trigger:' -i .claude/skills/task-specification-creator/SKILL.md
# => name / allowed-tools が frontmatter に残置、Anchors / Trigger は description ブロック内に保持
```

期待値との一致:
- 行数 < 200 ✅
- frontmatter（name / description / allowed-tools）保持 ✅
- description ブロック内の Anchors（Clean Code / Continuous Delivery / DDD）/ Trigger 保持 ✅
- 主 References 表が 7 行で構成され全リンクが実在 ✅

---

## §6 link-checklist.md 作成

`outputs/phase-11/link-checklist.md` を本ログと同 wave で生成。task-specification-creator の 7 references について「実在 [x]」「SKILL.md からの参照 [x]」を全て確認済み。
