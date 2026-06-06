# dev sync: behind 1（単一コミット取込）では union member が 5→2 に縮小・member は behind 数でなく「取込デルタが触る skill ファイル集合」で決まる（2026-06-06 2nd pass）

- 日時: 2026-06-06（同日 2 回目の dev 取込）
- ブランチ: `docs/issue-1081-bulk-tag-real-d1-runtime-smoke-spec` ← `dev`（sub-worktree wt-10・**1 behind / 4 ahead**、ローカル dev = origin/dev 一致（`6e7b3e344`）で dev 同期は no-op・独自コミット 0）
- 関連: 直前事例 [[20260606-dev-sync-union5-issue1081-static-manifest-reconfirm]]（同日 1st pass・union 5）/ `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` **L-DEVSYNC-097/101**（振動則の精緻化）
- 事象: `git merge dev --no-edit` で取込んだ dev 新規コミットは **1 件のみ** = `6e7b3e344 feat(issue-1079): admin audit に bulk tag batchId 検索・行表示・copy 導線`（#1139）。content CONFLICT は **2 file のみ**:
  - `.claude/skills/aiworkflow-requirements/SKILL.md`（union）
  - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（union）
  - （`keywords.json` / `quick-reference.md` / `resource-map.md` / `task-workflow-active.md` / `SKILL-changelog.md` は今回 git auto-merge で衝突回避＝CONFLICT に上がらなかった）
- 解消: `pnpm sync:resolve` 1 回で **`union-resolving 2 files`**（SKILL.md + topic-map.md）+ 内部 `pnpm indexes:rebuild` を完遂。`all skill / index conflicts resolved` exit 0。今回は keywords.json が CONFLICT に上がらなかったため `taking --ours for N derived files` 行は **0**（前回 1st pass は keywords `--ours` 1 だった）。
- **核心データポイント（振動則 L-DEVSYNC-097/101 の精緻化＝反例ではなく境界条件の明確化）**: 同日 1st pass（7 コミット取込）は union member 5 + keywords `--ours` だったが、本 2nd pass（1 コミット取込）は union member 2 + `--ours` 0 に縮小。これにより「union member は behind 数に依らず常に skill コア 5 固定」という 1st pass 時点の仮説を**修正**: 正しくは **union member 集合 = 取込デルタが実際に touch する skill ファイルの集合**であり、behind 数が小さく取込コミットが skill core の一部（ここでは audit 文脈で SKILL.md と topic-map.md のみ）しか触らなければ union member もその部分集合に縮小する。`union-resolving N files` の N は固定値ではなく取込内容依存、ログで実数確認が必須、という運用結論を補強。
- 検証順: `git fetch --prune origin`（dev=origin/dev `6e7b3e344` 一致・独自コミット 0）→ `git rev-list --left-right --count origin/dev...HEAD` = 1/4 → `git log HEAD..dev` = #1139 単一 → `git merge dev --no-edit` で CONFLICT 2 → `pnpm sync:resolve`（`union-resolving 2 files` + rebuild + `all skill / index conflicts resolved`）→ `git diff --name-only --diff-filter=U` = 0 / 実マーカー `<<<<<<<`・`>>>>>>>` 0 件 → `git commit --no-edit`（merge commit `1d7f537d9`・lefthook 全 pass・staged-task-dir-guard は MERGE_HEAD で auto-skip）→ `pnpm typecheck` / `pnpm lint` / `pnpm verify:static-manifest` / `pnpm indexes:rebuild` 冪等。CI failure なし。
- 反映先: 本 changelog（振動則の境界条件精緻化）。新規 lesson 番号は SSOT インフレ回避のため起こさず、L-DEVSYNC-097/101 の適用範囲明確化として記録。
