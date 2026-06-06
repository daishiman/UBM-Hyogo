# dev sync: behind 1 でも union member が 5（#1140 が skill core 全体を touch）・同 behind 数で union 2/5 両方を観測し「member = 取込デルタ依存・behind 数非依存」を確定（2026-06-06 3rd pass）

- 日時: 2026-06-06（同日 3 回目の dev 取込）
- ブランチ: `docs/issue-1081-bulk-tag-real-d1-runtime-smoke-spec` ← `dev`（sub-worktree wt-10・**1 behind / 6 ahead**、ローカル dev = origin/dev 一致（`38da7c254`）で dev 同期は no-op・独自コミット 0）
- 関連: 同日 [[20260606-dev-sync-union2-issue1079-audit-member-shrink]]（2nd pass・behind 1・union 2）/ [[20260606-dev-sync-union5-issue1081-static-manifest-reconfirm]]（1st pass・behind 7・union 5）/ `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-097/101**
- 事象: 取込んだ dev 新規コミットは 1 件 = `38da7c254 feat(shell): collapsed サイドバー tooltip + 公開フッター sticky + モバイルヘッダー sticky 固定`（#1140）。content CONFLICT は **5 file**:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（union）
  - （`keywords.json` / `SKILL-changelog.md` は git auto-merge で衝突回避＝今回 `--ours` 行 0）
- 解消: `pnpm sync:resolve` 1 回で **`union-resolving 5 files`** + 内部 `pnpm indexes:rebuild` を完遂。`all skill / index conflicts resolved` exit 0。
- **核心データポイント（L-DEVSYNC-097/101 の決定的確定）**: 本 3rd pass は 2nd pass と **同じ behind 1** だが、2nd pass（#1139 audit）は union **2**、本 pass（#1140 shell tooltip + footer/header）は union **5**。同一 behind 数で union member 2 と 5 の両方を観測したことで、2nd pass で立てた仮説「**union member 集合 = 取込デルタが実際に touch する skill ファイルの集合（behind 数非依存）**」が決定的に確定。#1140 が SKILL.md + 索引 3（quick-reference/resource-map/topic-map）+ task-workflow-active の skill core を広く更新したため union が 5 に膨らんだ。`union-resolving N files` の N は取込内容のみで決まり、behind 数からは予測不能 → 必ずログで実数確認。
- 検証順: `git fetch --prune origin`（dev=origin/dev `38da7c254` 一致・独自 0）→ `git rev-list --left-right --count origin/dev...HEAD` = 1/6 → `git log HEAD..dev` = #1140 単一 → `git merge dev --no-edit` CONFLICT 5 → `pnpm sync:resolve`（`union-resolving 5 files` + rebuild）→ `--diff-filter=U` 0 / 実マーカー 0 → `git commit --no-edit`（merge commit `67ed52618`・lefthook 全 pass・staged-task-dir-guard は MERGE_HEAD で auto-skip）→ `pnpm typecheck` / `pnpm lint` / `pnpm verify:static-manifest` / `pnpm indexes:rebuild` 冪等。CI failure なし。
- 反映先: 本 changelog（振動則の決定的確定）。新規 lesson 番号は SSOT インフレ回避のため起こさず、L-DEVSYNC-097/101 の確定データとして記録。
